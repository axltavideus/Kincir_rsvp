import React from 'react';
import './EventHeader.css';

function EventHeader({ event, capacity, attendees = [] }) {
  // Ensure we always work with an array (defensive guard against malformed API responses)
  const attendeesArray = Array.isArray(attendees)
    ? attendees
    : Array.isArray(attendees?.attendees)
    ? attendees.attendees
    : [];

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get first 3 attendees for avatars
  const displayAttendees = attendeesArray.slice(0, 3);
  const remainingCount = attendeesArray.length - 3;

  return (
    <div className="event-header">
      <div className="header-background">
        {event.heroImage && <img src={event.heroImage} alt="Event Hero" className="hero-image" />}
        <div className="header-overlay"></div>
      </div>
      
      <div className="header-content">
        <h1>{event.title}</h1>
        
        <div className="header-info">
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div>
              <p className="info-label">Date</p>
              <p className="info-value">{event.date}</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">⏰</span>
            <div>
              <p className="info-label">Time</p>
              <p className="info-value">{event.time}</p>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">📍</span>
            <div>
              <p className="info-label">Location</p>
              <p className="info-value">{event.location}</p>
            </div>
          </div>
        </div>

        <div className="host-section">
          <div className="host-avatar">
            {getInitials(event.host)}
          </div>
          <div className="host-info">
            <span className="host-label">Hosted by</span>
            <span className="host-name">{event.host}</span>
          </div>
        </div>

        {attendeesArray.length > 0 && (
          <div className="attendees-section">
            <div className="attendees-avatars">
              {displayAttendees.map((attendee, index) => (
                <div 
                  key={attendee.id || index} 
                  className="attendee-avatar"
                  title={attendee.name}
                >
                  {getInitials(attendee.name)}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="attendee-avatar more">
                  +{remainingCount}
                </div>
              )}
            </div>
            <span className="attendees-text">
              <span className="attendees-count">{attendeesArray.length}</span> people going
            </span>
          </div>
        )}

        {capacity && (
          <div className="capacity-badge">
            <span className="spots">{capacity.available}</span>
            <span className="label">of {capacity.total} spots left</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventHeader;

