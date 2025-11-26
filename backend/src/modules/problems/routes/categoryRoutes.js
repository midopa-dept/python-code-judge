import express from 'express';
import { categoryController } from '../controllers/categoryController.js';

const router = express.Router();

// GET /api/categories - 카테고리 목록 조회 (인증 불필요)
router.get('/categories', categoryController.getCategories);

export default router;
