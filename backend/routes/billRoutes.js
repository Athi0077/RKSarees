import express from 'express';
import { createBill, getBills, getBillById, deleteBill } from '../controllers/billController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/bills', authMiddleware, adminMiddleware, createBill);
router.get('/bills', authMiddleware, adminMiddleware, getBills);
router.get('/bills/:id', authMiddleware, adminMiddleware, getBillById);
router.delete('/bills/:id', authMiddleware, adminMiddleware, deleteBill);

export default router;
