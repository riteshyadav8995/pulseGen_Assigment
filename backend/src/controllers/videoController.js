const fs = require('fs');
const Video = require('../models/Video');
const { processVideo } = require('../services/sensitivityProcessor');

let _io = null;
const setIO = (io) => { _io = io; };

// ─── Upload ──────────────────────────────────────────────────────────────────
// POST /api/videos/upload
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title, description, tags } = req.body;

    const video = await Video.create({
      title: title?.trim() || req.file.originalname,
      description: description?.trim() || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      owner: req.user._id,
      tags: tags
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    });

    // Kick off async sensitivity processing
    if (_io) processVideo(video._id.toString(), _io);

    res.status(201).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── List Videos ─────────────────────────────────────────────────────────────
// GET /api/videos
const getVideos = async (req, res) => {
  try {
    // Admin sees all; others see only their own
    const ownerFilter =
      req.user.role === 'admin' ? {} : { owner: req.user._id };

    const { status, search, page = 1, limit = 12 } = req.query;
    const query = { ...ownerFilter };

    if (status && status !== 'all') query.status = status;
    if (search) query.$text = { $search: search };

    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      videos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Video ─────────────────────────────────────────────────────────
// GET /api/videos/:id
const getVideo = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.owner = req.user._id;

    const video = await Video.findOne(query).populate('owner', 'name email');
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment views
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ success: true, video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Stream Video ─────────────────────────────────────────────────────────────
// GET /api/videos/stream/:id
const streamVideo = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.owner = req.user._id;

    const video = await Video.findOne(query);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!fs.existsSync(video.path)) {
      return res.status(404).json({ message: 'Video file missing from disk' });
    }

    const stat = fs.statSync(video.path);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = video.mimetype || 'video/mp4';

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(video.path, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(video.path).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Video ─────────────────────────────────────────────────────────────
// DELETE /api/videos/:id
const deleteVideo = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.owner = req.user._id;

    const video = await Video.findOne(query);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Remove file from disk
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }

    await Video.deleteOne({ _id: video._id });

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Stats ─────────────────────────────────────────────────────────────────────
// GET /api/videos/stats
const getStats = async (req, res) => {
  try {
    const ownerFilter =
      req.user.role === 'admin' ? {} : { owner: req.user._id };

    const [total, safe, flagged, processing, pending, sizeResult] =
      await Promise.all([
        Video.countDocuments(ownerFilter),
        Video.countDocuments({ ...ownerFilter, status: 'safe' }),
        Video.countDocuments({ ...ownerFilter, status: 'flagged' }),
        Video.countDocuments({ ...ownerFilter, status: 'processing' }),
        Video.countDocuments({ ...ownerFilter, status: 'pending' }),
        Video.aggregate([
          { $match: ownerFilter },
          { $group: { _id: null, totalSize: { $sum: '$size' } } },
        ]),
      ]);

    const recentVideos = await Video.find(ownerFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'name');

    res.json({
      success: true,
      stats: {
        total,
        safe,
        flagged,
        processing,
        pending,
        totalSize: sizeResult[0]?.totalSize || 0,
      },
      recentVideos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  deleteVideo,
  getStats,
  setIO,
};
