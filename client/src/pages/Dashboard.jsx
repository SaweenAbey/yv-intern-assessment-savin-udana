import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  LayoutDashboard
} from 'lucide-react';

export default function Dashboard() {
  const { user, apiCall, showAlert } = useAuth();
  
  // Staff dashboard states
  const [dashboardCounts, setDashboardCounts] = useState(null);
  
  // Member states
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [memberApplication, setMemberApplication] = useState(null);
  const [memberMembership, setMemberMembership] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    membershipTypeId: '',
    applicantType: user?.applicantType || 'INDIVIDUAL',
    fullName: '',
    companyName: '',
    nic: '',
    registrationNo: '',
    email: '',
    phone: '',
    address: ''
  });
  const [applicationErrors, setApplicationErrors] = useState({});

  const fetchMemberData = async () => {
    try {
      const types = await apiCall('/applications/membership-types');
      setMembershipTypes(types);
      
      const userType = user?.applicantType || 'INDIVIDUAL';
      const matchingPlans = types.filter(t => t.applicableTo === userType);
      
      setApplicationForm(prev => ({ 
        ...prev, 
        applicantType: userType,
        membershipTypeId: prev.membershipTypeId || (matchingPlans.length > 0 ? matchingPlans[0]._id : ''),
        email: prev.email || user?.email || '',
        fullName: prev.fullName || (userType === 'INDIVIDUAL' ? user?.fullName || '' : ''),
        companyName: prev.companyName || (userType === 'COMPANY' ? user?.fullName || '' : '')
      }));

      try {
        const res = await apiCall('/applications/my');
        setMemberApplication(res.application);
        setMemberMembership(res.membership);
      } catch (err) {
        setMemberApplication(null);
        setMemberMembership(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardCounts = async () => {
    try {
      const counts = await apiCall('/applications/dashboard-counts');
      setDashboardCounts(counts);
    } catch (err) {
      console.error('Failed to fetch dashboard counts:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.userType === 'MEMBER') {
      fetchMemberData();
    } else {
      fetchDashboardCounts();
    }
  }, [user]);

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setApplicationErrors({});

    const errors = {};
    
    if (applicationForm.applicantType === 'INDIVIDUAL') {
      if (!applicationForm.fullName || applicationForm.fullName.length < 3 || applicationForm.fullName.length > 100) {
        errors.fullName = 'Full name is required (3 to 100 characters)';
      }
      if (!applicationForm.nic || applicationForm.nic.trim() === '') {
        errors.nic = 'NIC number is required for individual applicants';
      }
    } else {
      if (!applicationForm.companyName || applicationForm.companyName.length < 3 || applicationForm.companyName.length > 100) {
        errors.companyName = 'Company name is required (3 to 100 characters)';
      }
      if (!applicationForm.registrationNo || applicationForm.registrationNo.trim() === '') {
        errors.registrationNo = 'Business registration number is required for corporate applicants';
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!applicationForm.email || !emailRegex.test(applicationForm.email)) {
      errors.email = 'Please provide a valid email address';
    }

    const slPhoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    if (!applicationForm.phone || !slPhoneRegex.test(applicationForm.phone)) {
      errors.phone = 'Provide a valid Sri Lankan phone number (e.g. 0771234567 or +94771234567)';
    }

    if (!applicationForm.address || applicationForm.address.trim() === '') {
      errors.address = 'Address is required';
    } else if (applicationForm.address.length > 250) {
      errors.address = 'Address must not exceed 250 characters';
    }

    if (!applicationForm.membershipTypeId) {
      errors.membershipTypeId = 'Membership plan is required';
    }

    if (Object.keys(errors).length > 0) {
      setApplicationErrors(errors);
      return;
    }

    try {
      const data = await apiCall('/applications', {
        method: 'POST',
        body: JSON.stringify(applicationForm)
      });
      showAlert(data.message || 'Application submitted successfully!', 'success');
      fetchMemberData();
    } catch (err) {
      showAlert(err.message || 'Application submission failed.');
    }
  };

  if (!user) return null;

  return (
    <div>
      {/* STAFF: DASHBOARD PANEL */}
      {user.userType !== 'MEMBER' && (
        <div>
          <div className="panel-header">
            <h1 className="panel-title">Administrative Dashboard</h1>
            <p className="panel-description">Overview of association metrics and activities</p>
          </div>

          {dashboardCounts ? (
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Total Members</span>
                  <Users size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                  {dashboardCounts.totalMembers}
                </span>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Pending Applications</span>
                  <Clock size={20} style={{ color: 'var(--color-warning)' }} />
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                  {dashboardCounts.pendingApplications}
                </span>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Approved This Month</span>
                  <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                  {dashboardCounts.approvedThisMonth}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard metrics...</div>
          )}
        </div>
      )}

      {/* MEMBER PANEL */}
      {user.userType === 'MEMBER' && (
        <div>
          <div className="panel-header">
            <h1 className="panel-title">Membership Space</h1>
            <p className="panel-description">Manage and view your active membership status</p>
          </div>

          {!memberApplication ? (
            // 1. REGISTERED STATE (UNAPPLIED FORM)
            <div className="card" style={{ maxWidth: '650px' }}>
              <h3 className="panel-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Submit Membership Application</h3>
              <form onSubmit={handleApplicationSubmit}>
                
                <div className="form-group">
                  <label className="form-label">Applicant Classification</label>
                  <select 
                    className="form-control form-select"
                    value={applicationForm.applicantType}
                    disabled={true}
                  >
                    <option value="INDIVIDUAL">Individual Professional</option>
                    <option value="COMPANY">Registered Corporation / Business</option>
                  </select>
                  <span className="form-helper">Fixed to registered account type (BR-01)</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Membership Plan</label>
                  <select 
                    className="form-control form-select"
                    value={applicationForm.membershipTypeId}
                    onChange={(e) => setApplicationForm({ ...applicationForm, membershipTypeId: e.target.value })}
                  >
                    <option value="">-- Select Plan --</option>
                    {membershipTypes
                      .filter(t => t.applicableTo === applicationForm.applicantType)
                      .map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} - LKR {t.annualFee.toLocaleString()} / year
                        </option>
                    ))}
                  </select>
                  {applicationErrors.membershipTypeId && <span className="form-error">{applicationErrors.membershipTypeId}</span>}
                </div>

                {applicationForm.applicantType === 'INDIVIDUAL' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="John Doe" 
                        value={applicationForm.fullName}
                        onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
                      />
                      {applicationErrors.fullName && <span className="form-error">{applicationErrors.fullName}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">National Identity Card (NIC) No.</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. 199512345678 or 951234567V" 
                        value={applicationForm.nic}
                        onChange={(e) => setApplicationForm({ ...applicationForm, nic: e.target.value })}
                      />
                      {applicationErrors.nic && <span className="form-error">{applicationErrors.nic}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Registered Company Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Acme Corp LLC" 
                        value={applicationForm.companyName}
                        onChange={(e) => setApplicationForm({ ...applicationForm, companyName: e.target.value })}
                      />
                      {applicationErrors.companyName && <span className="form-error">{applicationErrors.companyName}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Business Registration No.</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. PV-123456" 
                        value={applicationForm.registrationNo}
                        onChange={(e) => setApplicationForm({ ...applicationForm, registrationNo: e.target.value })}
                      />
                      {applicationErrors.registrationNo && <span className="form-error">{applicationErrors.registrationNo}</span>}
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Applicant Email Address</label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="john@example.com" 
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                  />
                  {applicationErrors.email && <span className="form-error">{applicationErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone (Sri Lankan Format)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. 0771234567" 
                    value={applicationForm.phone}
                    onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                  />
                  {applicationErrors.phone && <span className="form-error">{applicationErrors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Address (Max 250 characters)</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    placeholder="Colombo, Sri Lanka" 
                    style={{ resize: 'none', fontFamily: 'var(--font-primary)' }}
                    value={applicationForm.address}
                    onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })}
                  ></textarea>
                  <span className="form-helper">{250 - (applicationForm.address?.length || 0)} characters remaining</span>
                  {applicationErrors.address && <span className="form-error">{applicationErrors.address}</span>}
                </div>

                <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                  Submit Membership Application
                </button>
              </form>
            </div>
          ) : (
            // APPLIED STATE VIEW
            <div>
              {memberApplication.status === 'PENDING' && (
                <div className="card" style={{ maxWidth: '650px', borderLeft: '4px solid var(--color-warning)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Clock size={40} className="status-pending" style={{ padding: '8px', borderRadius: '50%' }} />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Application Pending Review</h3>
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        Your application for <strong>{memberApplication.membershipTypeId?.name}</strong> is currently undergoing review.
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem', background: 'rgba(11,15,25,0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Submitted Details:</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      <div><strong>Name:</strong> {memberApplication.fullName || memberApplication.companyName}</div>
                      <div><strong>Classification:</strong> {memberApplication.applicantType}</div>
                      <div><strong>NIC / Registration No:</strong> {memberApplication.nic || memberApplication.registrationNo}</div>
                      <div><strong>Phone:</strong> {memberApplication.phone}</div>
                      <div><strong>Address:</strong> {memberApplication.address}</div>
                    </div>
                  </div>
                </div>
              )}

              {memberApplication.status === 'APPROVED' && memberMembership && (
                <div>
                  <div className="alert alert-success" style={{ maxWidth: '500px' }}>
                    <CheckCircle size={18} />
                    <div>Membership Active! Below is your unique ID card details.</div>
                  </div>
                  
                  <div className="membership-card-glow-wrap">
                    <div className="digital-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <span className="card-association-logo">ASSOC MEMBER</span>
                        <div className="status-badge status-approved" style={{ fontSize: '0.65rem' }}>
                          {memberMembership.status}
                        </div>
                      </div>
                      
                      <div className="card-chip"></div>
                      
                      <div className="card-number">
                        {memberMembership.membershipNumber}
                      </div>
                      
                      <div className="card-details-grid">
                        <div>
                          <div className="card-label">Name</div>
                          <div className="card-value">{memberApplication.fullName || memberApplication.companyName}</div>
                        </div>
                        <div>
                          <div className="card-label">Valid Until</div>
                          <div className="card-value" style={{ fontSize: '0.8rem' }}>
                            {new Date(memberMembership.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {memberApplication.status === 'REJECTED' && (
                <div className="card" style={{ maxWidth: '650px', borderLeft: '4px solid var(--color-danger)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <XCircle size={40} className="status-rejected" style={{ padding: '8px', borderRadius: '50%' }} />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Application Rejected</h3>
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        Unfortunately, the application did not meet our criteria.
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '1.5rem' }}>
                    <strong>Rejection Reason:</strong> {memberApplication.rejectionReason}
                  </div>

                  <button 
                    onClick={() => {
                      if (window.confirm('Do you want to adjust details and re-apply?')) {
                        setMemberApplication(null);
                        setApplicationForm({
                          membershipTypeId: memberApplication.membershipTypeId?._id || '',
                          applicantType: memberApplication.applicantType,
                          fullName: memberApplication.fullName || '',
                          companyName: memberApplication.companyName || '',
                          nic: memberApplication.nic || '',
                          registrationNo: memberApplication.registrationNo || '',
                          email: memberApplication.email,
                          phone: memberApplication.phone,
                          address: memberApplication.address
                        });
                      }
                    }}
                    className="btn"
                  >
                    Re-apply Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
