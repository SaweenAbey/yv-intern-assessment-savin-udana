import mongoose from 'mongoose';

const membershipTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  applicableTo: {
    type: String,
    enum: ['INDIVIDUAL', 'COMPANY'],
    required: true
  },
  annualFee: {
    type: Number,
    required: true // in LKR
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('MembershipType', membershipTypeSchema);
