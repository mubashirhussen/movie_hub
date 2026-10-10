import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
    movieTitle: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: '',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

historySchema.index({ userId: 1, movieId: 1 });

const History = mongoose.model('History', historySchema);

export default History;
