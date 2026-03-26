import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

function AdminDashboard({ attendees, event, onEventUpdate }) {
  const [activeTab, setActiveTab] = useState('attendees');
  const [events, setEvents] = useState([]);
  const [eventAttendeeData, setEventAttendeeData] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    host: '',
    totalSpots: 40,
    posterFile: null
  });

  // Defensive guard: ensure we always use an array (fallback props usage)
  const attendeesArray = Array.isArray(attendees)
    ? attendees
    : Array.isArray(attendees?.attendees)
    ? attendees.attendees
    : [];

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'attendees') {
      fetchEventsWithAttendees();
    }
  }, [activeTab]);

  const fetchEventsWithAttendees = async () => {
    try {
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();

      const attendeesByEvent = await Promise.all(
        eventsData.map(async (eventItem) => {
          const attendeeRes = await fetch(`/api/attendees?eventId=${eventItem.id}`);
          const attendeeData = await attendeeRes.json();
          return {
            ...eventItem,
            attendees: Array.isArray(attendeeData) ? attendeeData : []
          };
        })
      );

      setEventAttendeeData(attendeesByEvent);
    } catch (error) {
      console.error('Error fetching events with attendees:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Event', 'Name', 'Email', 'Phone', 'Seat', 'Status', 'Registered At'];
    const rows = [];

    const source = eventAttendeeData.length > 0 ? eventAttendeeData : [{ id: null, title: 'All events', attendees: attendeesArray }];

    source.forEach((eventItem) => {
      (eventItem.attendees || []).forEach((a) => {
        rows.push([
          `"${eventItem.title || 'Unknown'}"`,
          `"${a.name}"`,
          a.email,
          a.phone,
          a.seat_number || 'N/A',
          a.status,
          a.created_at ? new Date(a.created_at).toLocaleString() : ''
        ].join(','));
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvp_attendees.csv';
    a.click();
  };

  const refreshAttendees = () => {
    fetchEventsWithAttendees();
  };

  const handleEditEvent = (eventData) => {
    setEditingEvent(eventData);
    setShowCreateForm(false);
    setEventForm({
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      host: eventData.host,
      totalSpots: eventData.totalSpots,
      posterFile: null
    });
  };

  const handleSaveEvent = async () => {
    const formData = new FormData();
    formData.append('title', eventForm.title);
    formData.append('description', eventForm.description);
    formData.append('date', eventForm.date);
    formData.append('time', eventForm.time);
    formData.append('location', eventForm.location);
    formData.append('host', eventForm.host);
    formData.append('totalSpots', eventForm.totalSpots);
    if (eventForm.posterFile) {
      formData.append('poster', eventForm.posterFile);
    }

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData
      });

      if (res.ok) {
        const savedEvent = await res.json();
        fetchEvents();
        if (editingEvent && onEventUpdate) {
          onEventUpdate(savedEvent);
        }
        setEditingEvent(null);
        setShowCreateForm(false);
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          host: '',
          totalSpots: 40,
          posterFile: null
        });
        alert(editingEvent ? 'Event updated successfully!' : `Event created successfully! RSVP link: ${window.location.origin}/event/${savedEvent.id}`);
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all RSVPs and seat assignments.')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
        alert('Event deleted successfully!');
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'attendees' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendees')}
        >
          Attendees
        </button>
        <button
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Manage Events
        </button>
      </div>

      {activeTab === 'attendees' && (
        <>
          <div className="admin-header">
            <div>
              <h2>Admin Dashboard</h2>
              <p className="total-count">Total RSVPs: <strong>{eventAttendeeData.reduce((sum, ev) => sum + (ev.attendees?.length || 0), 0)}</strong></p>
            </div>
            <div className="admin-actions">
              <button className="btn-refresh" onClick={refreshAttendees}>
                🔄 Refresh
              </button>
              <button className="btn-export" onClick={exportToCSV}>
                📥 Export to CSV
              </button>
            </div>
          </div>

          {eventAttendeeData.length === 0 ? (
            <div className="empty-state">
              <p>No RSVPs yet</p>
            </div>
          ) : (
            <div className="events-attendees">
              {eventAttendeeData.map((eventItem) => (
                <div key={eventItem.id || eventItem.title} className="event-attendee-group">
                  <h3 style={{ color: 'black' }}>{eventItem.title}</h3>
                  <a href={`/event/${eventItem.id}`} target="_blank" rel="noopener noreferrer" style={{color: '#0066cc'}} className="event-card-link">
                    View RSVP Page
                  </a>
                  <p className="event-meta">{eventItem.date} • {eventItem.time} • {eventItem.location}</p>

                  {eventItem.attendees.length === 0 ? (
                    <div className="empty-state"><p>No attendees for this event yet</p></div>
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
                          {eventItem.attendees.map((attendee, index) => (
                            <tr key={`${eventItem.id || eventItem.title}-${attendee.id || index}`} className={index % 2 === 0 ? 'even' : 'odd'}>
                              <td className="name-cell"><strong>{attendee.name}</strong></td>
                              <td className="email-cell"><a href={`mailto:${attendee.email}`}>{attendee.email}</a></td>
                              <td className="phone-cell"><a href={`tel:${attendee.phone}`}>{attendee.phone}</a></td>
                              <td className="seat-cell">{attendee.seat_number ? `Seat ${attendee.seat_number}` : '-'}</td>
                              <td className="status-cell"><span className={`status-badge ${attendee.status}`}>{attendee.status}</span></td>
                              <td className="date-cell">{new Date(attendee.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'events' && (
        <div className="events-management">
          <div className="admin-header">
            <h2>Event Management</h2>
            <button
              className="btn-create"
              onClick={() => {
                setEditingEvent(null);
                setShowCreateForm(true);
                setEventForm({
                  title: '',
                  description: '',
                  date: '',
                  time: '',
                  location: '',
                  host: '',
                  totalSpots: 40,
                  posterFile: null
                });
              }}
            >
              + Create New Event
            </button>
          </div>

          {editingEvent || showCreateForm ? (
            <div className="event-form">
              <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEvent(); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Host:</label>
                    <input
                      type="text"
                      value={eventForm.host}
                      onChange={(e) => setEventForm({...eventForm, host: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date:</label>
                    <input
                      type="text"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                      placeholder="e.g., Saturday, Mar 28"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time:</label>
                    <input
                      type="text"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                      placeholder="e.g., 9:00 AM BST"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location:</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Spots:</label>
                    <input
                      type="number"
                      value={eventForm.totalSpots}
                      onChange={(e) => setEventForm({...eventForm, totalSpots: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Poster:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEventForm({...eventForm, posterFile: e.target.files[0]})}
                  />
                  <p className="hint">Upload a poster image (JPEG, PNG, etc.). Recommended size: 1600x600px (landscape).</p>
                </div>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows="6"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setEditingEvent(null);
                      setShowCreateForm(false);
                      setEventForm({
                        title: '',
                        description: '',
                        date: '',
                        time: '',
                        location: '',
                        host: '',
                        totalSpots: 40,
                        posterFile: null
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="events-list">
              {events.length === 0 ? (
                <div className="empty-state">
                  <p>No events found</p>
                </div>
              ) : (
                <div className="events-grid">
                  {events.map((event) => (
                    <div key={event.id} className="event-card">
                      <div className="event-card-header">
                        <h4>{event.title.length > 20 ? event.title.slice(0, 20) + '...' : event.title}</h4>
                        <div className="event-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditEvent(event)}
                          >
                            ✏️ Edit
                          </button>
                          {events.length > 1 && (
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="event-card-meta">
                        <p><strong>Date:</strong> {event.date}</p>
                        <p><strong>Time:</strong> {event.time}</p>
                        <p><strong>Location:</strong> {event.location}</p>
                        <p><strong>Host:</strong> {event.host}</p>
                        <p><strong>Spots:</strong> {event.totalSpots}</p>
                      </div>
                      <div className="event-card-description">
                        {event.description.length > 100
                          ? `${event.description.substring(0, 100)}...`
                          : event.description}
                      </div>
                      <div className="event-card-link">
                        <strong style={{ color: '#333' }}>RSVP Link:</strong> <a href={`/event/${event.id}`} target="_blank" rel="noopener noreferrer">{window.location.origin}/event/{event.id}</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
