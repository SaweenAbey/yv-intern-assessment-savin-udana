import 'dotenv/config';
import mongoose from 'mongoose';
import User from './model/User.js';
import MembershipType from './model/MembershipType.js';

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // 1. Seed the 3 Membership Types (F-14)
    const membershipTypesToSeed = [
      { name: 'Individual Standard', applicableTo: 'INDIVIDUAL', annualFee: 1500, isActive: true },
      { name: 'Individual Premium', applicableTo: 'INDIVIDUAL', annualFee: 5000, isActive: true },
      { name: 'Corporate Gold', applicableTo: 'COMPANY', annualFee: 15000, isActive: true }
    ];

    console.log('Seeding Membership Types...');
    for (const type of membershipTypesToSeed) {
      await MembershipType.findOneAndUpdate(
        { name: type.name },
        type,
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log('Membership Types seeded successfully.');

    // 2. Seed Chairman Account (F-14)
    const chairmanEmail = 'chairman@association.com';
    const chairmanPassword = 'ChairmanSecurePassword123!';
    const chairmanName = 'System Chairman';

    const chairmanExists = await User.findOne({ email: chairmanEmail });

    if (chairmanExists) {
      console.log('--------------------------------------------------');
      console.log('Chairman user already exists (found by email). Updating schema properties...');
      chairmanExists.fullName = chairmanName;
      chairmanExists.userType = 'CHAIRMAN';
      chairmanExists.isActive = true;
      
      // If passwordHash is missing (old database record used 'password'), set it
      if (!chairmanExists.passwordHash) {
        chairmanExists.passwordHash = chairmanPassword;
      }
      
      await chairmanExists.save();
      console.log(`Email: ${chairmanExists.email}`);
      console.log('--------------------------------------------------');
    } else {
      console.log('Creating Chairman user...');
      const chairman = await User.create({
        fullName: chairmanName,
        email: chairmanEmail,
        passwordHash: chairmanPassword, // Will be hashed by pre-save hook
        userType: 'CHAIRMAN',
        isActive: true
      });

      console.log('--------------------------------------------------');
      console.log('Chairman user created successfully!');
      console.log(`Name:     ${chairman.fullName}`);
      console.log(`Email:    ${chairman.email}`);
      console.log(`Password: ${chairmanPassword}`);
      console.log('--------------------------------------------------');
    }

    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
