import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, HardDrive, Calendar, Shield, AlertTriangle,
  CheckCircle, Tag, User, BarChart2, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const ScoreBar = ({ label, value, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${color}`}>{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700`}
        style={{ width: `${value * 100}%`, background: value > 0.6 ? '#ef4444' : value > 0.35 ? '#f59e0b' : '#10b981' }}
      />
    </div>
  </div>
);

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const videoRef = useRef(null);
  const hasCountedView = useRef(false);  // prevents double-counting on pause/resume
  const [video, setVideo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Reset view flag when video id changes
  useEffect(() => { hasCountedView.current = false; }, [id]);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/videos/${id}`);
        setVideo(data.video);
      } catch (err) {
        setError(err.response?.data?.message || 'Video not found');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  // Called when user actually presses play
  const handlePlay = async () => {
    if (hasCountedView.current) return;  // only count once per session
    hasCountedView.current = true;
    try {
      await api.post(`/videos/${id}/view`);
      setVideo((prev) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
    } catch {
      // silently ignore — view count is non-critical
    }
  };

  // Build absolute stream URL — relative '/api' only works locally via Vite proxy.
  // In production (Vercel), we must point directly at the Render backend.
  const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
  const streamUrl = `${BASE}/videos/stream/${id}?token=${token}`;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-500">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-white font-medium">{error}</p>
          <button onClick={() => navigate('/library')} className="btn-secondary">
            <ArrowLeft size={14} /> Back to Library
          </button>
        </div>
      </Layout>
    );
  }

  const isFlagged = video?.status === 'flagged';
  const details = video?.sensitivityDetails;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in">
        {/* Back */}
        <button
          onClick={() => navigate('/library')}
          className="btn-secondary text-sm py-2"
        >
          <ArrowLeft size={15} />
          Back to Library
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Video Player ─────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Warning banner */}
            {isFlagged && (
              <div className="glass border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">
                  This video has been flagged for sensitive content. Viewer discretion advised.
                </p>
              </div>
            )}

            {/* Player */}
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-glass">
              {video?.status === 'processing' || video?.status === 'pending' ? (
                <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-surface-800">
                  <Loader2 size={36} className="text-brand-400 animate-spin" />
                  <p className="text-slate-400 text-sm">Video is still being processed...</p>
                  <div className="w-48">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${video.processingProgress || 0}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <video
                  id="video-player"
                  ref={videoRef}
                  controls
                  className="w-full aspect-video"
                  src={streamUrl}
                  preload="metadata"
                  onPlay={handlePlay}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Title & meta */}
            <div className="glass p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-white leading-snug">{video?.title}</h1>
                <StatusBadge status={video?.status} />
              </div>

              {video?.description && (
                <p className="text-sm text-slate-400">{video.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} /> {video?.views} views
                </span>
                <span className="flex items-center gap-1.5">
                  <HardDrive size={13} /> {formatBytes(video?.size)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {formatDate(video?.createdAt)}
                </span>
                {video?.owner && (
                  <span className="flex items-center gap-1.5">
                    <User size={13} /> {video.owner.name}
                  </span>
                )}
              </div>

              {/* Tags */}
              {video?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Tag size={13} className="text-slate-500 mt-0.5" />
                  {video.tags.map((t) => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full text-xs bg-brand-500/15 text-brand-300 border border-brand-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sensitivity Panel ─────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Overall score */}
            <div className={`glass p-5 space-y-4 ${isFlagged ? 'border-red-500/20 bg-red-500/5' : video?.status === 'safe' ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Shield size={16} className="text-brand-400" />
                Sensitivity Analysis
              </h2>

              {video?.sensitivityScore !== null && video?.sensitivityScore !== undefined ? (
                <>
                  {/* Score dial */}
                  <div className="flex flex-col items-center py-4">
                    <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4
                      ${isFlagged ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}
                    >
                      <span className={`text-3xl font-bold ${isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
                        {(video.sensitivityScore * 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {isFlagged
                        ? <AlertTriangle size={16} className="text-red-400" />
                        : <CheckCircle size={16} className="text-emerald-400" />
                      }
                      <span className={`font-semibold text-sm ${isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isFlagged ? 'Content Flagged' : 'Content Safe'}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  {details && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <BarChart2 size={12} /> Category Breakdown
                      </p>
                      <ScoreBar
                        label="Violence"
                        value={details.violence}
                        color={details.violence > 0.5 ? 'text-red-400' : 'text-emerald-400'}
                      />
                      <ScoreBar
                        label="Adult Content"
                        value={details.adult}
                        color={details.adult > 0.5 ? 'text-red-400' : 'text-emerald-400'}
                      />
                      <ScoreBar
                        label="Hate Speech"
                        value={details.hate}
                        color={details.hate > 0.5 ? 'text-red-400' : 'text-emerald-400'}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-slate-600 text-sm">
                  {video?.status === 'processing'
                    ? 'Analysis in progress...'
                    : 'Analysis not yet run'}
                </div>
              )}
            </div>

            {/* Threshold legend */}
            <div className="glass p-4 space-y-2">
              <p className="text-xs font-medium text-slate-500">Threshold Guide</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-slate-400">0–35% → Safe</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0" /><span className="text-slate-400">35–60% → Borderline</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" /><span className="text-slate-400">60%+ → Flagged</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoPlayer;
