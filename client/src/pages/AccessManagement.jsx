import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  UserCheck, 
  PlusCircle, 
  Info 
} from 'lucide-react';

export default function AccessManagement() {
  const { user, apiCall, showAlert } = useAuth();

  const [roles, setRoles] = useState([]);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });
  const [roleErrors, setRoleErrors] = useState({});

  const [officers, setOfficers] = useState([]);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', password: '', officerRoleId: '' });
  const [officerErrors, setOfficerErrors] = useState({});

  const [assignForm, setAssignForm] = useState({ email: '', role: 'MEMBER', officerRoleId: '' });
  const [assignErrors, setAssignErrors] = useState({});
  
  const [members, setMembers] = useState([]);

  const fetchChairmanRolesData = async () => {
    try {
      const rolesData = await apiCall('/officer-roles');
      setRoles(rolesData);
      
      const officersData = await apiCall('/officer-roles/officers');
      setOfficers(officersData);
      
      const membersData = await apiCall('/members?limit=100');
      setMembers(membersData.members);
    } catch (err) {
      showAlert('Failed to fetch Roles/Officers management data.');
    }
  };

  useEffect(() => {
    if (user && user.userType === 'CHAIRMAN') {
      fetchChairmanRolesData();
    }
  }, [user]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setRoleErrors({});

    if (!roleForm.name.trim()) {
      setRoleErrors({ name: 'Role name is required' });
      return;
    }

    try {
      const data = await apiCall('/officer-roles', {
        method: 'POST',
        body: JSON.stringify(roleForm)
      });
      showAlert(data.message || 'Role created successfully!', 'success');
      setRoleForm({ name: '', description: '', permissions: [] });
      fetchChairmanRolesData();
    } catch (err) {
      showAlert(err.message || 'Failed to create role.');
    }
  };

  const togglePermissionInForm = (permKey) => {
    const current = [...roleForm.permissions];
    if (current.includes(permKey)) {
      setRoleForm({ ...roleForm, permissions: current.filter(p => p !== permKey) });
    } else {
      setRoleForm({ ...roleForm, permissions: [...current, permKey] });
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setOfficerErrors({});

    const errors = {};
    if (!officerForm.name.trim()) errors.name = 'Name is required';
    if (!officerForm.email.trim()) errors.email = 'Email is required';
    if (!officerForm.password) errors.password = 'Password is required';
    if (!officerForm.officerRoleId) errors.officerRoleId = 'Please assign an officer role';

    if (Object.keys(errors).length > 0) {
      setOfficerErrors(errors);
      return;
    }

    try {
      const data = await apiCall('/officer-roles/officers', {
        method: 'POST',
        body: JSON.stringify(officerForm)
      });
      showAlert(data.message || 'Officer registered successfully!', 'success');
      setOfficerForm({ name: '', email: '', password: '', officerRoleId: '' });
      fetchChairmanRolesData();
    } catch (err) {
      showAlert(err.message || 'Officer registration failed.');
    }
  };

  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    setAssignErrors({});

    const errors = {};
    if (!assignForm.email.trim()) errors.email = 'User Email is required';
    if (assignForm.role === 'OFFICER' && !assignForm.officerRoleId) {
      errors.officerRoleId = 'Please select an Officer Role to assign';
    }

    if (Object.keys(errors).length > 0) {
      setAssignErrors(errors);
      return;
    }

    try {
      const targetUser = members.find(m => m.email.toLowerCase() === assignForm.email.toLowerCase().trim()) || 
                         officers.find(o => o.email.toLowerCase() === assignForm.email.toLowerCase().trim());
      
      if (!targetUser) {
        setAssignErrors({ email: 'User not found in system directory' });
        return;
      }

      const roleParam = assignForm.role === 'OFFICER' ? assignForm.officerRoleId : 'member';
      const data = await apiCall(`/officer-roles/${roleParam}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          userId: targetUser._id
        })
      });

      showAlert(data.message || 'User role updated successfully!', 'success');
      setAssignForm({ email: '', role: 'MEMBER', officerRoleId: '' });
      fetchChairmanRolesData();
    } catch (err) {
      showAlert(err.message || 'Failed to assign role.');
    }
  };

  if (!user || user.userType !== 'CHAIRMAN') {
    return <div style={{ color: 'var(--color-text-secondary)' }}>Access Denied</div>;
  }

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Chairman Access Management</h1>
        <p className="panel-description">Manage roles, assign permissions, register staff, and assign privileges</p>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* 1. ROLE CREATOR */}
        {user.permissions.includes('role.manage') ? (
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--color-primary)' }} />
              Create Officer Role
            </h3>
            <form onSubmit={handleCreateRole}>
              <div className="form-group">
                <label className="form-label">Role Title / Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Secretary, Registrar" 
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                />
                {roleErrors.name && <span className="form-error">{roleErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Role Description</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Brief description of responsibilities" 
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.75rem' }}>Select Permissions (Exactly defined keys)</label>
                <div className="permission-ticks-grid">
                  {[
                    { key: 'member.view', label: 'member.view (View directory)' },
                    { key: 'application.view', label: 'application.view (View applications)' },
                    { key: 'application.approve', label: 'application.approve (Approve pending)' },
                    { key: 'application.reject', label: 'application.reject (Reject pending)' },
                    { key: 'role.manage', label: 'role.manage (Chairman actions)' },
                    { key: 'audit.view', label: 'audit.view (View system audits)' }
                  ].map(p => (
                    <label key={p.key} className="tick-label">
                      <input 
                        type="checkbox" 
                        className="tick-checkbox"
                        checked={roleForm.permissions.includes(p.key)}
                        onChange={() => togglePermissionInForm(p.key)}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn">
                Save Officer Role
              </button>
            </form>

            <h4 style={{ fontSize: '0.95rem', margin: '2rem 0 1rem 0', color: 'var(--color-text-secondary)' }}>Seeded & Custom Roles:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {roles.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No custom roles created.</div>
              ) : (
                roles.map(r => (
                  <div key={r._id} style={{ background: 'rgba(11,15,25,0.4)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{r.name}</div>
                    {r.description && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>{r.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {r.permissions.map(p => (
                        <span key={p} style={{ fontSize: '0.7rem', background: 'var(--color-bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-primary-hover)' }}>
                          {p}
                        </span>
                      ))}
                      {r.permissions.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>No permissions</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-muted)' }}>
              <Info size={16} />
              <span>Missing role.manage permission to edit roles</span>
            </div>
          </div>
        )}

        {/* 2. ROLE ASSIGNMENT & OFFICER CREATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ROLE ASSIGNMENT FORM (F-11) */}
          {user.permissions.includes('role.manage') ? (
            <div className="card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} style={{ color: 'var(--color-primary)' }} />
                Assign Role to User (F-11)
              </h3>
              <form onSubmit={handleAssignRoleSubmit}>
                <div className="form-group">
                  <label className="form-label">User Email Address</label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="member@example.com" 
                    value={assignForm.email}
                    onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                  />
                  {assignErrors.email && <span className="form-error">{assignErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">General Role Assignment</label>
                  <select 
                    className="form-control form-select"
                    value={assignForm.role}
                    onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value, officerRoleId: '' })}
                  >
                    <option value="MEMBER">Member (Standard User)</option>
                    <option value="OFFICER">Officer (Staff Privileges)</option>
                  </select>
                </div>

                {assignForm.role === 'OFFICER' && (
                  <div className="form-group">
                    <label className="form-label">Select Officer Permission Role</label>
                    <select 
                      className="form-control form-select"
                      value={assignForm.officerRoleId}
                      onChange={(e) => setAssignForm({ ...assignForm, officerRoleId: e.target.value })}
                    >
                      <option value="">-- Choose Role --</option>
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                    {assignErrors.officerRoleId && <span className="form-error">{assignErrors.officerRoleId}</span>}
                  </div>
                )}

                <button type="submit" className="btn">
                  Apply Role Update
                </button>
              </form>
            </div>
          ) : null}

          {/* STAFF CREATOR */}
          {user.permissions.includes('role.manage') ? (
            <div className="card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} style={{ color: 'var(--color-primary)' }} />
                Register New Officer (Staff)
              </h3>
              <form onSubmit={handleCreateOfficer}>
                <div className="form-group">
                  <label className="form-label">Officer Full Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Officer Name" 
                    value={officerForm.name}
                    onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  />
                  {officerErrors.name && <span className="form-error">{officerErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="officer@association.com" 
                    value={officerForm.email}
                    onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                  />
                  {officerErrors.email && <span className="form-error">{officerErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="••••••••" 
                    value={officerForm.password}
                    onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })}
                  />
                  {officerErrors.password && <span className="form-error">{officerErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Select Permission Role</label>
                  <select 
                    className="form-control form-select"
                    value={officerForm.officerRoleId}
                    onChange={(e) => setOfficerForm({ ...officerForm, officerRoleId: e.target.value })}
                  >
                    <option value="">-- Choose Role --</option>
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                  {officerErrors.officerRoleId && <span className="form-error">{officerErrors.officerRoleId}</span>}
                </div>

                <button type="submit" className="btn">
                  Create Staff Member
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {/* Officers Listing table */}
      <h3 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '1.25rem' }}>Active Officers List</h3>
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Assigned Role</th>
              <th>Effective Permissions</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
            {officers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No officers registered.
                </td>
              </tr>
            ) : (
              officers.map(o => (
                <tr key={o._id}>
                  <td style={{ fontWeight: '600' }}>{o.fullName}</td>
                  <td>{o.email}</td>
                  <td>
                    <span className="profile-role-badge badge-officer">
                      {o.officerRoleId?.name || 'General'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {o.officerRoleId?.permissions.map(p => (
                        <span key={p} style={{ fontSize: '0.7rem', background: 'var(--color-bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      )) || <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>None</span>}
                    </div>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
