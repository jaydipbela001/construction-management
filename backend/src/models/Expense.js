const mongoose = require('mongoose');
const { roundMoney } = require('../utils/money');

const EXPENSE_CATEGORIES = [
  'material',
  'labor',
  'equipment',
  'transport',
  'permits',
  'utilities',
  'miscellaneous',
];

const expenseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'projectId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: 'miscellaneous',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      validate: {
        validator: (v) => typeof v === 'number' && v >= 0,
        message: 'Amount cannot be negative',
      },
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: '',
    },
    payee: {
      type: String,
      trim: true,
      maxlength: [150, 'Payee cannot exceed 150 characters'],
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

expenseSchema.index({ projectId: 1, expenseDate: -1 });
expenseSchema.index({ projectId: 1, category: 1 });

expenseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
