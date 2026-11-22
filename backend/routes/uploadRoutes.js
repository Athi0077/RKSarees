import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for products (up to 1000x1000)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'riyatex_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Storage for hero banner slides (supports high resolution landscape images up to 2560x1440)
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'riyatex_banners',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 2560, height: 1440, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({ storage: storage });
const bannerUpload = multer({ storage: bannerStorage });

// Existing multi-image upload endpoint (used by Sarees management)
router.post('/upload', authMiddleware, adminMiddleware, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Cloudinary returns the secure_url for each uploaded file in file.path
    const imageUrls = req.files.map(file => file.path);
    
    res.status(200).json({ urls: imageUrls });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error uploading images' });
  }
});

// Hero Banner upload endpoint (single file upload for hero sliders)
router.post('/upload/banner', authMiddleware, adminMiddleware, bannerUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No banner image uploaded' });
    }
    res.status(200).json({ url: req.file.path });
  } catch (error) {
    console.error('Banner Upload Error:', error);
    res.status(500).json({ message: 'Error uploading banner image', error: error.message });
  }
});

export default router;
