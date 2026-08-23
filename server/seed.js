import 'dotenv/config';
import mongoose from 'mongoose';
import User from './model/User.js';
import MembershipType from './model/MembershipType.js';
import Permission from './model/Permission.js';

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

    
    const permissionsToSeed = [
      { key: 'member.view', description: 'Access members directory search and pagination list' },
      { key: 'application.view', description: 'View incoming membership applications with status filters' },
      { key: 'application.approve', description: 'Approve a pending application' },
      { key: 'application.reject', description: 'Reject a pending application' },
      { key: 'role.manage', description: 'Create officer roles, change permissions, and assign roles to users' },
      { key: 'audit.view', description: 'View the global system audit log trail' }
    ];

    console.log('Seeding Permissions...');
    await Permission.deleteMany({});
    for (const perm of permissionsToSeed) {
      await Permission.create(perm);
    }
    console.log('Permissions seeded successfully.');

    
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
        passwordHash: chairmanPassword, 
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
