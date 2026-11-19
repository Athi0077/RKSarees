import Bill from '../models/Bill.js';
import Product from '../models/Product.js';

export const createBill = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      items,
      subtotal,
      discount = 0,
      grandTotal,
      paymentMode = 'Cash',
      remarks = '',
      autoStockDeduct = true
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Bill must contain at least one item.' });
    }

    // Generate unique invoice number: INV-YYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // Auto-deduct stock if enabled
    if (autoStockDeduct) {
      for (const item of items) {
        if (item.productId && !item.isCustom) {
          const qty = Number(item.quantity) || 1;
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -qty }
          });
        }
      }
    }

    const calculatedSubtotal = Number(subtotal) || items.reduce((sum, item) => sum + (Number(item.subtotal) || (Number(item.price) * Number(item.quantity))), 0);
    const calculatedDiscount = Math.max(0, Number(discount) || 0);
    const calculatedGrandTotal = Number(grandTotal) || Math.max(0, calculatedSubtotal - calculatedDiscount);

    const newBill = new Bill({
      invoiceNumber,
      customerName: customerName?.trim() || 'Walk-In Customer',
      customerPhone: customerPhone?.trim() || '',
      items,
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount,
      grandTotal: calculatedGrandTotal,
      paymentMode,
      remarks: remarks?.trim() || '',
      autoStockDeduct: Boolean(autoStockDeduct),
      createdBy: req.user?.email || 'Admin'
    });

    const savedBill = await newBill.save();
    res.status(201).json(savedBill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Failed to create bill', error: error.message });
  }
};

export const getBills = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;

    let query = {};
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { invoiceNumber: searchRegex },
          { customerPhone: searchRegex },
          { customerName: searchRegex }
        ]
      };
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNumber - 1) * pageSize;

    const [bills, total] = await Promise.all([
      Bill.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Bill.countDocuments(query)
    ]);

    // Calculate today's revenue and total revenue for counter
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allBills = await Bill.find({}, 'grandTotal createdAt');
    const totalRevenue = allBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const todayRevenue = allBills
      .filter(b => new Date(b.createdAt) >= startOfToday)
      .reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const todayCount = allBills.filter(b => new Date(b.createdAt) >= startOfToday).length;

    res.json({
      bills,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      stats: {
        totalBills: allBills.length,
        totalRevenue,
        todayCount,
        todayRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Failed to fetch bill', error: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    const { restock } = req.query;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Optional: restore product stock if requested
    if (restock === 'true' && bill.autoStockDeduct) {
      for (const item of bill.items) {
        if (item.productId && !item.isCustom) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: Number(item.quantity) || 1 }
          });
        }
      }
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Failed to delete bill', error: error.message });
  }
};
