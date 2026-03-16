import React from 'react';
import './AdminDashboard.css';

function AdminDashboard({ attendees }) {
  // Defensive guard: ensure we always use an array
  const attendeesArray = Array.isArray(attendees)
    ? attendees
    : Array.isArray(attendees?.attendees)
    ? attendees.attendees
    : [];

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Seat', 'Status', 'Registered At'];
    const csvContent = [
      headers.join(','),
      ...attendeesArray.map(a => [
        `"${a.name}"`,
        a.email,
        a.phone,
        a.seat_number || 'N/A',
        a.status,
        new Date(a.created_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvp_attendees.csv';
    a.click();
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="total-count">Total RSVPs: <strong>{attendeesArray.length}</strong></p>
        </div>
        <button className="btn-export" onClick={exportToCSV}>
          📥 Export to CSV
        </button>
      </div>

      {attendeesArray.length === 0 ? (
        <div className="empty-state">
          <p>No RSVPs yet</p>
        </div>
      ) : (
        <div className="attendees-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Seat</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {attendeesArray.map((attendee, index) => (
                <tr key={attendee.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                  <td className="name-cell">
                    <strong>{attendee.name}</strong>
                  </td>
                  <td className="email-cell">
                    <a href={`mailto:${attendee.email}`}>{attendee.email}</a>
                  </td>
                  <td className="phone-cell">
                    <a href={`tel:${attendee.phone}`}>{attendee.phone}</a>
                  </td>
                  <td className="seat-cell">
                    {attendee.seat_number ? `Seat ${attendee.seat_number}` : '-'}
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${attendee.status}`}>
                      {attendee.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(attendee.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
