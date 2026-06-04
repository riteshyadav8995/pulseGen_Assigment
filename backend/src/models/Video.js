const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: { type: String, default: '', maxlength: 500 },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'safe', 'flagged', 'error'],
      default: 'pending',
    },
    sensitivityScore: { type: Number, default: null, min: 0, max: 1 },
    sensitivityDetails: {
      violence: { type: Number, default: 0 },
      adult:    { type: Number, default: 0 },
      hate:     { type: Number, default: 0 },
    },
    processingProgress: { type: Number, default: 0, min: 0, max: 100 },
    duration: { type: Number, default: 0 }, // seconds
    tags: [{ type: String, trim: true }],
    views: { type: Number, default: 0 },
    thumbnail: { type: String, default: null },
  },
  { timestamps: true }
);

// Indexes for efficient querying
videoSchema.index({ owner: 1, status: 1 });
videoSchema.index({ title: 'text' });

module.exports = mongoose.model('Video', videoSchema);
