import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: false 
  },
  name: { 
    type: String, 
    required: true 
  },
  fabric: { 
    type: String, 
    default: '' 
  },
  price: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
  },
  subtotal: { 
    type: Number, 
    required: true 
  },
  isCustom: { 
    type: Boolean, 
    default: false 
  }
});

const billSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  customerName: { 
    type: String, 
    default: 'Walk-In Customer' 
  },
  customerPhone: { 
    type: String, 
    default: '' 
  },
  items: [billItemSchema],
  subtotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  paymentMode: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Card'], 
    default: 'Cash' 
  },
  remarks: { 
    type: String, 
    default: '' 
  },
  autoStockDeduct: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: String, 
    default: 'Admin' 
  }
}, { timestamps: true });

export default mongoose.model('Bill', billSchema);
