import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userModel, User } from '../models/userModel';
import { historyModel } from '../models/historyModel';

/**
 * Generate a JWT token for the user.
 * Tokens include user id and email, with a 1-day expiry.
 */
const generateToken = (id: string, email: string): string => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: (process.env.JWT_EXPIRE as any) || '1d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Check if user already exists
    const userExists = await userModel.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const user: User = {
      id: Math.random().toString(36).substring(2, 9), // Simple ID generator
      email,
      password: hashedPassword,
    };

    await userModel.create(user);

    // 5. Store SHA-256 hash of this password in history
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    await historyModel.addHistory(user.id, sha256Hash);

    // 6. Send response with token
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        token: generateToken(user.id, user.email),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Login user / Authenticate user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // 4. Send response with token
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        token: generateToken(user.id, user.email),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
