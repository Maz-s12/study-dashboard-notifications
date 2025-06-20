import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

interface Notification {
  id: string;
  type: string;
  email: string;
  status: string;
  timestamp: string;
  data?: {
    name?: string;
  };
  surveyData?: any[];
  prescreen_approval_date?: string;
}

const NotificationMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  position: { x: number; y: number };
}> = ({ isOpen, onClose, onApprove, onReject, position }) => {
  const [actionLoading, setActionLoading] = useState(false);
  if (!isOpen) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    await onApprove();
    setActionLoading(false);
  };
  const handleReject = async () => {
    setActionLoading(true);
    await onReject();
    setActionLoading(false);
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={onClose} />
      <div style={{ position: 'fixed', zIndex: 50, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', padding: '4px 0', minWidth: '128px', left: Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - 150 : position.x), top: Math.min(position.y, typeof window !== 'undefined' ? window.innerHeight - 100 : position.y) }}>
        <button onClick={handleApprove} disabled={actionLoading} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', fontSize: '14px', border: 'none', backgroundColor: 'transparent', cursor: actionLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: actionLoading ? 0.5 : 1 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{actionLoading ? 'Approving...' : 'Approve'}</button>
        <button onClick={handleReject} disabled={actionLoading} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', fontSize: '14px', border: 'none', backgroundColor: 'transparent', cursor: actionLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', color: '#dc2626', opacity: actionLoading ? 0.5 : 1 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{actionLoading ? 'Rejecting...' : 'Reject'}</button>
      </div>
    </>
  );
};

const PreScreenCompletedTable: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ isOpen: boolean; position: { x: number; y: number }; notification: Notification | null }>({ isOpen: false, position: { x: 0, y: 0 }, notification: null });
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/notifications');
      const rawData = await response.json();
      setNotifications(rawData.filter((n: Notification) => n.type === 'pre_screen_completed'));
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    let mounted = true;
    
    const fetchData = async () => {
      if (mounted) {
        await fetchNotifications();
      }
    };

    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleMenuClose = () => {
    setMenuState({ isOpen: false, position: { x: 0, y: 0 }, notification: null });
  };

  const handleApprove = async () => {
    if (!menuState.notification) return;
    try {
      await fetchWithAuth(`/api/notifications/${menuState.notification.id}/approve-pre-screen`, { method: 'POST' });
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error approving notification:', error);
      setError('Failed to approve notification');
    }
  };

  const handleReject = async () => {
    if (!menuState.notification) return;
    try {
      await fetchWithAuth(`/api/notifications/${menuState.notification.id}/reject-pre-screen`, { method: 'POST' });
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('Failed to reject notification');
    }
  };

  const handleApproveDirect = async (notification: Notification) => {
    try {
      await fetchWithAuth(`/api/notifications/${notification.id}/approve-pre-screen`, { method: 'POST' });
      await fetchNotifications();
    } catch (error) {
      console.error('Error approving notification:', error);
      setError('Failed to approve notification');
    }
  };

  const handleRejectDirect = async (notification: Notification) => {
    try {
      await fetchWithAuth(`/api/notifications/${notification.id}/reject-pre-screen`, { method: 'POST' });
      await fetchNotifications();
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('Failed to reject notification');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '384px' }}><Loader style={{ width: '24px', height: '24px', color: '#7c3aed' }} className="animate-spin" /><span style={{ color: '#6b7280', marginLeft: 8 }}>Loading...</span></div>;
  if (error) return <div style={{ color: '#dc2626', textAlign: 'center', marginTop: 32 }}>{error}</div>;

  const filteredNotifications = notifications.filter(n => n.status === statusFilter);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: 24 }}><ClipboardCheck style={{ width: 20, height: 20, color: '#7c3aed', marginRight: 8 }} />Pre-Screen Completed</h2>
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
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                {statusFilter === 'approved' && (
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Date</th>
                )}
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Survey</th>
                {filteredNotifications.some(n => n.status === 'pending') && (
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
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{notification.data?.name || 'N/A'}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '12px', fontWeight: '600', borderRadius: '9999px', backgroundColor: notification.status === 'approved' ? '#dcfce7' : '#fef3c7', color: notification.status === 'approved' ? '#166534' : '#92400e' }}>{notification.status}</span></td>
                      {statusFilter === 'approved' && (
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>
                          {notification.prescreen_approval_date ? new Date(notification.prescreen_approval_date).toLocaleString() : 'N/A'}
                        </td>
                      )}
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827', position: 'relative' }}>
                        <button onClick={async () => {
                          setExpandedRows(prev => ({ ...prev, [notification.id]: !prev[notification.id] }));
                          if (!expandedRows[notification.id]) {
                            // Fetch survey data if expanding
                            if (!notification.surveyData) {
                              const res = await fetchWithAuth(`/api/notifications/${notification.id}/survey-response`);
                              const data = await res.json();
                              setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, surveyData: data } : n));
                            }
                          }
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {expandedRows[notification.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />} Survey
                        </button>
                      </td>
                      {notification.status === 'pending' && (
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                          <button onClick={() => handleApproveDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginRight: 8 }}>Approve</button>
                          <button onClick={() => handleRejectDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Reject</button>
                        </td>
                      )}
                    </tr>
                    {expandedRows[notification.id] && notification.surveyData && (
                      <tr>
                        <td colSpan={5} style={{ background: '#f9fafb', padding: '16px 24px' }}>
                          <div>
                            <strong>Survey Questions & Answers:</strong>
                            <ul style={{ margin: '12px 0 0 0', padding: 0, listStyle: 'none' }}>
                              {notification.surveyData.length > 0 ? notification.surveyData.map((qa: any, idx: number) => (
                                <li key={idx} style={{ marginBottom: 8 }}>
                                  <div style={{ fontWeight: 500 }}>{qa.questionText}</div>
                                  <div style={{ color: '#4b5563', marginLeft: 8 }}>{qa.answerText}</div>
                                </li>
                              )) : <li>No survey data found.</li>}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>No notifications of this type</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <NotificationMenu isOpen={menuState.isOpen} onClose={handleMenuClose} onApprove={handleApprove} onReject={handleReject} position={menuState.position} />
    </div>
  );
};

export default PreScreenCompletedTable; 