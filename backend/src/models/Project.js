const mongoose = require('mongoose');

const PROJECT_STATUSES = ['planned', 'active', 'on_hold', 'completed'];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    projectCode: {
      type: String,
      required: [true, 'Project code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [40, 'Project code cannot exceed 40 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [300, 'Location cannot exceed 300 characters'],
      default: '',
    },
    startDate: {
      type: Date,
      default: null,
    },
    expectedCompletionDate: {
      type: Date,
      default: null,
    },
    actualCompletionDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUSES,
        message: 'Status must be one of: planned, active, on_hold, completed',
      },
      default: 'planned',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text', projectCode: 'text' });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

projectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
