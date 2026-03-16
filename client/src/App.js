import React, { useState, useEffect } from 'react';
import './App.css';
import EventHeader from './components/EventHeader';
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

  return (
    <div className="app">
      {currentView === 'event' && event && (
        <div>
          <EventHeader 
            event={event} 
            capacity={capacity}
            attendees={attendees}
          />
          <div className="event-description">
            <div className="description-box">
              <h2>{event.title}</h2>
              
              <div className="description-text">
                <p>{event.description}</p>
              </div>

              <div className="button-group">
                <button 
                  className="btn btn-primary btn-rsvp"
                  onClick={handleRSVPClick}
                  disabled={capacity && capacity.available === 0}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {capacity && capacity.available === 0 ? 'Sold Out' : 'RSVP'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleAdminClick}
                >
                  Admin
                </button>
              </div>
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

