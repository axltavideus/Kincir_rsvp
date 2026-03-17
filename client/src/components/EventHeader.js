import React from 'react';
import './EventHeader.css';

function EventHeader({ event }) {
  const getInitials = (name) => {
    if (!name) return 'W';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="hero">
      <div className="stars"></div>

      <div className="logo-bar">
        <span className="logo">p</span>
      </div>

      <h1 className="event-title">{event.title}</h1>

      <div className="host-pill">
        <div className="host-avatar">{getInitials(event.host)}</div>
        <span>
          Hosted by <strong>{event.host}</strong>
        </span>
      </div>
    </div>
  );
}

export default EventHeader;

