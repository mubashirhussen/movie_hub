import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/authMiddleware.js';

export const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

export default generateToken;
