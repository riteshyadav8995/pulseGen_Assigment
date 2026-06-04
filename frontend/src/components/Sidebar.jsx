import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Library,
  LogOut,
  Shield,
  Zap,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ROLE_COLORS = {
  admin:  'from-amber-500 to-orange-500',
  editor: 'from-brand-500 to-violet-600',
  viewer: 'from-slate-500 to-slate-600',
};

const ROLE_LABELS = {
  admin:  'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/library',   icon: Library,         label: 'Video Library' },
    ...(user?.role !== 'viewer'
      ? [{ to: '/upload', icon: Upload, label: 'Upload Video' }]
      : []),
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface-800/90 backdrop-blur-xl border-r border-white/8 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">VideoVault</h1>
            <p className="text-slate-500 text-xs mt-0.5">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 flex flex-col gap-1 sidebar-scroll overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2">
          Navigation
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Socket status */}
      <div className="px-6 py-3 border-t border-white/8">
        <div className="flex items-center gap-2 text-xs">
          {connected ? (
            <>
              <Wifi size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Real-time connected</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-slate-500" />
              <span className="text-slate-500">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-white/8">
        <div className="glass-dark p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${ROLE_COLORS[user?.role] || 'from-slate-500 to-slate-600'} flex items-center justify-center flex-shrink-0`}>
            <User size={15} className="text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield size={10} className="text-brand-400" />
              <span className="text-xs text-brand-400 font-medium">
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all duration-200"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
