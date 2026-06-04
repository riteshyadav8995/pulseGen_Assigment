import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Grid3X3, List, RefreshCw, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import VideoCard from '../components/VideoCard';
import api from '../api/axios';

const FILTERS = ['all', 'safe', 'flagged', 'processing', 'pending'];

const VideoLibrary = () => {
  const { user } = useAuth();
  const [videos, setVideos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [viewMode, setViewMode] = useState('grid');

  const canDelete = user?.role === 'editor' || user?.role === 'admin';

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (filter !== 'all') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());

      const { data } = await api.get(`/videos?${params}`);
      setVideos(data.videos);
      setPagination(data.pagination);
    } catch (_) {}
    finally { setLoading(false); }
  }, [filter, page, search]);

  useEffect(() => {
    const t = setTimeout(fetchVideos, 300);
    return () => clearTimeout(t);
  }, [fetchVideos]);

  const handleDelete = (id) =>
    setVideos((prev) => prev.filter((v) => v._id !== id));

  const FilterBadge = ({ value }) => (
    <button
      onClick={() => { setFilter(value); setPage(1); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200
        ${filter === value
          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
          : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-300'
        }`}
    >
      {value}
    </button>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Video Library</h1>
            <p className="text-slate-400 mt-1">
              {pagination.total} video{pagination.total !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <button
            onClick={fetchVideos}
            className="btn-secondary"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="library-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title..."
              className="input pl-10 py-2.5 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-500" />
            {FILTERS.map((f) => <FilterBadge key={f} value={f} />)}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-brand-500/30 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-brand-500/30 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-600">
            <Video size={48} className="opacity-25" />
            <div className="text-center">
              <p className="font-medium text-slate-400">No videos found</p>
              <p className="text-sm mt-1">
                {search || filter !== 'all' ? 'Try adjusting your filters' : 'Upload your first video to get started'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="flex flex-col gap-2">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 text-xs disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                  ${p === page
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn-secondary px-4 py-2 text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VideoLibrary;
