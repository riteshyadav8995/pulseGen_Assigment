const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  recordView,
  deleteVideo,
  getStats,
} = require('../controllers/videoController');

// ─── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /video\/(mp4|avi|mkv|mov|webm|x-msvideo|quicktime|x-matroska)/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, avi, mkv, mov, webm)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// NOTE: specific routes MUST come before /:id to avoid conflicts
router.get('/stats', protect, getStats);

router.post(
  '/upload',
  protect,
  authorize('editor', 'admin'),
  upload.single('video'),
  uploadVideo
);

router.get('/', protect, getVideos);

router.get('/stream/:id', protect, streamVideo);

router.post('/:id/view', protect, recordView);

router.get('/:id', protect, getVideo);

router.delete('/:id', protect, authorize('editor', 'admin'), deleteVideo);

module.exports = router;
