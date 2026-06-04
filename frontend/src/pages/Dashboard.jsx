import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video, ShieldCheck, AlertTriangle, Loader2, HardDrive,
  TrendingUp, Upload, ArrowRight, Clock
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const StatCard = ({ icon: Icon, label, value, sub, color, gradient }) => (
  <div className={`stat-card relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${color}`} />
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const COLORS = {
  safe:       '#10b981',
  flagged:    '#ef4444',
  processing: '#f59e0b',
  pending:    '#64748b',
};

const Dashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/videos/stats');
      setStats(data.stats);
      setRecentVideos(data.recentVideos || []);
    } catch (_) {/* handled by interceptor */}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh stats when a video finishes processing
  useEffect(() => {
    const unsubs = [];
    // We listen globally for any complete event
    if (recentVideos.length) {
      recentVideos.forEach((v) => {
        const off = subscribe(`processing:complete:${v._id}`, () => fetchStats());
        if (off) unsubs.push(off);
      });
    }
    return () => unsubs.forEach((fn) => fn?.());
  }, [recentVideos]);

  const pieData = stats
    ? [
        { name: 'Safe',       value: stats.safe,       fill: COLORS.safe },
        { name: 'Flagged',    value: stats.flagged,     fill: COLORS.flagged },
        { name: 'Processing', value: stats.processing,  fill: COLORS.processing },
        { name: 'Pending',    value: stats.pending,     fill: COLORS.pending },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-400 mt-1">Here's your video analytics overview</p>
          </div>
          {user?.role !== 'viewer' && (
            <Link to="/upload" className="btn-primary">
              <Upload size={16} />
              Upload Video
            </Link>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={Video}
            label="Total Videos"
            value={stats?.total ?? 0}
            gradient="from-brand-500 to-brand-700"
            color="bg-brand-500"
          />
          <StatCard
            icon={ShieldCheck}
            label="Safe Videos"
            value={stats?.safe ?? 0}
            gradient="from-emerald-500 to-teal-700"
            color="bg-emerald-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="Flagged Videos"
            value={stats?.flagged ?? 0}
            gradient="from-red-500 to-rose-700"
            color="bg-red-500"
          />
          <StatCard
            icon={HardDrive}
            label="Storage Used"
            value={formatBytes(stats?.totalSize)}
            gradient="from-violet-500 to-purple-700"
            color="bg-violet-500"
          />
        </div>

        {/* Charts + Recent */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <div className="xl:col-span-1 glass p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              Content Distribution
            </h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span className="text-xs text-slate-400">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                No data yet — upload some videos!
              </div>
            )}
          </div>

          {/* Recent Videos */}
          <div className="xl:col-span-2 glass p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Clock size={16} className="text-brand-400" />
                Recent Uploads
              </h2>
              <Link to="/library" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {recentVideos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-600 py-8">
                <Video size={36} className="opacity-30" />
                <p className="text-sm">No videos uploaded yet</p>
                {user?.role !== 'viewer' && (
                  <Link to="/upload" className="btn-primary text-xs py-2">
                    <Upload size={13} /> Upload your first video
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {recentVideos.map((video) => (
                  <div key={video._id} className="flex items-center gap-4 py-3.5 group">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-violet-600/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Video size={16} className="text-brand-400" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{video.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(video.createdAt)}</p>
                    </div>
                    {/* Status */}
                    <StatusBadge status={video.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Processing in progress banner */}
        {(stats?.processing > 0 || stats?.pending > 0) && (
          <div className="glass border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center gap-3">
            <Loader2 size={18} className="text-yellow-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-300">
                {stats.processing} video{stats.processing !== 1 ? 's' : ''} currently processing
                {stats.pending > 0 && `, ${stats.pending} pending`}
              </p>
              <p className="text-xs text-yellow-500/70 mt-0.5">
                Real-time updates will appear on the Upload page
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
