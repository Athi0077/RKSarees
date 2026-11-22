import React, { useState, useEffect } from 'react';
import { 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiUploadCloud, 
  FiEye, 
  FiX, 
  FiCheck, 
  FiArrowUp, 
  FiArrowDown,
  FiRefreshCw,
  FiExternalLink,
  FiImage
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';

const DEFAULT_IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=80';

function AdminHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('✦ HANDWOVEN HERITAGE');
  const [title, setTitle] = useState('EXPLORE THE COLLECTION');
  const [subtitle, setSubtitle] = useState('Authentic Silk & Handcrafted Perfection');
  const [description, setDescription] = useState('Immerse yourself in timeless South Indian elegance. Pure Silk, Cotton, and Designer Sarees crafted with love.');
  const [primaryBtnText, setPrimaryBtnText] = useState('ORDER NOW');
  const [primaryBtnLink, setPrimaryBtnLink] = useState('/shopping');
  const [secondaryBtnText, setSecondaryBtnText] = useState('SILK SAREES');
  const [secondaryBtnLink, setSecondaryBtnLink] = useState('/shopping?fabric=Silk');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      // Pass all=true to fetch all slides including inactive
      const res = await api.get('/hero-slides?all=true');
      setSlides(res.data);
    } catch (error) {
      console.error('Error fetching hero slides', error);
      toast.error('Failed to load hero slides');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    const toastId = toast.loading('Uploading banner image...');

    try {
      // First try the specialized banner upload endpoint
      let response;
      try {
        response = await api.post('/upload/banner', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (err) {
        // Fallback to standard upload if banner endpoint differs
        const multiFormData = new FormData();
        multiFormData.append('images', file);
        response = await api.post('/upload', multiFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const uploadedUrl = response.data.url || (response.data.urls && response.data.urls[0]);
      if (uploadedUrl) {
        setImage(uploadedUrl);
        toast.success('Image uploaded successfully!', { id: toastId });
      } else {
        toast.error('Could not get image URL from upload response', { id: toastId });
      }
    } catch (err) {
      console.error('Error uploading banner image', err);
      toast.error('Failed to upload image. You can also paste an image URL.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setImage('');
    setBadge('✦ HANDWOVEN HERITAGE');
    setTitle('EXPLORE THE COLLECTION');
    setSubtitle('Authentic Silk & Handcrafted Perfection');
    setDescription('Immerse yourself in timeless South Indian elegance. Pure Silk, Cotton, and Designer Sarees crafted with love.');
    setPrimaryBtnText('ORDER NOW');
    setPrimaryBtnLink('/shopping');
    setSecondaryBtnText('SILK SAREES');
    setSecondaryBtnLink('/shopping?fabric=Silk');
    setOrder(slides.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingId(slide._id);
    setImage(slide.image || '');
    setBadge(slide.badge || '');
    setTitle(slide.title || '');
    setSubtitle(slide.subtitle || '');
    setDescription(slide.description || '');
    setPrimaryBtnText(slide.primaryBtnText || 'ORDER NOW');
    setPrimaryBtnLink(slide.primaryBtnLink || '/shopping');
    setSecondaryBtnText(slide.secondaryBtnText || 'SILK SAREES');
    setSecondaryBtnLink(slide.secondaryBtnLink || '/shopping?fabric=Silk');
    setOrder(slide.order !== undefined ? slide.order : 1);
    setIsActive(slide.isActive !== undefined ? slide.isActive : true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!image.trim()) {
      toast.error('Please provide or upload a banner image!');
      return;
    }
    if (!title.trim()) {
      toast.error('Slide title is required!');
      return;
    }

    setSubmitting(true);
    const payload = {
      image: image.trim(),
      badge: badge.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      primaryBtnText: primaryBtnText.trim(),
      primaryBtnLink: primaryBtnLink.trim(),
      secondaryBtnText: secondaryBtnText.trim(),
      secondaryBtnLink: secondaryBtnLink.trim(),
      order: Number(order) || 0,
      isActive,
    };

    try {
      if (editingId) {
        await api.put(`/hero-slides/${editingId}`, payload);
        toast.success('Hero slide updated successfully!');
      } else {
        await api.post('/hero-slides', payload);
        toast.success('Hero slide created successfully!');
      }
      closeModal();
      fetchSlides();
    } catch (error) {
      console.error('Failed to save hero slide', error);
      toast.error(error.response?.data?.message || 'Failed to save slide.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hero slide?')) {
      try {
        await api.delete(`/hero-slides/${id}`);
        toast.success('Hero slide deleted successfully!');
        fetchSlides();
      } catch (error) {
        console.error('Failed to delete slide', error);
        toast.error('Failed to delete hero slide.');
      }
    }
  };

  const handleToggleStatus = async (slide) => {
    try {
      await api.put(`/hero-slides/${slide._id}`, {
        isActive: !slide.isActive,
      });
      toast.success(`Slide ${!slide.isActive ? 'activated' : 'deactivated'}`);
      setSlides(slides.map(s => s._id === slide._id ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      console.error('Error toggling status', error);
      toast.error('Failed to update status');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset hero slides to default 3 slides? This will replace all existing slides.')) {
      try {
        await api.post('/hero-slides/seed', { overwrite: true });
        toast.success('Default hero slides restored!');
        fetchSlides();
      } catch (error) {
        console.error('Failed to reset defaults', error);
        toast.error('Failed to reset default slides');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#9e1a1a]">Hero Banner Slider Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            Control the scrolling banner images, titles, and buttons on the customer home page hero section.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition"
          >
            <FiExternalLink className="w-4 h-4 text-gray-500" />
            <span>View User Site</span>
          </a>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2 border border-amber-300 rounded-lg text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 transition shadow-sm"
            title="Reset to 3 default slides"
          >
            <FiRefreshCw className="w-4 h-4 text-amber-700" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#9e1a1a] hover:bg-[#801414] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>+ Add New Slide</span>
          </button>
        </div>
      </div>

      {/* Hero Slides Display */}
      {loading ? (
        <div className="text-center py-20 bg-white/70 backdrop-blur rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9e1a1a] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading hero banners...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur rounded-xl border border-dashed border-gray-300 p-8">
          <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">No Hero Slides Configured</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            The customer home page is currently displaying fallback slides. You can initialize defaults or add custom banner images.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Seed Default 3 Slides
            </button>
            <button
              onClick={openCreateModal}
              className="bg-[#9e1a1a] hover:bg-[#801414] text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              + Create First Slide
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {slides.map((slide, idx) => (
            <div
              key={slide._id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
                slide.isActive ? 'border-gray-200' : 'border-gray-300 opacity-70 bg-gray-50'
              }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Slide Image Preview Thumbnail */}
                <div className="relative w-full lg:w-96 h-56 lg:h-auto flex-shrink-0 bg-black overflow-hidden group">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE_PLACEHOLDER;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 pointer-events-none" />
                  
                  {/* Badge & Order overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-black/75 backdrop-blur-md text-[#f3e5ab] text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                      Slide #{idx + 1} (Order: {slide.order})
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        slide.isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-gray-200'
                      }`}
                    >
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <p className="text-[10px] text-[#f3e5ab] font-semibold tracking-wider uppercase truncate">
                      {slide.badge}
                    </p>
                    <p className="text-sm font-bold text-white uppercase tracking-wide truncate">
                      {slide.title}
                    </p>
                  </div>
                </div>

                {/* Slide Details Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-block text-[11px] font-semibold tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase mb-1">
                          {slide.badge || '✦ NO BADGE'}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 tracking-wide uppercase">
                          {slide.title}
                        </h3>
                        <h4 className="text-sm font-medium text-amber-600 tracking-wider uppercase mt-0.5">
                          {slide.subtitle}
                        </h4>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(slide)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                            slide.isActive
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {slide.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => openEditModal(slide)}
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3.5 py-1.5 rounded-md text-xs font-semibold transition"
                          title="Edit Slide"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(slide._id)}
                          className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-semibold transition"
                          title="Delete Slide"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                      {slide.description || 'No description provided.'}
                    </p>

                    {/* Button Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
                      <div className="bg-gray-50 p-2.5 rounded border border-gray-100">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Primary CTA Button</span>
                        <span className="font-semibold text-gray-800">{slide.primaryBtnText || 'ORDER NOW'}</span>
                        <span className="text-gray-500 text-[11px] block truncate">Link: {slide.primaryBtnLink || '/shopping'}</span>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded border border-gray-100">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Secondary CTA Button</span>
                        <span className="font-semibold text-gray-800">{slide.secondaryBtnText || 'SILK SAREES'}</span>
                        <span className="text-gray-500 text-[11px] block truncate">Link: {slide.secondaryBtnLink || '/shopping?fabric=Silk'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Image URL info */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="truncate max-w-md">Image URL: {slide.image}</span>
                    <span className="font-medium text-gray-500">Order: {slide.order}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSlide} className="p-6 space-y-5">
              {/* Image Upload & Preview Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Banner Image <span className="text-red-500">*</span>
                </label>

                {/* Upload or URL tabs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#9e1a1a] rounded-xl p-4 bg-gray-50/70 hover:bg-amber-50/20 transition">
                    <FiUploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-semibold text-gray-700">
                      {uploading ? 'Uploading Image to Cloud...' : 'Click to Upload from Device'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP (Landscape recommended)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex flex-col justify-center">
                    <label className="text-[11px] font-semibold text-gray-600 mb-1">Or paste Image URL:</label>
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a]"
                    />
                  </div>
                </div>

                {/* Live Banner Preview Box */}
                {image && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black shadow-inner border border-gray-200">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE_PLACEHOLDER;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 pointer-events-none" />
                    
                    {/* Live text overlay mockup */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[9px] font-semibold tracking-widest text-[#f3e5ab] bg-[#c5a070]/20 border border-[#c5a070]/40 rounded-full px-2.5 py-0.5 mb-1.5 uppercase backdrop-blur-sm">
                        {badge || '✦ BADGE PREVIEW'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-wider uppercase mb-1 leading-tight">
                        {title || 'TITLE PREVIEW'}
                      </h3>
                      <p className="text-[11px] text-[#f3e5ab] tracking-wider uppercase mb-2">
                        {subtitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#c5a070] text-white text-[9px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                          {primaryBtnText || 'PRIMARY BTN'}
                        </span>
                        <span className="bg-white/20 text-white text-[9px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-white/30 backdrop-blur-sm">
                          {secondaryBtnText || 'SECONDARY BTN'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-1 rounded-full text-xs transition"
                      title="Clear image"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Badge Pill Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ✦ HANDWOVEN HERITAGE"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Display Order (Sorting)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Main Heading Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EXPLORE THE COLLECTION"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Authentic Silk & Handcrafted Perfection"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description Paragraph
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Brief description shown under the titles..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a]"
                  />
                </div>
              </div>

              {/* Button Configurations */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Call to Action Buttons</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Primary Button Text</label>
                    <input
                      type="text"
                      value={primaryBtnText}
                      onChange={(e) => setPrimaryBtnText(e.target.value)}
                      placeholder="ORDER NOW"
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Primary Button Link</label>
                    <input
                      type="text"
                      value={primaryBtnLink}
                      onChange={(e) => setPrimaryBtnLink(e.target.value)}
                      placeholder="/shopping"
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Secondary Button Text</label>
                    <input
                      type="text"
                      value={secondaryBtnText}
                      onChange={(e) => setSecondaryBtnText(e.target.value)}
                      placeholder="SILK SAREES"
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Secondary Button Link</label>
                    <input
                      type="text"
                      value={secondaryBtnLink}
                      onChange={(e) => setSecondaryBtnLink(e.target.value)}
                      placeholder="/shopping?fabric=Silk"
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9e1a1a] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Status active checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#9e1a1a] rounded focus:ring-[#9e1a1a]"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Activate this slide (Display in Hero slider on customer website)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-[#9e1a1a] hover:bg-[#801414] text-white px-6 py-2 rounded-lg text-xs font-bold tracking-wide transition shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHeroSlides;
