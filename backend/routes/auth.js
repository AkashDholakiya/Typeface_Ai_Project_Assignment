import express from 'express';
import { body, check } from 'express-validator';
import { register, login, getCurrentUser, updateProfile, checkPassword, deleteAccount } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const checkPasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.post('/check-password', protect, checkPasswordValidation, checkPassword);
router.delete('/delete-account', protect, deleteAccountValidation, deleteAccount);

export default router;
