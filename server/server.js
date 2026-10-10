import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Startup validation for production security
if (process.env.NODE_ENV === 'production') {
  const missingSecrets = [];
  if (!process.env.JWT_SECRET) missingSecrets.push('JWT_SECRET');
  if (!process.env.MONGODB_URI) missingSecrets.push('MONGODB_URI');

  if (missingSecrets.length > 0) {
    console.error(`FATAL CONFIGURATION ERROR: Missing required production environment variables: ${missingSecrets.join(', ')}`);
    process.exit(1);
  }
}

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
