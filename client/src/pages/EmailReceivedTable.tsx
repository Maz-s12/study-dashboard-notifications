import React, { useState, useEffect } from 'react';
import { Mail, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

interface Notification {
  id: string;
  type: string;
  email: string;
  status: string;
  timestamp: string;
  data?: any;
  emailSubject?: string;
  emailBody?: string;
}

// Helper function to strip HTML tags and convert to plain text
const stripHtml = (html: string): string => {
  if (!html) return '';
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  // Get text content and clean up whitespace
  return tempDiv.textContent || tempDiv.innerText || ''
    .replace(/\s+/g, ' ')
    .trim();
};

const EmailReceivedTable: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/notifications');
      const rawData = await response.json();
      const data = rawData.map((n: any) => ({ ...n, emailSubject: n.emailSubject || n.email_subject, emailBody: n.emailBody || n.email_body }));
      setNotifications(data.filter((n: Notification) => n.type === 'email_received'));
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDirect = async (notification: Notification) => {
    try {
      await fetchWithAuth(`/api/notifications/${notification.id}/approve`, { method: 'POST' });
      await fetchNotifications();
    } catch (error) {
      console.error('Error approving notification:', error);
      setError('Failed to approve notification');
    }
  };
  const handleRejectDirect = async (notification: Notification) => {
    try {
      await fetchWithAuth(`/api/notifications/${notification.id}/reject`, { method: 'POST' });
      await fetchNotifications();
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('Failed to reject notification');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '384px' }}><Loader style={{ width: '24px', height: '24px', color: '#2563eb' }} className="animate-spin" /><span style={{ color: '#6b7280', marginLeft: 8 }}>Loading...</span></div>;
  if (error) return <div style={{ color: '#dc2626', textAlign: 'center', marginTop: 32 }}>{error}</div>;

  const filteredNotifications = notifications.filter(n => n.status === statusFilter);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: 24 }}><Mail style={{ width: 20, height: 20, color: '#2563eb', marginRight: 8 }} />Email Received</h2>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="status-filter" style={{ marginRight: 8, fontWeight: 500 }}>Status:</label>
        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14 }}>
          {STATUS_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>))}
        </select>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participant</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject & Body</th>
                {statusFilter === 'pending' && (
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <tr style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{new Date(notification.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{notification.email}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '12px', fontWeight: '600', borderRadius: '9999px', backgroundColor: notification.status === 'approved' ? '#dcfce7' : '#fef3c7', color: notification.status === 'approved' ? '#166534' : '#92400e' }}>{notification.status}</span></td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827', maxWidth: '400px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, marginBottom: '4px' }}>{notification.emailSubject || '(No subject)'}</div>
                            <div style={{ color: '#6b7280', whiteSpace: expandedRows[notification.id] ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: expandedRows[notification.id] ? 'unset' : 'ellipsis' }}>{notification.emailBody && (expandedRows[notification.id] ? stripHtml(notification.emailBody) : (stripHtml(notification.emailBody).length > 50 ? `${stripHtml(notification.emailBody).slice(0, 50)}...` : stripHtml(notification.emailBody)))}</div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setExpandedRows(prev => ({ ...prev, [notification.id]: !prev[notification.id] })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }} title={expandedRows[notification.id] ? 'Collapse' : 'Expand'} aria-label={expandedRows[notification.id] ? 'Collapse email details' : 'Expand email details'}>{expandedRows[notification.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                        </div>
                      </td>
                      {statusFilter === 'pending' && (
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                          <button onClick={() => handleApproveDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginRight: 8 }}>Approve</button>
                          <button onClick={() => handleRejectDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Reject</button>
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={statusFilter === 'pending' ? 5 : 4} style={{ padding: '32px 24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>No notifications of this type</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailReceivedTable; 