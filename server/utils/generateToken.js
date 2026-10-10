import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production');
    }
    return 'dev_only_jwt_secret_please_set_in_env';
  }
  return process.env.JWT_SECRET;
};

export const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

export default generateToken;
