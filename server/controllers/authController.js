import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { getDBStatus } from '../config/db.js';

// In-memory user store fallback if MongoDB is not locally running
const inMemoryUsers = [];

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password)',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if MongoDB is connected
    if (getDBStatus()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'user',
      });

      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
          },
        },
      });
    } else {
      // In-memory fallback
      const existing = inMemoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const mockUser = {
        _id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      inMemoryUsers.push(mockUser);

      const token = generateToken(mockUser._id, mockUser.role);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            avatar: mockUser.avatar,
            createdAt: mockUser.createdAt,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    if (getDBStatus()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
          },
        },
      });
    } else {
      // In-memory fallback
      const user = inMemoryUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        // Quick demo check
        if (email.toLowerCase() === 'moviegeek@example.com' && password === 'cinewave123') {
          const demoUser = {
            id: 'demo_user_1',
            name: 'CineVerse Fan',
            email: 'moviegeek@example.com',
            role: 'user',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
          };
          const token = generateToken(demoUser.id, demoUser.role);
          return res.status(200).json({
            success: true,
            message: 'Logged in with Demo Account',
            data: { token, user: demoUser },
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user._id, user.role);
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User session not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: req.user._id || req.user.id,
        name: req.user.name || 'CineVerse User',
        email: req.user.email || '',
        role: req.user.role || 'user',
        avatar: req.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: req.user.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe };
