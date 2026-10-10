import mongoose from 'mongoose';

const movieViewSchema = new mongoose.Schema(
  {
    movieId: {
      type: Number,
      required: true,
      unique: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MovieView = mongoose.model('MovieView', movieViewSchema);

export default MovieView;
