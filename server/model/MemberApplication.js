import mongoose from 'mongoose';

const memberApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // A user submits only one application
  },
  applicantType: {
    type: String,
    enum: ['INDIVIDUAL', 'COMPANY'],
    required: true
  },
  fullName: {
    type: String,
    trim: true,
    default: ''
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  nic: {
    type: String,
    trim: true,
    default: ''
  },
  registrationNo: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    maxlength: 250,
    trim: true
  },
  membershipTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipType',
    required: true
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
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('MemberApplication', memberApplicationSchema);
