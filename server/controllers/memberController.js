import User from '../model/User.js';
import MemberApplication from '../model/MemberApplication.js';
import Membership from '../model/Membership.js';
import { logger } from '../utils/logger.js';




export const getMembers = async (req, res, next) => {
  const { search, status, page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skipNum = (pageNum - 1) * limitNum;

  try {
    const query = { userType: 'MEMBER' };

    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    
    if (status) {
      if (status === 'REGISTERED') {
        
        const appliedUsers = await MemberApplication.find().distinct('userId');
        query._id = { $nin: appliedUsers };
      } else {
        
        const matchingApplications = await MemberApplication.find({ status }).distinct('userId');
        query._id = { $in: matchingApplications };
      }
    }

    const total = await User.countDocuments(query);
    const members = await User.find(query)
      .select('-passwordHash')
      .sort({ fullName: 1 })
      .skip(skipNum)
      .limit(limitNum);

    const userIds = members.map(m => m._id);

    
    const applications = await MemberApplication.find({ userId: { $in: userIds } })
      .populate('membershipTypeId', 'name description annualFee')
      .sort({ createdAt: 1 }); 
    const memberships = await Membership.find({ userId: { $in: userIds } });

    
    const applicationMap = {};
    applications.forEach(app => {
      applicationMap[app.userId.toString()] = app;
    });

    const membershipMap = {};
    memberships.forEach(m => {
      membershipMap[m.userId.toString()] = m;
    });

    const membersWithDetails = members.map(m => {
      const app = applicationMap[m._id.toString()] || null;
      const mem = membershipMap[m._id.toString()] || null;
      
      return {
        _id: m._id,
        fullName: m.fullName,
        email: m.email,
        isActive: m.isActive,
        createdAt: m.createdAt,
        membershipNumber: mem ? mem.membershipNumber : null,
        application: app ? {
          _id: app._id,
          applicantType: app.applicantType,
          fullName: app.fullName,
          companyName: app.companyName,
          nic: app.nic,
          registrationNo: app.registrationNo,
          email: app.email,
          phone: app.phone,
          address: app.address,
          status: app.status,
          rejectionReason: app.rejectionReason,
          reviewedAt: app.reviewedAt,
          membershipType: app.membershipTypeId ? {
            name: app.membershipTypeId.name,
            annualFee: app.membershipTypeId.annualFee
          } : null
        } : null
      };
    });

    res.json({
      members: membersWithDetails,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    logger.error('Error fetching members list', error);
    next(error);
  }
};




export const exportMembersCSV = async (req, res, next) => {
  try {
    logger.info(`CSV export initiated by ${req.user.email}`);

    
    const members = await User.find({ userType: 'MEMBER' }).sort({ fullName: 1 }).select('-passwordHash');
    const userIds = members.map(m => m._id);

    
    const applications = await MemberApplication.find({ userId: { $in: userIds } });
    const memberships = await Membership.find({ userId: { $in: userIds } });

    
    const appMap = {};
    applications.forEach(app => {
      appMap[app.userId.toString()] = app;
    });

    const memMap = {};
    memberships.forEach(m => {
      memMap[m.userId.toString()] = m;
    });

    
    const headers = [
      'Name',
      'Email',
      'Membership Number',
      'Status',
      'Applicant Type',
      'NIC/Reg No',
      'Phone',
      'Address',
      'Created At'
    ];

    const rows = [headers.join(',')];

    
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    
    for (const member of members) {
      const app = appMap[member._id.toString()] || null;
      const mem = memMap[member._id.toString()] || null;

      const name = member.fullName;
      const email = member.email;
      const membershipNumber = mem ? mem.membershipNumber : 'N/A';
      const status = app ? app.status : 'UNREGISTERED';
      const applicantType = app ? app.applicantType : member.applicantType || 'N/A';
      const nicOrReg = app ? (app.nic || app.registrationNo || 'N/A') : 'N/A';
      const phone = app ? app.phone : 'N/A';
      const address = app ? app.address : 'N/A';
      const createdAt = member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A';

      const row = [
        escapeCSV(name),
        escapeCSV(email),
        escapeCSV(membershipNumber),
        escapeCSV(status),
        escapeCSV(applicantType),
        escapeCSV(nicOrReg),
        escapeCSV(phone),
        escapeCSV(address),
        escapeCSV(createdAt)
      ];

      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');

    logger.success(`CSV export successfully completed. Rows: ${members.length} by ${req.user.email}`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    logger.error(`CSV export failed for ${req.user.email}`, error);
    next(error);
  }
};
