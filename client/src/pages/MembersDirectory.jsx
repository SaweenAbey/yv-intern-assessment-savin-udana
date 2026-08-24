import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search 
} from 'lucide-react';

export default function MembersDirectory() {
  const { user, token, apiCall, showAlert } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL'); 
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);

  const fetchMembersList = async () => {
    try {
      const searchParam = memberSearch ? `&search=${encodeURIComponent(memberSearch)}` : '';
      const statusParam = memberFilter === 'ALL' ? '' : `&status=${memberFilter}`;
      const data = await apiCall(`/members?page=${memberPage}&limit=8${searchParam}${statusParam}`);
      setMembers(data.members);
      setMemberTotalPages(data.pages);
    } catch (err) {
      showAlert('Failed to fetch members directory.');
    }
  };

  useEffect(() => {
    if (user && user.permissions.includes('member.view')) {
      fetchMembersList();
    }
  }, [memberFilter, memberPage, user]);

  const handleMemberSearchSubmit = (e) => {
    e.preventDefault();
    setMemberPage(1);
    fetchMembersList();
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('/api/members/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert('CSV downloaded successfully!', 'success');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'CSV export failed.';
      showAlert(message);
    }
  };

  if (!user || !user.permissions.includes('member.view')) {
    return <div style={{ color: 'var(--color-text-secondary)' }}>Access Denied</div>;
  }

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Members Directory</h1>
        <p className="panel-description">Query, inspect and view all registered users (F-09)</p>
      </div>

      {/* Controls */}
      <form onSubmit={handleMemberSearchSubmit} className="controls-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by name or email..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Classification:</span>
          <select 
            className="form-control" 
            style={{ width: '180px' }}
            value={memberFilter}
            onChange={(e) => { setMemberFilter(e.target.value); setMemberPage(1); }}
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTERED">Registered (Unapplied)</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button type="submit" className="btn btn-secondary" style={{ width: 'auto' }}>Search</button>
          <button 
            type="button" 
            className="btn" 
            style={{ width: 'auto', background: 'var(--color-success-glow)', color: 'var(--color-success)', borderColor: 'rgba(16,185,129,0.3)' }}
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
        </div>
      </form>

      {/* Members list table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Name & Email</th>
              <th>Membership Number</th>
              <th>Reg. Date</th>
              <th>Application Info</th>
              <th>Application Status</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No members found.
                </td>
              </tr>
            ) : (
              members.map(m => (
                <tr key={m._id}>
                  <td style={{ fontWeight: '600' }}>
                    <div>{m.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>{m.email}</div>
                  </td>
                  <td>
                    {m.membershipNumber ? (
                      <code style={{ background: 'var(--color-bg-base)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-primary-hover)' }}>
                        {m.membershipNumber}
                      </code>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {m.application ? (
                      <div style={{ fontSize: '0.8rem' }}>
                        <div><strong>Name:</strong> {m.application.fullName || m.application.companyName}</div>
                        <div><strong>NIC/Reg:</strong> {m.application.nic || m.application.registrationNo}</div>
                        <div><strong>Phone:</strong> {m.application.phone}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No application submitted</span>
                    )}
                  </td>
                  <td>
                    {m.application ? (
                      <span className={`status-badge status-${m.application.status.toLowerCase()}`}>
                        <span className={`badge-dot badge-dot-${m.application.status === 'APPROVED' ? 'success' : m.application.status === 'PENDING' ? 'warning' : 'danger'}`}></span>
                        {m.application.status}
                      </span>
                    ) : (
                      <span className="status-badge" style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}>
                        unregistered
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {memberTotalPages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Page {memberPage} of {memberTotalPages}
            </span>
            <div className="pagination-btn-group">
              <button 
                className="pagination-btn" 
                disabled={memberPage === 1}
                onClick={() => setMemberPage(memberPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="pagination-btn" 
                disabled={memberPage === memberTotalPages}
                onClick={() => setMemberPage(memberPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
