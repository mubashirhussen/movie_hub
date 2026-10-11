import mongoose from 'mongoose';

const reviewReportSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: {
        values: ['harassment', 'spam', 'hate_speech', 'unmarked_spoiler', 'other'],
        message: 'Invalid report reason provided',
      },
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Report details cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports on the same review by the same user
reviewReportSchema.index({ reviewId: 1, reportedBy: 1 }, { unique: true });

const ReviewReport = mongoose.model('ReviewReport', reviewReportSchema);

export default ReviewReport;
