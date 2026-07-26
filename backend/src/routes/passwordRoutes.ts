import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/request';
import { historyModel } from '../models/historyModel';

const router = express.Router();

/**
 * @route   POST /api/passwords/check-reuse
 * @desc    Check if a password has been previously used
 * @access  Private
 */
router.post('/check-reuse', protect, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;
    const userId = req.user?.id;

    if (!password) {
      return res.status(400).json({ message: 'Please provide a password to check' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User context not found' });
    }

    // Hash the password with SHA-256
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Check history
    const isReused = await historyModel.checkHistory(userId, passwordHash);

    res.json({
      success: true,
      reused: isReused,
    });
  } catch (error) {
    console.error('Check password reuse error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/passwords/save-history
 * @desc    Save a password hash to the user's history
 * @access  Private
 */
router.post('/save-history', protect, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;
    const userId = req.user?.id;

    if (!password) {
      return res.status(400).json({ message: 'Please provide a password to save' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User context not found' });
    }

    // Hash the password with SHA-256
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Check if already in history first
    const isAlreadyInHistory = await historyModel.checkHistory(userId, passwordHash);
    if (isAlreadyInHistory) {
      return res.status(400).json({
        success: false,
        message: 'Password is already in history.',
      });
    }

    // Save to history
    await historyModel.addHistory(userId, passwordHash);

    res.json({
      success: true,
      message: 'Password successfully saved to your history.',
    });
  } catch (error) {
    console.error('Save password history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
