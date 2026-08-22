import User from '../model/User.js';
import MemberApplication from '../model/MemberApplication.js';
import Membership from '../model/Membership.js';

// @desc    Get member list (Search by name/email, filter by status, paginated)
// @route   GET /api/members
// @access  Private (Staff only - requires member.view permission)
export const getMembers = async (req, res, next) => {
  const { search, status, page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skipNum = (pageNum - 1) * limitNum;

  try {
    const query = { userType: 'MEMBER' };

    // Search by name or email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by application status
    if (status) {
      if (status === 'REGISTERED') {
        // Members who haven't submitted an application yet
        const appliedUsers = await MemberApplication.find().distinct('userId');
        query._id = { $nin: appliedUsers };
      } else {
        // Members who have applications with the specific status
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

    // Fetch matching applications and memberships
    const applications = await MemberApplication.find({ userId: { $in: userIds } })
      .populate('membershipTypeId', 'name description annualFee')
      .sort({ createdAt: 1 }); // Sort oldest first so latest overwrites older ones in map
    const memberships = await Membership.find({ userId: { $in: userIds } });

    // Map by User ID
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
    next(error);
  }
};
