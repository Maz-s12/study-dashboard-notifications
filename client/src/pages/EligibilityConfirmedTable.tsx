import React, { useState, useEffect } from 'react';
import { CheckCircle, MoreVertical, Loader } from 'lucide-react';
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

const EligibilityConfirmedTable: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ isOpen: boolean; position: { x: number; y: number }; notification: Notification | null }>({ isOpen: false, position: { x: 0, y: 0 }, notification: null });
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => { 
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth('/api/notifications');
        const rawData = await response.json();
        
        if (mounted) {
          setNotifications(rawData.filter((n: Notification) => n.type === 'eligibility_confirmed'));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching notifications:', err);
          setError('Failed to load notifications');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({ isOpen: true, position: { x: rect.right, y: rect.bottom }, notification });
  };

  const handleMenuClose = () => {
    setMenuState({ isOpen: false, position: { x: 0, y: 0 }, notification: null });
  };

  const handleApprove = async () => {
    if (!menuState.notification) return;
    try {
      await fetchWithAuth(`/api/notifications/${menuState.notification.id}/approve`, { method: 'POST' });
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
      await fetchWithAuth(`/api/notifications/${menuState.notification.id}/reject`, { method: 'POST' });
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('Failed to reject notification');
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '384px' }}><Loader style={{ width: '24px', height: '24px', color: '#059669' }} className="animate-spin" /><span style={{ color: '#6b7280', marginLeft: 8 }}>Loading...</span></div>;
  if (error) return <div style={{ color: '#dc2626', textAlign: 'center', marginTop: 32 }}>{error}</div>;

  const filteredNotifications = notifications.filter(n => n.status === statusFilter);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: 24 }}><CheckCircle style={{ width: 20, height: 20, color: '#059669', marginRight: 8 }} />Eligibility Confirmed</h2>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="status-filter" style={{ marginRight: 8, fontWeight: 500 }}>Status:</label>
        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14 }}>
          {STATUS_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>))}
        </select>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participant</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => (
                <tr key={notification.id} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{new Date(notification.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{notification.email}</td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{notification.data?.name || 'N/A'}</td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '12px', fontWeight: '600', borderRadius: '9999px', backgroundColor: notification.status === 'approved' ? '#dcfce7' : '#fef3c7', color: notification.status === 'approved' ? '#166534' : '#92400e' }}>{notification.status}</span></td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                    {notification.status === 'pending' ? (
                      <>
                        <button onClick={() => handleApproveDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#059669', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginRight: 8 }}>Approve</button>
                        <button onClick={() => handleRejectDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Reject</button>
                      </>
                    ) : (
                      <button onClick={e => handleMenuClick(e, notification)} disabled={notification.status === 'approved'} style={{ padding: '4px', borderRadius: '9999px', border: 'none', backgroundColor: 'transparent', cursor: notification.status === 'approved' ? 'not-allowed' : 'pointer', opacity: notification.status === 'approved' ? 0.5 : 1 }}><MoreVertical style={{ width: '16px', height: '16px', color: '#6b7280' }} /></button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>No notifications of this type</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <NotificationMenu isOpen={menuState.isOpen} onClose={handleMenuClose} onApprove={handleApprove} onReject={handleReject} position={menuState.position} />
    </div>
  );
};

export default EligibilityConfirmedTable; 