const Video = require('../models/Video');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulated sensitivity analysis pipeline.
 * Emits real-time Socket.io events at each processing stage.
 */
const processVideo = async (videoId, io) => {
  try {
    // --- Start ---
    io.emit(`processing:start:${videoId}`, {
      videoId,
      message: 'Sensitivity analysis started',
    });

    await Video.findByIdAndUpdate(videoId, {
      status: 'processing',
      processingProgress: 0,
    });

    const stages = [
      { progress: 10, step: 'Extracting key frames from video...' },
      { progress: 25, step: 'Running object detection models...' },
      { progress: 40, step: 'Analyzing frame-level content...' },
      { progress: 55, step: 'Running violence detection classifier...' },
      { progress: 68, step: 'Running adult content classifier...' },
      { progress: 80, step: 'Running hate speech audio analysis...' },
      { progress: 92, step: 'Aggregating sensitivity scores...' },
      { progress: 97, step: 'Generating classification report...' },
    ];

    for (const { progress, step } of stages) {
      // Realistic variable delay: 800ms – 1800ms per step
      await delay(800 + Math.random() * 1000);

      await Video.findByIdAndUpdate(videoId, { processingProgress: progress });

      io.emit(`processing:progress:${videoId}`, { videoId, progress, step });
    }

    // --- Compute final scores ---
    const violence = parseFloat((Math.random() * 0.9).toFixed(3));
    const adult    = parseFloat((Math.random() * 0.85).toFixed(3));
    const hate     = parseFloat((Math.random() * 0.6).toFixed(3));

    // Weighted composite score
    const sensitivityScore = parseFloat(
      (violence * 0.4 + adult * 0.4 + hate * 0.2).toFixed(3)
    );

    // Flagged if composite score > 0.38
    const status = sensitivityScore > 0.38 ? 'flagged' : 'safe';

    await Video.findByIdAndUpdate(videoId, {
      status,
      sensitivityScore,
      sensitivityDetails: { violence, adult, hate },
      processingProgress: 100,
    });

    io.emit(`processing:complete:${videoId}`, {
      videoId,
      status,
      sensitivityScore,
      sensitivityDetails: { violence, adult, hate },
    });

    console.log(`✅ Video ${videoId} processed — ${status} (score: ${sensitivityScore})`);
  } catch (error) {
    console.error(`❌ Error processing video ${videoId}:`, error.message);
    await Video.findByIdAndUpdate(videoId, { status: 'error' });
    io.emit(`processing:error:${videoId}`, {
      videoId,
      error: error.message,
    });
  }
};

module.exports = { processVideo };
