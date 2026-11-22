import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      trim: true,
    },
    badge: {
      type: String,
      default: '✦ HANDWOVEN HERITAGE',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      default: 'EXPLORE THE COLLECTION',
      trim: true,
    },
    subtitle: {
      type: String,
      default: 'Authentic Silk & Handcrafted Perfection',
      trim: true,
    },
    description: {
      type: String,
      default: 'Immerse yourself in timeless South Indian elegance. Pure Silk, Cotton, and Designer Sarees crafted with love.',
      trim: true,
    },
    primaryBtnText: {
      type: String,
      default: 'ORDER NOW',
      trim: true,
    },
    primaryBtnLink: {
      type: String,
      default: '/shopping',
      trim: true,
    },
    secondaryBtnText: {
      type: String,
      default: 'SILK SAREES',
      trim: true,
    },
    secondaryBtnLink: {
      type: String,
      default: '/shopping?fabric=Silk',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

export default HeroSlide;
