import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cineverse';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`🍃 MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection not available: ${error.message}`);
    console.log('ℹ️ Operating in resilient hybrid mode: TMDB Movie discovery & streaming information is 100% active!');
  }
};

export const getDBStatus = () => isConnected;

export default connectDB;
