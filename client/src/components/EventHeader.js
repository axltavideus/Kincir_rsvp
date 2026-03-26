import React from 'react';

function EventHeader({ event, capacity }) {
  const getInitials = (name) => {
    if (!name) return 'W';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayTitle = event.title.length > 20 ? event.title.slice(0, 20) + '...' : event.title;
  const heroStyle = {
    backgroundImage: `linear-gradient(160deg, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.72) 45%, rgba(10,26,15,0.9) 100%), url('${event.heroImage || '/images/event-hero.jpg'}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="pf-hero" style={heroStyle}>
      <div className="pf-hero-texture"></div>
      <div className="pf-hero-stars"></div>
      <div className="pf-hero-content">
        <div className="pf-nav">
          <div className="pf-logo">Wahana Visi Indonesia</div>
        </div>

        <div className="pf-chip">
          <div className="pf-chip-dot"></div>
          {capacity ? `${capacity.available} of ${capacity.total} spots left` : 'Loading spots...'}
        </div>

        <div className="pf-event-title">{displayTitle}</div>
        <div className="pf-event-meta">
          <div className="pf-meta-row">
            <div className="pf-meta-dot"></div>
            {event.date} · {event.time}
          </div>
          <div className="pf-meta-row">
            <div className="pf-meta-dot"></div>
            {event.location} · {event.host}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventHeader;
