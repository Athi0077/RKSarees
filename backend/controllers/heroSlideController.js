import HeroSlide from '../models/HeroSlide.js';

export const DEFAULT_HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=80',
    badge: '✦ HANDWOVEN HERITAGE',
    title: 'EXPLORE THE COLLECTION',
    subtitle: 'Authentic Silk & Handcrafted Perfection',
    description: 'Immerse yourself in timeless South Indian elegance. Pure Silk, Cotton, and Designer Sarees crafted with love.',
    primaryBtnText: 'ORDER NOW',
    primaryBtnLink: '/shopping',
    secondaryBtnText: 'SILK SAREES',
    secondaryBtnLink: '/shopping?fabric=Silk',
    order: 1,
    isActive: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1920&q=80',
    badge: '✦ FESTIVE & BRIDAL SPECIAL',
    title: 'HANDWOVEN PERFECTION',
    subtitle: 'Silk | Cotton | Designing Sarees',
    description: 'Celebrate your special moments with our vibrant bridal silks, breezy cottons, and bespoke designer patterns.',
    primaryBtnText: 'SHOP COLLECTION',
    primaryBtnLink: '/shopping',
    secondaryBtnText: 'COTTON SAREES',
    secondaryBtnLink: '/shopping?fabric=Cotton',
    order: 2,
    isActive: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=80',
    badge: '✦ DIRECT FROM WEAVERS',
    title: 'RK SAREES',
    subtitle: 'Wholesale & Retail | Salem, Tamil Nadu',
    description: 'Authentic manufacturer prices direct from the heart of Tamil Nadu handloom hub. Quality assured on every weave.',
    primaryBtnText: 'VIEW ALL DESIGNS',
    primaryBtnLink: '/shopping',
    secondaryBtnText: 'DESIGNER SAREES',
    secondaryBtnLink: '/shopping?fabric=Designed',
    order: 3,
    isActive: true,
  },
];

// Helper to auto-seed if empty
const ensureInitialSlides = async () => {
  const count = await HeroSlide.countDocuments();
  if (count === 0) {
    try {
      await HeroSlide.insertMany(DEFAULT_HERO_SLIDES);
      console.log('Auto-seeded default hero slides into database');
    } catch (e) {
      console.error('Error auto-seeding hero slides:', e);
    }
  }
};

// GET /api/hero-slides (public or admin query)
export const getHeroSlides = async (req, res) => {
  try {
    await ensureInitialSlides();
    const query = req.query.all === 'true' ? {} : { isActive: true };
    const slides = await HeroSlide.find(query).sort({ order: 1, createdAt: 1 });
    res.status(200).json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    res.status(500).json({ message: 'Server error fetching hero slides', error: error.message });
  }
};

// GET /api/hero-slides/:id
export const getHeroSlideById = async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ message: 'Hero slide not found' });
    }
    res.status(200).json(slide);
  } catch (error) {
    console.error('Error fetching hero slide by id:', error);
    res.status(500).json({ message: 'Server error fetching hero slide', error: error.message });
  }
};

// POST /api/hero-slides (Admin only)
export const createHeroSlide = async (req, res) => {
  try {
    const {
      image,
      badge,
      title,
      subtitle,
      description,
      primaryBtnText,
      primaryBtnLink,
      secondaryBtnText,
      secondaryBtnLink,
      order,
      isActive,
    } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newSlide = new HeroSlide({
      image,
      badge: badge !== undefined ? badge : '✦ HANDWOVEN HERITAGE',
      title: title || 'EXPLORE THE COLLECTION',
      subtitle: subtitle !== undefined ? subtitle : 'Authentic Silk & Handcrafted Perfection',
      description: description !== undefined ? description : '',
      primaryBtnText: primaryBtnText || 'ORDER NOW',
      primaryBtnLink: primaryBtnLink || '/shopping',
      secondaryBtnText: secondaryBtnText || 'SILK SAREES',
      secondaryBtnLink: secondaryBtnLink || '/shopping?fabric=Silk',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const savedSlide = await newSlide.save();
    res.status(201).json(savedSlide);
  } catch (error) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({ message: 'Server error creating hero slide', error: error.message });
  }
};

// PUT /api/hero-slides/:id (Admin only)
export const updateHeroSlide = async (req, res) => {
  try {
    const updatedSlide = await HeroSlide.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedSlide) {
      return res.status(404).json({ message: 'Hero slide not found' });
    }

    res.status(200).json(updatedSlide);
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ message: 'Server error updating hero slide', error: error.message });
  }
};

// DELETE /api/hero-slides/:id (Admin only)
export const deleteHeroSlide = async (req, res) => {
  try {
    const deletedSlide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!deletedSlide) {
      return res.status(404).json({ message: 'Hero slide not found' });
    }
    res.status(200).json({ message: 'Hero slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    res.status(500).json({ message: 'Server error deleting hero slide', error: error.message });
  }
};

// POST /api/hero-slides/seed (Admin only) - Reset or Seed default slides
export const seedDefaultHeroSlides = async (req, res) => {
  try {
    const { overwrite } = req.body;
    if (overwrite) {
      await HeroSlide.deleteMany({});
    }
    const slides = await HeroSlide.insertMany(DEFAULT_HERO_SLIDES);
    res.status(200).json({ message: 'Default hero slides seeded successfully', slides });
  } catch (error) {
    console.error('Error seeding hero slides:', error);
    res.status(500).json({ message: 'Server error seeding hero slides', error: error.message });
  }
};
