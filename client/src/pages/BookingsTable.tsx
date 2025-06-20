import React, { useState, useEffect } from 'react';
import { Calendar, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { fetchWithAuth } from '../utils/api';

interface Booking {
  id: string;
  participant_id: string;
  email: string;
  name: string;
  booking_time: string;
  booking_time_est: string;
  cancel_link: string;
  reschedule_link: string;
  survey_link: string;
  created_at: string;
  participant_name: string;
  participant_email: string;
}

const BookingsTable: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/participants/bookings');
      const data = await response.json();
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatBookingTime = (bookingTime: string): string => {
    try {
      const dateObj = new Date(bookingTime);
      return format(dateObj, 'EEEE MMMM d, yyyy h:mmaaa');
    } catch (e) {
      return bookingTime;
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '384px' }}><Loader style={{ width: '24px', height: '24px', color: '#7c3aed' }} className="animate-spin" /><span style={{ color: '#6b7280', marginLeft: 8 }}>Loading...</span></div>;
  if (error) return <div style={{ color: '#dc2626', textAlign: 'center', marginTop: 32 }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: 24 }}><Calendar style={{ width: 20, height: 20, color: '#7c3aed', marginRight: 8 }} />Confirmed Bookings</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participant</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Time</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Survey Link</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {bookings.length > 0 ? (
                bookings.map((booking, index) => (
                  <tr key={booking.id} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                      {booking.participant_name || booking.name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      {booking.participant_email || booking.email}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      {formatBookingTime(booking.booking_time_est || booking.booking_time)}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#2563eb' }}>
                      {booking.survey_link ? (
                        <a href={booking.survey_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          View Survey
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {booking.reschedule_link && (
                          <a 
                            href={booking.reschedule_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              backgroundColor: '#f3f4f6', 
                              color: '#374151', 
                              textDecoration: 'none', 
                              fontSize: '12px',
                              border: '1px solid #d1d5db'
                            }}
                          >
                            Reschedule
                          </a>
                        )}
                        {booking.cancel_link && (
                          <a 
                            href={booking.cancel_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              backgroundColor: '#fee2e2', 
                              color: '#dc2626', 
                              textDecoration: 'none', 
                              fontSize: '12px',
                              border: '1px solid #fecaca'
                            }}
                          >
                            Cancel
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>No confirmed bookings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingsTable; 