import React, { useState, useEffect } from 'react';
import './App.css';
import RSVPForm from './components/RSVPForm';
import SeatSelector from './components/SeatSelector';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentView, setCurrentView] = useState('event'); // 'event', 'rsvp', 'admin'
  const [event, setEvent] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [seats, setSeats] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const [eventRes, capacityRes, seatsRes, attendeesRes] = await Promise.all([
        fetch('/api/event'),
        fetch('/api/capacity'),
        fetch('/api/seats'),
        fetch('/api/attendees')
      ]);

      const eventData = await eventRes.json();
      const capacityData = await capacityRes.json();
      const seatsData = await seatsRes.json();
      const attendeesData = await attendeesRes.json();

      setEvent(eventData);
      setCapacity(capacityData);
      setSeats(seatsData);
      setAttendees(attendeesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const res = await fetch('/api/attendees');
      const data = await res.json();
      setAttendees(data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const handleRSVPClick = () => {
    if (capacity && capacity.available > 0) {
      setCurrentView('rsvp');
    } else {
      alert('Event is full!');
    }
  };

  const handleSeatSelect = (seatId) => {
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };

  const handleAdminClick = () => {
    setCurrentView('admin');
    fetchAttendees();
  };

  if (loading) {
    return <div className="app loading">Loading...</div>;
  }

  const getInitials = (name) => {
    if (!name) return '🤝';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const attendeesArray = Array.isArray(attendees)
    ? attendees
    : Array.isArray(attendees?.attendees)
    ? attendees.attendees
    : [];
  const displayAttendees = attendeesArray.slice(0, 3);
  const remainingAttendees = Math.max(attendeesArray.length - 3, 0);

  return (
    <div className="app">
      {currentView === 'event' && event && (
        <div className="pf-root">
          <div className="pf-hero">
            <div className="pf-hero-texture"></div>
            <div className="pf-hero-stars"></div>
            <div className="pf-hero-content">
              <div className="pf-nav">
                <div className="pf-logo">partiful</div>
                <button className="pf-nav-btn">Create event</button>
              </div>
              <div className="pf-chip">
                <div className="pf-chip-dot"></div>
                {capacity ? `${capacity.available} of ${capacity.total} spots left` : 'Loading...'}
              </div>
              <div className="pf-event-title">{event.title}</div>
              <div className="pf-event-meta">
                <div className="pf-meta-row">
                  <div className="pf-meta-dot"></div>
                  {event.date} · {event.time}
                </div>
                <div className="pf-meta-row">
                  <div className="pf-meta-dot"></div>
                  ICT GMT+7 · {event.host}
                </div>
              </div>
            </div>
          </div>

          <div className="pf-body">
            <div className="pf-host-card">
              <div className="pf-avatar-emoji">🙂</div>
              <div className="pf-host-info">
                <div className="pf-host-label">hosted by</div>
                <div className="pf-host-name">{event.host}</div>
              </div>
              <div className="pf-spots-badge">{capacity ? `${capacity.available} left` : 'Loading'}</div>
            </div>

            <div className="pf-section" style={{ marginTop: '12px' }}>
              <div className="pf-detail-row">
                <div className="pf-detail-icon">📅</div>
                <div>
                  <div className="pf-detail-label">date & time</div>
                  <div className="pf-detail-value">{event.date} · {event.time}</div>
                </div>
              </div>
              <div className="pf-detail-row">
                <div className="pf-detail-icon">📍</div>
                <div>
                  <div className="pf-detail-label">location</div>
                  <div className="pf-detail-value">ICT GMT+7</div>
                </div>
              </div>
            </div>

            <div className="pf-section">
              <div className="pf-section-title">About this event</div>
              <div className="pf-description">{event.description}</div>
            </div>

            <div className="pf-rsvp-buttons">
              <button
                className="pf-btn-rsvp"
                onClick={handleRSVPClick}
                disabled={capacity && capacity.available === 0}
              >
                {capacity && capacity.available === 0 ? 'Sold Out' : 'RSVP'}
              </button>
              <button className="pf-btn-interested" onClick={() => alert('Marked as interested!')}>
                Interested
              </button>
            </div>

            <div className="pf-section" style={{ marginTop: '12px' }}>
              <div className="pf-section-title">Guest list</div>
              <div className="pf-guest-list">
                <div className="pf-guest-avatars">
                  {displayAttendees.map((attendee, idx) => (
                    <div
                      key={attendee.id || idx}
                      className={`pf-guest-avatar ${idx === 0 ? 'g1' : idx === 1 ? 'g2' : 'g3'}`}
                      title={attendee.name}
                    >
                      {getInitials(attendee.name)}
                    </div>
                  ))}
                  {remainingAttendees > 0 && (
                    <div className="pf-guest-avatar g4">+{remainingAttendees}</div>
                  )}
                </div>
                <div className="pf-guest-info">
                  <div className="pf-going-count">{attendeesArray.length} going</div>
                  <div className="pf-going-label">View all guests</div>
                </div>
                <button className="pf-view-all" onClick={handleAdminClick}>View all</button>
              </div>
            </div>

            <div className="pf-restricted">
              <div className="pf-lock-icon">🔒</div>
              <div className="pf-restricted-title">Restricted Access</div>
              <div className="pf-restricted-sub">
                Only RSVP'd guests can view event activity &amp; see who's going
              </div>
              <button className="pf-btn-rsvp-access" onClick={handleRSVPClick}>
                RSVP for access
              </button>
              <div className="pf-sign-in-row">
                Already RSVP'd? <a href="https://partiful.com/login" target="_blank" rel="noreferrer">Sign in</a>
              </div>
            </div>
          </div>

          <div className="pf-footer">
            <div className="pf-footer-logo">partiful</div>
            <div className="pf-footer-cta">Create an event for free 🎉</div>
            <div className="pf-footer-links">
              <span>Help Center</span>
              <span>Blog</span>
              <span>Explore</span>
            </div>
          </div>
        </div>
      )}

      {currentView === 'rsvp' && (
        <div className="rsvp-section">
          <div className="container">
            <button className="btn-back" onClick={() => setCurrentView('event')}>
              ← Back to event
            </button>
            
            <h2>Reserve your spot</h2>
            
            <div className="rsvp-content">
              <div className="form-column">
                <RSVPForm 
                  selectedSeat={selectedSeat}
                  onSubmitSuccess={() => {
                    setCurrentView('event');
                    fetchEventData();
                  }}
                />
              </div>
              
              <div className="seat-column">
                <h3>Pick a seat</h3>
                <SeatSelector 
                  seats={seats}
                  selectedSeat={selectedSeat}
                  onSeatSelect={handleSeatSelect}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'admin' && (
        <div className="admin-section">
          <div className="container">
            <button className="btn-back" onClick={() => setCurrentView('event')}>
              ← Back to event
            </button>
            <AdminDashboard attendees={attendees} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

