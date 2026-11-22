import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiPhone, FiMapPin, FiArrowDown } from 'react-icons/fi';
import api from '../api';
import heroMaroon from '../assets/hero-maroon.jpg';
import allcollection2 from '../assets/allcollection2.webp';
import rkSareesImg from '../assets/riyatex.jpeg';

const defaultSlides = [
  {
    id: 1,
    image: heroMaroon,
    badge: '✦ HANDWOVEN HERITAGE',
    title: 'EXPLORE THE COLLECTION',
    subtitle: 'Authentic Silk & Handcrafted Perfection',
    description: 'Immerse yourself in timeless South Indian elegance. Pure Silk, Cotton, and Designer Sarees crafted with love.',
    primaryBtn: { text: 'ORDER NOW', link: '/shopping' },
    secondaryBtn: { text: 'SILK SAREES', link: '/shopping?fabric=Silk' },
  },
  {
    id: 2,
    image: allcollection2,
    badge: '✦ FESTIVE & BRIDAL SPECIAL',
    title: 'HANDWOVEN PERFECTION',
    subtitle: 'Silk | Cotton | Designing Sarees',
    description: 'Celebrate your special moments with our vibrant bridal silks, breezy cottons, and bespoke designer patterns.',
    primaryBtn: { text: 'SHOP COLLECTION', link: '/shopping' },
    secondaryBtn: { text: 'COTTON SAREES', link: '/shopping?fabric=Cotton' },
  },
  {
    id: 3,
    image: rkSareesImg,
    badge: '✦ DIRECT FROM WEAVERS',
    title: 'RK SAREES',
    subtitle: 'Wholesale & Retail | Salem, Tamil Nadu',
    description: 'Authentic manufacturer prices direct from the heart of Tamil Nadu handloom hub. Quality assured on every weave.',
    primaryBtn: { text: 'VIEW ALL DESIGNS', link: '/shopping' },
    secondaryBtn: { text: 'DESIGNER SAREES', link: '/shopping?fabric=Designed' },
  },
];

const HeroSlider = () => {
  const [slides, setSlides] = useState(defaultSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const autoPlayRef = useRef(null);

  // Fetch dynamic hero slides from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchHeroSlides = async () => {
      try {
        const res = await api.get('/hero-slides');
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((item, idx) => ({
            id: item._id || idx + 1,
            image: item.image,
            badge: item.badge || '✦ HANDWOVEN HERITAGE',
            title: item.title || 'EXPLORE THE COLLECTION',
            subtitle: item.subtitle || '',
            description: item.description || '',
            primaryBtn: {
              text: item.primaryBtnText || 'ORDER NOW',
              link: item.primaryBtnLink || '/shopping',
            },
            secondaryBtn: {
              text: item.secondaryBtnText || 'SILK SAREES',
              link: item.secondaryBtnLink || '/shopping?fabric=Silk',
            },
          }));
          setSlides(formatted);
        }
      } catch (err) {
        // Fallback gracefully to default slides if offline or error
        console.log('Using default hero slides fallback');
      }
    };

    fetchHeroSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure current index is within bounds when slides count changes
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-scroll slides from left to right every 4.5 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, currentIndex, slides.length]);

  const handlePrev = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || slides.length <= 1) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext(); // Swiped left -> show next
    } else if (distance < -minSwipeDistance) {
      handlePrev(); // Swiped right -> show prev
    }

    setTouchStartX(0);
    setTouchEndX(0);
  };

  const scrollToCategories = () => {
    const el = document.getElementById('categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="relative w-full h-[85vh] min-h-[580px] max-h-[820px] overflow-hidden bg-[#1f1712] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      id="home"
    >
      {/* Slides Track - Smooth Horizontal Auto Scroll */}
      <div
        className="flex w-full h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id || index} className="relative w-full h-full flex-shrink-0">
            {/* Background Image with subtle zoom on active */}
            <img
              src={slide.image}
              alt={slide.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = heroMaroon;
              }}
              className={`w-full h-full object-cover object-center transition-transform duration-1000 ease-out ${
                index === currentIndex ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Gradient Overlays for contrast & readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />

            {/* Slide Text Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10">
              <div className="max-w-4xl mx-auto flex flex-col items-center">
                {/* Gold Pill Badge */}
                {slide.badge && (
                  <span className="inline-block px-4 py-1.5 mb-4 text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#f3e5ab] bg-[#c5a070]/20 border border-[#c5a070]/40 rounded-full backdrop-blur-sm shadow-md uppercase">
                    {slide.badge}
                  </span>
                )}

                {/* Main Heading */}
                <h1
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-[0.12em] sm:tracking-[0.16em] mb-3 leading-tight"
                  style={{ textShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
                >
                  {slide.title}
                </h1>

                {/* Subtitle */}
                {slide.subtitle && (
                  <h2 className="text-xs sm:text-sm md:text-base text-[#f3e5ab] uppercase tracking-[0.25em] sm:tracking-[0.3em] font-medium mb-4 drop-shadow-md">
                    {slide.subtitle}
                  </h2>
                )}

                {/* Description */}
                {slide.description && (
                  <p className="text-xs sm:text-sm md:text-base text-white/85 font-light max-w-2xl mb-8 leading-relaxed drop-shadow">
                    {slide.description}
                  </p>
                )}

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {slide.primaryBtn?.text && (
                    <Link to={slide.primaryBtn.link || '/shopping'}>
                      <button className="bg-gradient-to-r from-[#c5a070] to-[#b08d60] hover:from-[#d4af37] hover:to-[#c5a070] text-white px-8 sm:px-10 py-3.5 sm:py-4 font-semibold uppercase tracking-[0.2em] text-[11px] sm:text-xs rounded-full shadow-[0_10px_30px_rgba(197,160,112,0.4)] hover:shadow-[0_15px_40px_rgba(197,160,112,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20">
                        {slide.primaryBtn.text}
                      </button>
                    </Link>
                  )}

                  {slide.secondaryBtn?.text && (
                    <Link to={slide.secondaryBtn.link || '/shopping?fabric=Silk'}>
                      <button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-6 sm:px-8 py-3.5 sm:py-4 font-semibold uppercase tracking-[0.2em] text-[11px] sm:text-xs rounded-full border border-white/30 hover:border-white/60 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md">
                        {slide.secondaryBtn.text}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center rounded-full bg-black/30 hover:bg-[#c5a070] text-white border border-white/20 backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer group"
          >
            <FiChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center rounded-full bg-black/30 hover:bg-[#c5a070] text-white border border-white/20 backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer group"
          >
            <FiChevronRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* Bottom Bar: Indicators & Contact Badge */}
      <div className="absolute bottom-5 sm:bottom-7 inset-x-0 z-20 flex flex-col items-center gap-4 pointer-events-none px-4">
        {/* Slide Indicator Pills */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2.5 pointer-events-auto bg-black/40 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md shadow-md">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
                  index === currentIndex
                    ? 'w-8 bg-[#c5a070] shadow-[0_0_12px_rgba(197,160,112,0.8)]'
                    : 'w-2.5 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Contact Badge Pill (Glassmorphism) */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-white/90 font-medium tracking-widest px-5 py-2 rounded-full border border-white/20 shadow-lg backdrop-blur-md bg-black/35">
          <a
            href="tel:+918428256334"
            className="flex items-center gap-2 hover:text-[#f3e5ab] transition-colors"
          >
            <FiPhone className="w-3.5 h-3.5 text-[#c5a070]" />
            +91 8428256334
          </a>
          <span className="hidden sm:inline-block w-px h-3.5 bg-white/25" />
          <a
            href="tel:+916380308150"
            className="flex items-center gap-2 hover:text-[#f3e5ab] transition-colors"
          >
            <FiPhone className="w-3.5 h-3.5 text-[#c5a070]" />
            +91 6380308150
          </a>
          <span className="hidden sm:inline-block w-px h-3.5 bg-white/25" />
          <span className="flex items-center gap-2">
            <FiMapPin className="w-3.5 h-3.5 text-[#c5a070]" />
            VEERANAM MAIN ROAD, SALEM - 636003
          </span>
        </div>
      </div>

      {/* Auto-scroll progress line at top of hero */}
      <div className="absolute top-0 inset-x-0 h-1 bg-white/10 z-20 overflow-hidden">
        <div
          key={currentIndex}
          className={`h-full bg-gradient-to-r from-[#c5a070] to-[#f3e5ab] transition-all ${
            isPaused ? 'w-full opacity-50' : 'w-full animate-[progress_4.5s_linear]'
          }`}
          style={{
            animation: isPaused ? 'none' : 'heroProgress 4.5s linear infinite',
          }}
        />
      </div>

      {/* Scroll Down Hint button */}
      <button
        onClick={scrollToCategories}
        aria-label="Scroll to collections"
        className="hidden md:flex absolute bottom-6 right-8 z-20 pointer-events-auto items-center gap-2 text-[10px] tracking-[0.2em] text-white/70 hover:text-white uppercase transition-colors group cursor-pointer"
      >
        <span>Explore</span>
        <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center group-hover:border-[#c5a070] group-hover:text-[#c5a070] transition-colors">
          <FiArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </button>
    </div>
  );
};

export default HeroSlider;
