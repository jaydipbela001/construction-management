const mongoose = require('mongoose');
const { roundMoney } = require('../utils/money');

const materialSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'projectId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
      maxlength: [150, 'Material name cannot exceed 150 characters'],
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [Number.MIN_VALUE, 'Quantity must be greater than zero'],
      validate: {
        validator: (v) => typeof v === 'number' && v > 0,
        message: 'Quantity must be greater than zero',
      },
    },
    usedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Used quantity cannot be negative'],
      validate: {
        validator: (v) => typeof v === 'number' && v >= 0,
        message: 'Used quantity cannot be negative',
      },
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      maxlength: [30, 'Unit cannot exceed 30 characters'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
      validate: {
        validator: (v) => typeof v === 'number' && v >= 0,
        message: 'Unit price cannot be negative',
      },
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [150, 'Supplier cannot exceed 150 characters'],
      default: '',
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true },
  }
);

materialSchema.virtual('lineTotal').get(function lineTotal() {
  if (typeof this.quantity !== 'number' || typeof this.unitPrice !== 'number') {
    return 0;
  }
  return roundMoney(this.quantity * this.unitPrice);
});

// Remaining stock = total purchased quantity - used quantity.
materialSchema.virtual('currentStock').get(function currentStock() {
  const total = typeof this.quantity === 'number' ? this.quantity : 0;
  const used = typeof this.usedQuantity === 'number' ? this.usedQuantity : 0;
  return Math.round((total - used) * 1000) / 1000;
});

materialSchema.index({ projectId: 1, category: 1 });
materialSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('Material', materialSchema);
