import { useState, useEffect, useRef } from 'react';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiClock,
  FiUser,
  FiPhone,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
  FiDollarSign,
  FiCreditCard,
  FiLayers,
  FiShare2,
  FiShoppingBag,
  FiTag,
  FiAlertCircle
} from 'react-icons/fi';
import { FaQrcode, FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../api';

function AdminBilling() {
  // Navigation View: 'counter' | 'history'
  const [activeTab, setActiveTab] = useState('counter');

  // Products & Search
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bill Items & Customer State
  const [billItems, setBillItems] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('Walk-In Customer');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [autoStockDeduct, setAutoStockDeduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Service Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Invoice / Print State
  const [completedBill, setCompletedBill] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Bills History State
  const [billsHistory, setBillsHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState({ totalBills: 0, totalRevenue: 0, todayCount: 0, todayRevenue: 0 });
  const [historySearch, setHistorySearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBillsHistory();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchBillsHistory = async (search = historySearch) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/bills?search=${encodeURIComponent(search || '')}`);
      setBillsHistory(res.data.bills || []);
      if (res.data.stats) {
        setHistoryStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch bills history', err);
      toast.error('Failed to fetch bills history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(q);
    const fabricMatch = p.fabric?.toLowerCase().includes(q);
    const catMatch = p.category?.toLowerCase().includes(q);
    const priceMatch = p.sellingPrice?.toString().includes(q);
    return nameMatch || fabricMatch || catMatch || priceMatch;
  });

  // Financial Calculations
  const subtotal = billItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const discountVal = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal - discountVal);

  // Add product to bill
  const handleAddProduct = (product) => {
    const existingIndex = billItems.findIndex(
      (item) => !item.isCustom && item.productId === product._id
    );

    if (existingIndex > -1) {
      const updated = [...billItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].price;
      setBillItems(updated);
      toast.success(`Increased ${product.name} quantity to ${updated[existingIndex].quantity}`, { id: 'qty-update' });
    } else {
      const newItem = {
        productId: product._id,
        name: product.name,
        fabric: product.fabric || '',
        price: Number(product.sellingPrice) || 0,
        quantity: 1,
        subtotal: Number(product.sellingPrice) || 0,
        isCustom: false,
        stock: product.stock ?? 0,
        image: product.colorVariants?.[0]?.images?.[0] || product.image || null
      };
      setBillItems([...billItems, newItem]);
      toast.success(`Added ${product.name} to bill`, { id: 'item-add' });
    }
  };

  // Update item quantity
  const handleUpdateQty = (index, delta) => {
    const updated = [...billItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      updated[index].subtotal = updated[index].quantity * updated[index].price;
      setBillItems(updated);
    }
  };

  // Manual quantity change
  const handleManualQtyChange = (index, value) => {
    const val = parseInt(value, 10);
    const updated = [...billItems];
    if (isNaN(val) || val <= 0) {
      updated[index].quantity = 1;
    } else {
      updated[index].quantity = val;
    }
    updated[index].subtotal = updated[index].quantity * updated[index].price;
    setBillItems(updated);
  };

  // Update line item price (allows counter negotiation)
  const handleUpdatePrice = (index, newPrice) => {
    const price = Math.max(0, Number(newPrice) || 0);
    const updated = [...billItems];
    updated[index].price = price;
    updated[index].subtotal = updated[index].quantity * price;
    setBillItems(updated);
  };

  // Remove item from bill
  const handleRemoveItem = (index) => {
    const updated = billItems.filter((_, i) => i !== index);
    setBillItems(updated);
  };

  // Add Custom Service or Repair charge
  const handleAddCustomCharge = (e) => {
    e.preventDefault();
    if (!customName.trim()) {
      toast.error('Please enter service / item name');
      return;
    }
    const price = Number(customPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    const qty = Math.max(1, parseInt(customQty, 10) || 1);

    const newItem = {
      productId: null,
      name: customName.trim(),
      fabric: 'Service / Charge',
      price,
      quantity: qty,
      subtotal: price * qty,
      isCustom: true
    };

    setBillItems([...billItems, newItem]);
    setCustomName('');
    setCustomPrice('');
    setCustomQty(1);
    setIsCustomModalOpen(false);
    toast.success('Custom charge added to bill');
  };

  // Reset bill
  const handleNewBill = () => {
    setBillItems([]);
    setCustomerPhone('');
    setCustomerName('Walk-In Customer');
    setPaymentMode('Cash');
    setDiscount(0);
    setRemarks('');
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    toast('New bill counter started', { icon: '✨' });
  };

  // Save bill to backend
  const handleCompleteBill = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one item to the bill.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim() || 'Walk-In Customer',
        customerPhone: customerPhone.trim(),
        items: billItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          fabric: item.fabric,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          isCustom: item.isCustom
        })),
        subtotal,
        discount: discountVal,
        grandTotal,
        paymentMode,
        remarks: remarks.trim(),
        autoStockDeduct
      };

      const res = await api.post('/bills', payload);
      setCompletedBill(res.data);
      setIsInvoiceModalOpen(true);
      toast.success('Bill generated and saved successfully! 🎉');

      // Refresh product stocks in catalog
      fetchProducts();
    } catch (err) {
      console.error('Error saving bill:', err);
      toast.error(err.response?.data?.message || 'Failed to complete bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print invoice handler
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp receipt generator
  const handleSendWhatsApp = (bill) => {
    const targetBill = bill || completedBill;
    if (!targetBill) return;

    const phone = targetBill.customerPhone?.replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      toast.error('Customer phone number not available or invalid');
      return;
    }

    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const itemsText = targetBill.items
      .map((it, idx) => `${idx + 1}. ${it.name} x${it.quantity} - Rs.${it.subtotal}`)
      .join('\n');

    const message = `*RK SAREES - Cash Receipt / Bill* 🛍️\n--------------------------------\nInvoice: *${targetBill.invoiceNumber}*\nDate: ${new Date(targetBill.createdAt).toLocaleDateString()} ${new Date(targetBill.createdAt).toLocaleTimeString()}\nCustomer: ${targetBill.customerName}\n\n*Items Purchased:*\n${itemsText}\n--------------------------------\nSubtotal: Rs.${targetBill.subtotal}\nDiscount: Rs.${targetBill.discount}\n*Grand Total: Rs.${targetBill.grandTotal}*\nPayment: ${targetBill.paymentMode}\n--------------------------------\nThank you for shopping with RK Sarees! 🙏\nVisit us again!`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Delete bill from history
  const handleDeleteBill = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill from history?')) {
      try {
        await api.delete(`/bills/${id}`);
        toast.success('Bill deleted successfully');
        fetchBillsHistory();
      } catch (err) {
        console.error('Failed to delete bill', err);
        toast.error('Failed to delete bill');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Banner & Action Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shadow-inner">
              <FiShoppingBag />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  POS Billing Counter
                </h1>
                <button
                  type="button"
                  onClick={() => setAutoStockDeduct(!autoStockDeduct)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                    autoStockDeduct
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                  title="Click to toggle auto stock deduction on sales"
                >
                  <span className={`w-2 h-2 rounded-full ${autoStockDeduct ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  Auto Stock Deduct {autoStockDeduct ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Instant counter sales, barcode/name search, auto-deduct inventory, and printable invoices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={() => {
                setActiveTab('counter');
                handleNewBill();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border ${
                activeTab === 'counter'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiRefreshCw className="text-base" />
              New Bill
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'history' ? 'counter' : 'history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white border-purple-600 shadow'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiClock className="text-base" />
              Bills History
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: BILLS HISTORY */}
      {activeTab === 'history' ? (
        <div className="space-y-6">
          {/* History KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Bills</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{historyStats.todayCount}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Sales</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₹{historyStats.todayRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bills</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">{historyStats.totalBills}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</span>
              <p className="text-2xl font-bold text-indigo-700 mt-1">₹{historyStats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* History Search & Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiClock className="text-purple-600" />
                Past Counter Invoices
              </h2>
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice, phone, name..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    fetchBillsHistory(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingHistory ? (
                <div className="py-12 text-center text-gray-500 text-sm">Loading bills history...</div>
              ) : billsHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No bills found in history.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {billsHistory.map((bill) => (
                      <tr key={bill._id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-purple-700">
                          {bill.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-900">{bill.customerName}</div>
                          {bill.customerPhone && <div className="text-xs text-gray-500">{bill.customerPhone}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {bill.items?.length || 0} item(s)
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            bill.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                            bill.paymentMode === 'UPI' ? 'bg-blue-100 text-blue-800' :
                            'bg-violet-100 text-violet-800'
                          }`}>
                            {bill.paymentMode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          ₹{bill.grandTotal?.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setCompletedBill(bill);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                            title="View / Print Invoice"
                          >
                            <FiPrinter size={16} />
                          </button>
                          {bill.customerPhone && (
                            <button
                              onClick={() => handleSendWhatsApp(bill)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                              title="Send WhatsApp Receipt"
                            >
                              <FaWhatsapp size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBill(bill._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Bill"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: POS BILLING COUNTER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLUMNS: PRODUCT SEARCH & BILL ITEMS */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Instant Product Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <FiSearch className="text-purple-600 text-base" />
                  <h2 className="text-base font-bold text-gray-800">
                    Instant Product Search
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FiPlus size={14} />
                  Add Service / Custom Charge
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FiSearch size={18} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type product name, model, brand, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50/60 border border-purple-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition-all placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* Product Catalog / Quick Search Results */}
              <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100">
                  {loadingProducts ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading catalog products...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No products matched "{searchQuery}". Try another keyword or add a custom service.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const img = p.colorVariants?.[0]?.images?.[0] || p.image || null;
                      const stockVal = p.stock ?? 0;
                      const isLow = stockVal <= 3 && stockVal > 0;
                      const isOut = stockVal <= 0;

                      return (
                        <div
                          key={p._id}
                          className="p-3 hover:bg-purple-50/50 transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {img ? (
                              <img
                                src={img}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                SAREE
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {p.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap">
                                <span className="font-bold text-gray-900">
                                  ₹{Number(p.sellingPrice || 0).toFixed(2)}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span
                                  className={`font-medium ${
                                    isOut
                                      ? 'text-red-500 font-semibold'
                                      : isLow
                                      ? 'text-amber-600 font-semibold'
                                      : 'text-emerald-600'
                                  }`}
                                >
                                  Stock: {stockVal}
                                </span>
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.2 rounded font-medium">
                                  {p.fabric || 'Internal Stock'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddProduct(p)}
                            className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
                            title="Add to Bill"
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Bill Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <FiTag className="text-purple-600" />
                  Bill Items ({billItems.length})
                </h3>
                {billItems.length > 0 && (
                  <button
                    onClick={() => setBillItems([])}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {billItems.length === 0 ? (
                /* Empty state matching user's reference screenshot */
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
                    <FiLayers size={32} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700">No items added to bill yet</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    Search products above or add custom repair charge
                  </p>
                </div>
              ) : (
                /* Bill items list */
                <div className="divide-y divide-gray-100">
                  {billItems.map((item, index) => (
                    <div
                      key={index}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </span>
                          {item.isCustom && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Rate: ₹{item.price.toFixed(2)} {item.fabric && `• ${item.fabric}`}
                        </div>
                      </div>

                      {/* Controls: Price + Stepper + Subtotal + Remove */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Qty Stepper */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(index, -1)}
                            className="p-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            <FiMinus size={13} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleManualQtyChange(index, e.target.value)}
                            className="w-10 text-center text-xs font-semibold bg-white border-x border-gray-200 py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(index, 1)}
                            className="p-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            <FiPlus size={13} />
                          </button>
                        </div>

                        {/* Line Subtotal */}
                        <div className="w-20 text-right font-bold text-sm text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: CUSTOMER INFO, PAYMENT MODE & SUMMARY */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 space-y-5">
              {/* Customer Information */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiUser className="text-purple-600 text-base" />
                  <h3 className="text-base font-bold text-gray-800">Customer Information</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Customer Phone (Mobile)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiPhone size={15} />
                      </div>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 bg-gray-50/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Customer Name (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiUser size={15} />
                      </div>
                      <input
                        type="text"
                        placeholder="Walk-In Customer"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 bg-gray-50/40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Cash', label: 'Cash', icon: <FiDollarSign size={18} /> },
                    { id: 'UPI', label: 'UPI', icon: <FaQrcode size={18} /> },
                    { id: 'Card', label: 'Card', icon: <FiCreditCard size={18} /> }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        paymentMode === mode.id
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={paymentMode === mode.id ? 'text-purple-600' : 'text-gray-500'}>
                        {mode.icon}
                      </span>
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Financial Breakdown */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Instant Discount (₹)</span>
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-right px-2.5 py-1 text-sm font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-base font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-black text-purple-700">₹{grandTotal.toFixed(2)}</span>
                </div>

                {/* Remarks Field */}
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Warranty / bill remarks (optional)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 placeholder-gray-400 bg-gray-50/30"
                  />
                </div>
              </div>

              {/* Complete Bill & Save Button */}
              <button
                type="button"
                disabled={isSubmitting || billItems.length === 0}
                onClick={handleCompleteBill}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isSubmitting || billItems.length === 0
                    ? 'bg-purple-300 cursor-not-allowed shadow-none'
                    : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.99] shadow-purple-200'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Bill...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    Complete Bill & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SERVICE / CUSTOM CHARGE */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Service / Custom Charge</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Charge / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fall & Pico, Stitching, Alteration, Special Packaging"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 150"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
                >
                  Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE INVOICE / RECEIPT MODAL */}
      {isInvoiceModalOpen && completedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-150 relative">
            {/* Header controls (no-print) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 no-print">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FiCheckCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Bill Saved Successfully</h3>
                  <p className="text-xs text-gray-500">Invoice ready for customer print & share</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  handleNewBill();
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* PRINTABLE AREA */}
            <div id="pos-print-area" className="bg-white p-4 sm:p-6 border border-gray-200 rounded-xl font-mono text-gray-800 text-xs">
              {/* Store Brand Header */}
              <div className="text-center pb-4 border-b border-dashed border-gray-300">
                <h2 className="text-xl font-black tracking-wider text-gray-900 uppercase">RK SAREES</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Exclusive Sarees & Women's Fashion</p>
                <p className="text-[10px] text-gray-500">Main Bazaar Road, Tamil Nadu, India</p>
                <p className="text-[10px] text-gray-500">Phone: +91 98765 43210</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-3 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-bold">{completedBill.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(completedBill.createdAt).toLocaleDateString()} {new Date(completedBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedBill.customerName}</span>
                </div>
                {completedBill.customerPhone && (
                  <div className="flex justify-between">
                    <span>Mobile:</span>
                    <span>{completedBill.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="font-semibold uppercase">{completedBill.paymentMode}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="py-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between font-bold pb-2 text-[11px] text-gray-700">
                  <span className="flex-1">Item</span>
                  <span className="w-10 text-center">Qty</span>
                  <span className="w-16 text-right">Rate</span>
                  <span className="w-16 text-right">Amt</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {completedBill.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="flex-1 truncate pr-2">{it.name}</span>
                      <span className="w-10 text-center">{it.quantity}</span>
                      <span className="w-16 text-right">₹{it.price.toFixed(2)}</span>
                      <span className="w-16 text-right font-medium">₹{(it.subtotal || it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations */}
              <div className="py-3 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{completedBill.subtotal?.toFixed(2)}</span>
                </div>
                {completedBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Instant Discount:</span>
                    <span>-₹{completedBill.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200 text-gray-900">
                  <span>Grand Total:</span>
                  <span>₹{completedBill.grandTotal?.toFixed(2)}</span>
                </div>
              </div>

              {/* Remarks if any */}
              {completedBill.remarks && (
                <div className="py-2 border-b border-dashed border-gray-300 text-[10px] text-gray-600">
                  <span className="font-bold">Remarks:</span> {completedBill.remarks}
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center pt-3 text-[10px] text-gray-500 space-y-0.5">
                <p className="font-semibold text-gray-700">Thank you for visiting RK Sarees! 🙏</p>
                <p>Items exchangeable within 7 days with bill.</p>
              </div>
            </div>

            {/* Modal Bottom Actions (no-print) */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow transition-colors text-sm"
              >
                <FiPrinter size={16} />
                Print Invoice
              </button>

              {completedBill.customerPhone && (
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(completedBill)}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow transition-colors text-sm"
                >
                  <FaWhatsapp size={16} />
                  WhatsApp Receipt
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  handleNewBill();
                }}
                className="w-full sm:w-auto py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
              >
                New Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBilling;
