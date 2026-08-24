import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  XCircle, 
  CheckCircle 
} from 'lucide-react';

export default function Applications() {
  const { user, apiCall, showAlert } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [appFilter, setAppFilter] = useState('PENDING'); 
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  
  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  const fetchApplications = async () => {
    try {
      const statusParam = appFilter === 'ALL' ? '' : `status=${appFilter}`;
      const data = await apiCall(`/applications?${statusParam}&page=${appPage}&limit=6`);
      setApplications(data.applications);
      setAppTotalPages(data.pages);
    } catch (err) {
      showAlert('Failed to fetch applications list.');
    }
  };

  useEffect(() => {
    if (user && user.permissions.includes('application.view')) {
      fetchApplications();
    }
  }, [appFilter, appPage, user]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this membership application?')) return;
    try {
      const data = await apiCall(`/applications/${id}/approve`, { method: 'PATCH' });
      showAlert(`Application approved successfully! Unique membership ID: ${data.membershipNumber}`, 'success');
      fetchApplications();
    } catch (err) {
      showAlert(err.message || 'Approval failed.');
    }
  };

  const openRejectModal = (id) => {
    setRejectingAppId(id);
    setRejectionReason('');
    setRejectionError('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setRejectionError('');

    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required.');
      return;
    }

    try {
      await apiCall(`/applications/${rejectingAppId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason })
      });
      showAlert('Application rejected successfully.');
      setShowRejectModal(false);
      fetchApplications();
    } catch (err) {
      showAlert(err.message || 'Rejection failed.');
    }
  };

  if (!user || !user.permissions.includes('application.view')) {
    return <div style={{ color: 'var(--color-text-secondary)' }}>Access Denied</div>;
  }

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Membership Applications</h1>
        <p className="panel-description">Review, approve, or reject pending applications</p>
      </div>

      {/* Filter controls */}
      <div className="controls-bar">
        <div className="filters-group">
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Filter Status:</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
              <button 
                key={st}
                className={`pagination-btn ${appFilter === st ? 'active' : ''}`}
                style={appFilter === st ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
                onClick={() => { setAppFilter(st); setAppPage(1); }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Applicant Details</th>
              <th>Class & IDs</th>
              <th>Plan Requested</th>
              <th>Contact Info</th>
              <th>Status</th>
              <th>Review Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No applications found matching the criteria.
                </td>
              </tr>
            ) : (
              applications.map(app => (
                <tr key={app._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{app.fullName || app.companyName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Registered: {app.userId?.fullName}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>{app.applicantType}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      NIC/Reg: {app.nic || app.registrationNo}
                    </div>
                  </td>
                  <td>
                    <div>{app.membershipTypeId?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      LKR {app.membershipTypeId?.annualFee?.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{app.email}</span>
                      <span>{app.phone}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{app.address}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${app.status.toLowerCase()}`}>
                      <span className={`badge-dot badge-dot-${app.status === 'APPROVED' ? 'success' : app.status === 'PENDING' ? 'warning' : 'danger'}`}></span>
                      {app.status}
                    </span>
                    {app.status === 'REJECTED' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', maxWidth: '200px', whiteSpace: 'normal' }}>
                        Reason: {app.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>
                    {app.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {user.permissions.includes('application.approve') ? (
                          <button 
                            onClick={() => handleApprove(app._id)}
                            className="pagination-btn"
                            style={{ background: 'var(--color-success-glow)', color: 'var(--color-success)', borderColor: 'rgba(16,185,129,0.3)' }}
                          >
                            Approve
                          </button>
                        ) : null}

                        {user.permissions.includes('application.reject') ? (
                          <button 
                            onClick={() => openRejectModal(app._id)}
                            className="pagination-btn"
                            style={{ background: 'var(--color-danger-glow)', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                          >
                            Reject
                          </button>
                        ) : null}
                        
                        {!user.permissions.includes('application.approve') && !user.permissions.includes('application.reject') && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Read-only</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <div>Reviewed by:</div>
                        <strong>{app.reviewedBy?.fullName || 'Staff'}</strong>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {appTotalPages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Page {appPage} of {appTotalPages}
            </span>
            <div className="pagination-btn-group">
              <button 
                className="pagination-btn" 
                disabled={appPage === 1}
                onClick={() => setAppPage(appPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="pagination-btn" 
                disabled={appPage === appTotalPages}
                onClick={() => setAppPage(appPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REJECTION REASON INPUT MODAL */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Provide Rejection Reason</h3>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Reason for Decision</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="e.g. Provide a clear business registration copy and re-apply."
                  style={{ resize: 'none', fontFamily: 'var(--font-primary)' }}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
                {rejectionError && <span className="form-error">{rejectionError}</span>}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="pagination-btn" 
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  style={{ width: 'auto' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
