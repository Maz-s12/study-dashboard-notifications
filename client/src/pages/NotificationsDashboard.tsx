import React, { useState, useEffect } from 'react';
import { Bell, Mail, FileText, CheckCircle, Calendar, MoreVertical, Loader, ChevronDown, ChevronUp } from 'lucide-react';

// Types
interface Notification {
  id: string;
  type: NotificationType;
  email: string;
  status: string;
  timestamp: string;
  data?: {
    bookingTime?: string;
    name?: string;
  };
  emailSubject?: string;
  emailBody?: string;
}

interface SurveyResponse {
  questionText: string;
  answerText: string;
  questionType: string;
}

type NotificationType = 'email_received' | 'pre_screen_completed' | 'eligibility_confirmed' | 'booking_scheduled';

// Replace this with your ngrok URL
const API_BASE_URL = 'http://localhost:5000';

// Add at the top, after useState imports
const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

// Separate component for the menu
const NotificationMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  notificationType: string | undefined;
  position: { x: number; y: number };
}> = ({ isOpen, onClose, onApprove, onReject, notificationType, position }) => {
  const [actionLoading, setActionLoading] = React.useState(false);
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
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40
        }}
        onClick={onClose} 
      />
      
      {/* Menu */}
      <div 
        style={{ 
          position: 'fixed',
          zIndex: 50,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '4px 0',
          minWidth: '128px',
          left: Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - 150 : position.x), 
          top: Math.min(position.y, typeof window !== 'undefined' ? window.innerHeight - 100 : position.y)
        }}
      >
        {(notificationType === 'email_received' || notificationType === 'pre_screen_completed') && (
          <>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                fontSize: '14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: actionLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {actionLoading ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                fontSize: '14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                color: '#dc2626',
                opacity: actionLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}
      </div>
    </>
  );
};

const NotificationDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<{ [notificationId: string]: SurveyResponse[] }>({});
  const [loadingSurveyResponses, setLoadingSurveyResponses] = useState<{ [notificationId: string]: boolean }>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    notification: Notification | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    notification: null
  });
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching from:', `${API_BASE_URL}/api/notifications`);
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response text:', text);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${text}`);
      }
      
      const rawData = JSON.parse(text);
      // Map snake_case to camelCase for subject/body
      const data = rawData.map((n: any) => ({
        ...n,
        emailSubject: n.emailSubject || n.email_subject,
        emailBody: n.emailBody || n.email_body
      }));
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error('Error details:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Group notifications by type
  const notificationsByType: Record<NotificationType, Notification[]> = {
    email_received: [],
    pre_screen_completed: [],
    eligibility_confirmed: [],
    booking_scheduled: []
  };

  notifications.forEach(notification => {
    notificationsByType[notification.type as NotificationType].push(notification);
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({
      isOpen: true,
      position: { x: rect.right, y: rect.bottom },
      notification
    });
  };

  const handleMenuClose = () => {
    setMenuState({
      isOpen: false,
      position: { x: 0, y: 0 },
      notification: null
    });
  };

  const handleApprove = async () => {
    if (!menuState.notification) return;
    const notification = menuState.notification;
    try {
      let response;
      if (notification.type === 'pre_screen_completed') {
        response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/approve-pre-screen`, {
          method: 'POST',
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/approve`, {
          method: 'POST',
        });
      }
      if (!response.ok) {
        throw new Error('Failed to approve notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error approving notification:', error);
      setError('Failed to approve notification');
    }
    handleMenuClose();
  };

  const handleApproveDirect = async (notification: Notification) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/approve`, {
          method: 'POST',
        });
  
        if (!response.ok) {
          throw new Error('Failed to approve notification');
        }
  
        // Refresh notifications after approval
        await fetchNotifications();
        handleMenuClose();
      } catch (error) {
        console.error('Error approving notification:', error);
        setError('Failed to approve notification');
      }
  };

  const handleReject = async () => {
    if (!menuState.notification) return;
    const notification = menuState.notification;
    try {
      let response;
      if (notification.type === 'pre_screen_completed') {
        response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/reject-pre-screen`, {
          method: 'POST',
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/reject`, {
          method: 'POST',
        });
      }
      if (!response.ok) {
        throw new Error('Failed to reject notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('Failed to reject notification');
    }
    handleMenuClose();
  };

  const handleRejectDirect = async (notification: Notification) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/reject`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reject notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('Failed to reject notification');
    }
  };

  const handleApprovePreScreen = async () => {
    if (!menuState.notification) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${menuState.notification.id}/approve-pre-screen`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to approve pre-screen notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error approving pre-screen notification:', error);
      setError('Failed to approve pre-screen notification');
    }
  };

  const handleRejectPreScreen = async () => {
    if (!menuState.notification) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${menuState.notification.id}/reject-pre-screen`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reject pre-screen notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting pre-screen notification:', error);
      setError('Failed to reject pre-screen notification');
    }
  };

  const handleApprovePreScreenDirect = async (notification: Notification) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/approve-pre-screen`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to approve pre-screen notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error approving pre-screen notification:', error);
      setError('Failed to approve pre-screen notification');
    }
  };

  const handleRejectPreScreenDirect = async (notification: Notification) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/reject-pre-screen`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reject pre-screen notification');
      }
      await fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting pre-screen notification:', error);
      setError('Failed to reject pre-screen notification');
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    const iconStyle = { width: '20px', height: '20px' };
    switch (type) {
      case 'email_received': return <Mail style={{ ...iconStyle, color: '#2563eb' }} />;
      case 'pre_screen_completed': return <FileText style={{ ...iconStyle, color: '#7c3aed' }} />;
      case 'eligibility_confirmed': return <CheckCircle style={{ ...iconStyle, color: '#059669' }} />;
      case 'booking_scheduled': return <Calendar style={{ ...iconStyle, color: '#6b7280' }} />;
      default: return <Bell style={iconStyle} />;
    }
  };

  const getTypeTitle = (type: NotificationType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    
    // Fetch survey responses when expanding a pre_screen_completed row
    if (!expandedRows[id]) {
      const notification = notifications.find(n => n.id === id);
      if (notification?.type === 'pre_screen_completed') {
        fetchSurveyResponses(id);
      }
    }
  };

  const fetchSurveyResponses = async (notificationId: string) => {
    if (surveyResponses[notificationId]) {
      return; // Already loaded
    }

    setLoadingSurveyResponses(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/survey-response`);
      if (!response.ok) {
        throw new Error('Failed to fetch survey responses');
      }
      
      const data = await response.json();
      setSurveyResponses(prev => ({ ...prev, [notificationId]: data }));
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      setError('Failed to fetch survey responses');
    } finally {
      setLoadingSurveyResponses(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const renderNotificationTable = (type: NotificationType, notifications: Notification[]) => {
    const filteredNotifications: Notification[] = notifications.filter((n: Notification) => n.type === type && n.status === statusFilter);

    return (
      <div key={type} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getTypeIcon(type)}
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#374151' }}>
              {getTypeTitle(type)}
            </h2>
          </div>
          <span style={{ 
            backgroundColor: '#dbeafe', 
            color: '#1e40af', 
            padding: '4px 12px', 
            borderRadius: '9999px', 
            fontSize: '14px', 
            fontWeight: '500' 
          }}>
            {filteredNotifications.length} notifications
          </span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="status-filter" style={{ marginRight: 8, fontWeight: 500 }}>Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14 }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Timestamp
                  </th>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Participant
                  </th>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </th>
                  {type === 'booking_scheduled' && (
                    <th style={{ 
                      padding: '12px 24px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Scheduled Time
                    </th>
                  )}
                  {type === 'pre_screen_completed' && (
                    <th style={{ 
                      padding: '12px 24px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Name
                    </th>
                  )}
                  {type === 'email_received' && (
                    <th style={{ 
                      padding: '12px 24px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Subject & Body
                    </th>
                  )}
                  {filteredNotifications.some((n: Notification) => n.status === 'pending') && (
                    <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'white' }}>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification: Notification, index: number) => (
                    <React.Fragment key={notification.id}>
                      <tr 
                        style={{ 
                          borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <td style={{ 
                          padding: '16px 24px', 
                          whiteSpace: 'nowrap', 
                          fontSize: '14px', 
                          color: '#111827' 
                        }}>
                            {new Date(notification.timestamp).toLocaleString()}
                        </td>
                        <td style={{ 
                          padding: '16px 24px', 
                          whiteSpace: 'nowrap', 
                          fontSize: '14px', 
                          color: '#111827' 
                        }}>
                          {notification.email}
                        </td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: notification.status === 'approved' ? '#dcfce7' : '#fef3c7',
                            color: notification.status === 'approved' ? '#166534' : '#92400e'
                          }}>
                            {notification.status}
                          </span>
                        </td>
                        {type === 'booking_scheduled' && (
                          <td style={{ 
                            padding: '16px 24px', 
                            whiteSpace: 'nowrap', 
                            fontSize: '14px', 
                            color: '#111827' 
                          }}>
                            {notification.data?.bookingTime && 
                              new Date(notification.data.bookingTime).toLocaleString()}
                          </td>
                        )}
                        {type === 'pre_screen_completed' && (
                          <td style={{ 
                            padding: '16px 24px', 
                            fontSize: '14px', 
                            color: '#111827',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{notification.data?.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(notification.id);
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  padding: '4px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#6b7280',
                                  flexShrink: 0,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.color = '#374151';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#6b7280';
                                }}
                                title={expandedRows[notification.id] ? 'Collapse' : 'Expand'}
                                aria-label={expandedRows[notification.id] ? 'Collapse survey responses' : 'Expand survey responses'}
                              >
                                {expandedRows[notification.id] ? 
                                  <ChevronUp size={16} /> : 
                                  <ChevronDown size={16} />
                                }
                              </button>
                            </div>
                          </td>
                        )}
                        {type === 'email_received' && (
                          <td style={{ 
                            padding: '16px 24px', 
                            fontSize: '14px', 
                            color: '#111827', 
                            maxWidth: '400px',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                                  {notification.emailSubject || '(No subject)'}
                                </div>
                                <div style={{ 
                                  color: '#6b7280',
                                  whiteSpace: expandedRows[notification.id] ? 'pre-wrap' : 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: expandedRows[notification.id] ? 'unset' : 'ellipsis'
                                }}>
                                  {notification.emailBody && (
                                    expandedRows[notification.id] ? 
                                      notification.emailBody : 
                                      (notification.emailBody.length > 50 ? 
                                        `${notification.emailBody.slice(0, 50)}...` : 
                                        notification.emailBody)
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(notification.id);
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  padding: '4px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#6b7280',
                                  flexShrink: 0,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.color = '#374151';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#6b7280';
                                }}
                                title={expandedRows[notification.id] ? 'Collapse' : 'Expand'}
                                aria-label={expandedRows[notification.id] ? 'Collapse email details' : 'Expand email details'}
                              >
                                {expandedRows[notification.id] ? 
                                  <ChevronUp size={16} /> : 
                                  <ChevronDown size={16} />
                                }
                              </button>
                            </div>
                          </td>
                        )}
                        {notification.status === 'pending' && (
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            <button onClick={() => handleApproveDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginRight: 8 }}>Approve</button>
                            <button onClick={() => handleRejectDirect(notification)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Reject</button>
                          </td>
                        )}
                      </tr>
                      {/* Expanded row for survey responses */}
                      {type === 'pre_screen_completed' && expandedRows[notification.id] && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ 
                              padding: '24px', 
                              backgroundColor: '#f9fafb',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: '16px'
                              }}>
                                <h4 style={{ 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  color: '#111827',
                                  margin: 0
                                }}>
                                  Survey Responses
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRow(notification.id);
                                  }}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6b7280',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                                    e.currentTarget.style.color = '#374151';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                  }}
                                  title="Collapse"
                                >
                                  <ChevronUp size={16} />
                                </button>
                              </div>
                              
                              {loadingSurveyResponses[notification.id] ? (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px',
                                  color: '#6b7280'
                                }}>
                                  <Loader size={16} className="animate-spin" />
                                  Loading survey responses...
                                </div>
                              ) : surveyResponses[notification.id] ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {surveyResponses[notification.id].map((response, index) => (
                                    <div 
                                      key={index}
                                      style={{ 
                                        padding: '16px', 
                                        backgroundColor: 'white', 
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                      }}
                                    >
                                      <div style={{ 
                                        fontWeight: '600', 
                                        color: '#111827',
                                        marginBottom: '8px',
                                        fontSize: '14px'
                                      }}>
                                        {response.questionText}
                                      </div>
                                      <div style={{ 
                                        color: '#374151',
                                        fontSize: '14px',
                                        padding: '8px 12px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '4px',
                                        border: '1px solid #e5e7eb'
                                      }}>
                                        {response.answerText}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                                  No survey responses available
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={(() => {
                        if (["booking_scheduled", "pre_screen_completed", "email_received"].includes(type)) return 5;
                        return 4;
                      })()} 
                      style={{ 
                        padding: '32px 24px', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        color: '#6b7280' 
                      }}
                    >
                    No notifications of this type
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '384px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader style={{ width: '24px', height: '24px', color: '#2563eb' }} className="animate-spin" />
          <span style={{ color: '#6b7280' }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '384px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Error
          </div>
          <div style={{ color: '#6b7280' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '32px' }}>
          Research Study Notifications
        </h1>
        
        {Object.entries(notificationsByType).map(([type, notifications]) => 
          renderNotificationTable(type as NotificationType, notifications)
        )}

        <NotificationMenu
          isOpen={menuState.isOpen}
          onClose={handleMenuClose}
          onApprove={handleApprove}
          onReject={handleReject}
          notificationType={menuState.notification?.type}
          position={menuState.position}
        />
      </div>
    </div>
  );
};

export default NotificationDashboard;