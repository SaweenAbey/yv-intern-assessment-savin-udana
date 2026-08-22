import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // A member submits only one membership application
  },
  membershipType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipType',
    required: true
  },
  businessType: {
    type: String,
    enum: ['INDIVIDUAL', 'COMPANY'],
    required: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  decidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  decidedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);
