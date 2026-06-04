import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud, FileVideo, X, CheckCircle, AlertTriangle,
  Loader2, ChevronRight, Tag
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';
import toast from 'react-hot-toast';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ProcessingCard = ({ video, onDismiss }) => {
  const { subscribe } = useSocket();
  const [progress, setProgress] = useState(video.processingProgress || 0);
  const [step, setStep]         = useState('Initializing...');
  const [status, setStatus]     = useState(video.status);
  const [score, setScore]       = useState(null);

  useEffect(() => {
    const unsubStart    = subscribe(`processing:start:${video._id}`,    () => { setStatus('processing'); setProgress(0); });
    const unsubProgress = subscribe(`processing:progress:${video._id}`, ({ progress: p, step: s }) => { setProgress(p); setStep(s); });
    const unsubComplete = subscribe(`processing:complete:${video._id}`, ({ status: s, sensitivityScore }) => {
      setStatus(s);
      setProgress(100);
      setScore(sensitivityScore);
      setStep('Analysis complete!');
      toast[s === 'safe' ? 'success' : 'error'](
        `"${video.title}" classified as ${s.toUpperCase()}`,
        { duration: 5000 }
      );
    });
    const unsubError = subscribe(`processing:error:${video._id}`, () => {
      setStatus('error');
      toast.error(`Processing failed for "${video.title}"`);
    });
    return () => { unsubStart?.(); unsubProgress?.(); unsubComplete?.(); unsubError?.(); };
  }, [video._id]);

  const isFinished = status === 'safe' || status === 'flagged' || status === 'error';

  return (
    <div className={`glass p-5 flex flex-col gap-3 transition-all duration-300
      ${status === 'flagged' ? 'border-red-500/30 bg-red-500/5' : ''}
      ${status === 'safe'    ? 'border-emerald-500/30 bg-emerald-500/5' : ''}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-violet-600/20 border border-white/10 flex items-center justify-center flex-shrink-0">
            <FileVideo size={18} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{video.title}</p>
            <p className="text-xs text-slate-500">{formatBytes(video.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {isFinished && (
            <button onClick={() => onDismiss(video._id)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{step}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${isFinished ? (status === 'safe' ? 'bg-emerald-500' : status === 'flagged' ? 'bg-red-500' : 'bg-orange-500') : ''}`}
            style={{
              width: `${progress}%`,
              background: isFinished ? undefined : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            }}
          />
        </div>
      </div>

      {/* Score result */}
      {score !== null && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Sensitivity score:</span>
          <span className={`font-bold ${status === 'safe' ? 'text-emerald-400' : 'text-red-400'}`}>
            {(score * 100).toFixed(1)}%
          </span>
          {status === 'safe'
            ? <CheckCircle size={13} className="text-emerald-400" />
            : <AlertTriangle size={13} className="text-red-400" />
          }
        </div>
      )}
    </div>
  );
};

const Upload = () => {
  const [file, setFile]             = useState(null);
  const [form, setForm]             = useState({ title: '', description: '', tags: '' });
  const [uploading, setUploading]   = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const [processingList, setProcessingList] = useState([]);

  const onDrop = useCallback((accepted) => {
    if (accepted.length) {
      const f = accepted[0];
      setFile(f);
      setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mkv', '.mov', '.webm'] },
    maxSize: 500 * 1024 * 1024,
    maxFiles: 1,
  });

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a video file');
    if (!form.title.trim()) return toast.error('Please enter a title');

    setUploading(true);
    setUploadPct(0);

    const fd = new FormData();
    fd.append('video', file);
    fd.append('title', form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('tags', form.tags.trim());

    try {
      const { data } = await api.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      toast.success('Video uploaded! Processing started…');
      setProcessingList((prev) => [data.video, ...prev]);
      setFile(null);
      setForm({ title: '', description: '', tags: '' });
      setUploadPct(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const dismissCard = (id) =>
    setProcessingList((p) => p.filter((v) => v._id !== id));

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Upload Video</h1>
          <p className="text-slate-400 mt-1">
            Upload a video for automated sensitivity analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
              ${isDragActive
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/15 bg-white/3 hover:border-brand-500/50 hover:bg-brand-500/5'
              }`}
          >
            <input {...getInputProps()} id="video-file-input" />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <FileVideo size={26} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{file.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                  <UploadCloud size={26} className="text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isDragActive ? 'Drop it here!' : 'Drag & drop your video'}
                  </p>
                  <p className="text-sm mt-1">or click to browse</p>
                  <p className="text-xs text-slate-600 mt-2">MP4, AVI, MKV, MOV, WebM · Max 500 MB</p>
                </div>
              </div>
            )}
          </div>

          {fileRejections.length > 0 && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle size={14} />
              {fileRejections[0].errors[0].message}
            </p>
          )}

          {/* Metadata */}
          <div className="glass p-6 space-y-4">
            <h2 className="font-semibold text-white text-sm">Video Details</h2>
            <div>
              <label className="label">Title *</label>
              <input
                id="upload-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                id="upload-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional description…"
                rows={3}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Tag size={13} className="text-brand-400" /> Tags
              </label>
              <input
                id="upload-tags"
                name="tags"
                type="text"
                value={form.tags}
                onChange={handleChange}
                placeholder="news, review, tutorial (comma separated)"
                className="input"
              />
            </div>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="glass p-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Uploading...</span>
                <span>{uploadPct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}

          <button
            id="upload-submit"
            type="submit"
            disabled={!file || uploading}
            className="btn-primary w-full justify-center py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <><Loader2 size={16} className="animate-spin" /> Uploading...</>
            ) : (
              <><UploadCloud size={16} /> Upload & Analyse</>
            )}
          </button>
        </form>

        {/* Processing cards */}
        {processingList.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <ChevronRight size={16} className="text-brand-400" />
              Processing Queue ({processingList.length})
            </h2>
            {processingList.map((v) => (
              <ProcessingCard key={v._id} video={v} onDismiss={dismissCard} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Upload;
