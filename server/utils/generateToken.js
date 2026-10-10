import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'cineverse_super_secret_jwt_key_2026';

export const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;
