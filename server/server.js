import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  console.log(`🎬 CineVerse Server is running smoothly on http://localhost:${PORT}`);
});

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Server Rejection:', err);
});

export default server;
