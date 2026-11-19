import Booking from '../models/Booking.js';
import Product from '../models/Product.js';
import Bill from '../models/Bill.js';

export const getStats = async (req, res) => {
  try {
    const totalOrders = await Booking.countDocuments();
    const activeSarees = await Product.countDocuments({ status: 'Active' });
    
    const bookings = await Booking.find();
    const onlineRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const bills = await Bill.find();
    const posRevenue = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalRevenue = onlineRevenue + posRevenue;

    const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalOrders: totalOrders + bills.length,
      onlineOrders: totalOrders,
      posBillsCount: bills.length,
      totalRevenue,
      onlineRevenue,
      posRevenue,
      activeSarees,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
