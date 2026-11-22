import express from 'express';
import {
  getHeroSlides,
  getHeroSlideById,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  seedDefaultHeroSlides,
} from '../controllers/heroSlideController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route to get active slides (or all if admin specifies)
router.get('/hero-slides', getHeroSlides);
router.get('/hero-slides/:id', getHeroSlideById);

// Admin-protected routes
router.post('/hero-slides', authMiddleware, adminMiddleware, createHeroSlide);
router.put('/hero-slides/:id', authMiddleware, adminMiddleware, updateHeroSlide);
router.delete('/hero-slides/:id', authMiddleware, adminMiddleware, deleteHeroSlide);
router.post('/hero-slides/seed', authMiddleware, adminMiddleware, seedDefaultHeroSlides);

export default router;
