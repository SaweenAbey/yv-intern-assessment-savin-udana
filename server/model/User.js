import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['CHAIRMAN', 'OFFICER', 'MEMBER'],
    default: 'MEMBER'
  },
  applicantType: {
    type: String,
    enum: ['INDIVIDUAL', 'COMPANY', null],
    default: null
  },
  officerRoleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfficerRole',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
