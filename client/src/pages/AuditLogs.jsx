import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuditLogs() {
  const { user, apiCall, showAlert } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchAuditLogs = async () => {
    try {
      const data = await apiCall('/audit-logs?page=1&limit=100');
      setAuditLogs(data.logs);
    } catch (err) {
      showAlert('Failed to load audit logs.');
    }
  };

  useEffect(() => {
    if (user && user.permissions.includes('audit.view')) {
      fetchAuditLogs();
    }
  }, [user]);

  if (!user || !user.permissions.includes('audit.view')) {
    return <div style={{ color: 'var(--color-text-secondary)' }}>Access Denied</div>;
  }

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">System Audit Log Trail</h1>
        <p className="panel-description">Review performer, action, target and details of system mutations (F-13)</p>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Performer</th>
              <th>Action</th>
              <th>Target Entity</th>
              <th>Audit Description</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              auditLogs.map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{log.actorUserId?.fullName || 'System'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.actorUserId?.email}</div>
                  </td>
                  <td>
                    <code style={{ background: 'var(--color-bg-base)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--color-warning)', fontSize: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 'bold' }}>
                      {log.action}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Type: </span>
                      <strong>{log.entityType}</strong>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      ID: {log.entityId || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="audit-details-card" title={JSON.stringify(log.details)}>
                      {log.details?.description || JSON.stringify(log.details)}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
