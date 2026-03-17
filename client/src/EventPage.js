import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';
import EventHeader from './components/EventHeader';
import RSVPForm from './components/RSVPForm';
import SeatSelector from './components/SeatSelector';

function EventPage() {
  const { id } = useParams();
  const eventId = parseInt(id) || 1;
  const [event, setEvent] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [seats, setSeats] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const [eventRes, capacityRes, seatsRes, attendeesRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/capacity?eventId=${eventId}`),
        fetch(`/api/seats?eventId=${eventId}`),
        fetch(`/api/attendees?eventId=${eventId}`)
      ]);

      if (!eventRes.ok) {
        throw new Error('Event not found');
      }

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
      const res = await fetch(`/api/attendees?eventId=${eventId}`);
      const data = await res.json();
      setAttendees(data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const [showRSVP, setShowRSVP] = useState(false);

  if (loading) {
    return <div className="loading">Loading event...</div>;
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  const spotsText = capacity ? `${capacity.available} of ${capacity.total} spots left` : 'Loading spots...';

  return (
    <div className="app">
      <div className="pf-root">
        <EventHeader event={event} capacity={capacity} />
        <div className="pf-body">
          <div className="pf-host-card">
            <div className="pf-avatar-emoji">🙂</div>
            <div className="pf-host-info">
              <div className="pf-host-label">Hosted by</div>
              <div className="pf-host-name">{event.host}</div>
            </div>
            <div className="pf-spots-badge">{spotsText}</div>
          </div>

          <div className="pf-section" style={{ marginTop: '12px' }}>
            <div className="pf-detail-row">
              <div className="pf-detail-icon">📅</div>
              <div>
                <div className="pf-detail-label">Date &amp; time</div>
                <div className="pf-detail-value">{event.date} · {event.time}</div>
              </div>
            </div>
            <div className="pf-detail-row">
              <div className="pf-detail-icon">📍</div>
              <div>
                <div className="pf-detail-label">Location</div>
                <div className="pf-detail-value">{event.location}</div>
              </div>
            </div>
          </div>

          <div className="pf-section">
            <div className="pf-section-title">About this event</div>
            <div className="pf-description">{event.description}</div>
          </div>

          <div className="pf-rsvp-buttons">
            <button className="pf-btn-rsvp" onClick={() => setShowRSVP(true)}>
              RSVP
            </button>
            <button className="pf-btn-interested" onClick={() => alert('Marked as interested!')} >
              Interested
            </button>
          </div>

          {!showRSVP && (
            <div className="pf-restricted">
              <div className="pf-lock-icon">🔒</div>
              <div className="pf-restricted-title">Restricted Access</div>
              <div className="pf-restricted-sub">Only RSVP'd guests can view event activity &amp; see who's going</div>
              <button className="pf-btn-rsvp-access" onClick={() => setShowRSVP(true)}>
                RSVP for access
              </button>
              <div className="pf-sign-in-row">
                Already RSVP'd? <a href="#">Sign in</a>
              </div>
            </div>
          )}

          {showRSVP && (
            <div className="modal-overlay" onClick={() => setShowRSVP(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowRSVP(false)}>
                  ×
                </button>
                <div className="rsvp-container">
                  <RSVPForm
                    selectedSeat={selectedSeat}
                    eventId={eventId}
                    onSubmitSuccess={() => {
                      fetchAttendees();
                      fetchEventData();
                      setSelectedSeat(null);
                      setShowRSVP(false);
                    }}
                  />
                  <SeatSelector
                    seats={seats}
                    attendees={attendees}
                    selectedSeat={selectedSeat}
                    onSeatSelect={setSelectedSeat}
                    totalSpots={event.totalSpots}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventPage;