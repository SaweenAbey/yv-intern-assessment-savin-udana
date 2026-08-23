import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One membership record per user
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MemberApplication',
    required: true,
    unique: true
  },
  membershipNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  membershipTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipType',
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED'],
    default: 'ACTIVE',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Membership', membershipSchema);
