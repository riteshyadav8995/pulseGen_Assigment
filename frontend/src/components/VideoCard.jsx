import { useNavigate } from 'react-router-dom';
import { Play, Eye, Trash2, Clock, HardDrive } from 'lucide-react';
import StatusBadge from './StatusBadge';
import api from '../api/axios';
import toast from 'react-hot-toast';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const VideoCard = ({ video, onDelete, canDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/videos/${video._id}`);
      toast.success('Video deleted');
      onDelete?.(video._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const scoreColor = (score) => {
    if (score === null || score === undefined) return 'text-slate-400';
    if (score < 0.3) return 'text-emerald-400';
    if (score < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const isProcessingOrPending = video.status === 'processing' || video.status === 'pending';

  return (
    <div
      className="glass group flex flex-col overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => !isProcessingOrPending && navigate(`/player/${video._id}`)}
    >
      {/* Thumbnail / Placeholder */}
      <div className="relative bg-surface-700 h-44 flex items-center justify-center overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-violet-900/40" />

        {/* Video icon */}
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/15 group-hover:scale-110 transition-transform duration-300">
          {isProcessingOrPending ? (
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={22} className="text-white ml-1" fill="white" />
          )}
        </div>

        {/* Processing progress bar */}
        {video.status === 'processing' && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-white/10">
              <div
                className="progress-fill h-full"
                style={{ width: `${video.processingProgress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={video.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
          {video.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <HardDrive size={11} />
            {formatBytes(video.size)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDate(video.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {video.views}
          </span>
        </div>

        {/* Sensitivity score */}
        {video.sensitivityScore !== null && video.sensitivityScore !== undefined && (
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500">Sensitivity</span>
            <span className={`font-semibold ${scoreColor(video.sensitivityScore)}`}>
              {(video.sensitivityScore * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {video.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-brand-500/15 text-brand-300 border border-brand-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/player/${video._id}`); }}
          disabled={isProcessingOrPending}
          className="btn-primary flex-1 justify-center text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={13} />
          Play
        </button>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="btn-danger px-3 py-2 text-xs"
            title="Delete video"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
