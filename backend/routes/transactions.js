import express from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  uploadReceipt,
  getTransactionStats
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const transactionValidation = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid date'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'])
    .withMessage('Invalid payment method'),
  body('subcategory')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters')
];

const updateTransactionValidation = [
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid date'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'])
    .withMessage('Invalid payment method'),
  body('subcategory')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters')
];

// Apply authentication to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getTransactions)  
  .post(uploadSingle, handleUploadError, transactionValidation, createTransaction);

router.get('/stats', protect, getTransactionStats);

router.post('/upload-receipt', uploadSingle, handleUploadError, uploadReceipt);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransactionValidation, updateTransaction)
  .delete(deleteTransaction);

export default router;
 