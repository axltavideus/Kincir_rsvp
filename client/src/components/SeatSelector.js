import React from 'react';
import './SeatSelector.css';

function SeatSelector({ seats, selectedSeat, onSeatSelect, totalSpots = 40 }) {
  const rows = 4;
  const seatsPerRow = Math.ceil(totalSpots / rows);

  const getSeatStatus = (seatId) => {
    const seat = seats.find(s => s.seat_id === seatId);
    if (!seat) return 'taken';

    // SQLite may return numbers as strings; ensure we treat only exactly "1" or 1 as available.
    const isAvailable = Number(seat.is_available) === 1;
    return isAvailable ? 'available' : 'taken';
  };

  return (
    <div className="seat-selector">
      <div className="seat-grid">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            <span className="row-label">{String.fromCharCode(65 + rowIndex)}</span>
            {Array.from({ length: seatsPerRow }).map((_, seatIndex) => {
              const seatId = rowIndex * seatsPerRow + seatIndex + 1;
              const isBeyondTotal = seatId > totalSpots;
              const status = isBeyondTotal ? 'taken' : getSeatStatus(seatId);
              const isSelected = selectedSeat === seatId;

              if (isBeyondTotal) {
                return <div key={seatId} className="seat empty" />;
              }

              return (
                <button
                  key={seatId}
                  className={`seat ${status} ${isSelected ? 'selected' : ''}`}
                  onClick={() => status === 'available' && onSeatSelect(seatId)}
                  disabled={status === 'taken'}
                  title={`Seat ${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`}
                >
                  {seatIndex + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-seat available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat taken"></div>
          <span>Taken</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat selected"></div>
          <span>Selected</span>
        </div>
      </div>

      {selectedSeat && (
        <div className="selected-info">
          <p>
            ✓ You selected <strong>Seat {String.fromCharCode(65 + Math.floor((selectedSeat - 1) / seatsPerRow))}{(selectedSeat - 1) % seatsPerRow + 1}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default SeatSelector;
