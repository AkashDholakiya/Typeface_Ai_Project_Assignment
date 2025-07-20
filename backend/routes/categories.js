import express from 'express';
import {
  getCategories,
} from '../controllers/categoryController.js';

const router = express.Router();

// Routes
router.get('/', getCategories);

export default router;
