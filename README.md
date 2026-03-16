# Kincir RSVP Platform

A Partiful-like RSVP application for the "Volunteer Engagement" event. Built with React + Node.js/Express.

## Features

- **Event Details Display** - Beautiful event page with hero image, date, time, location, and host info
- **RSVP Registration** - Simple form to register with name, email, and phone number
- **Seat Selection** - Interactive seat map for attendees to choose their preferred seating (40 seats total)
- **Capacity Management** - Real-time tracking of available spots
- **Admin Dashboard** - View all RSVPs with email/phone contact options and CSV export functionality

## Tech Stack

- **Frontend**: React 18 with responsive CSS
- **Backend**: Node.js with Express
- **Database**: SQLite3
- **API**: RESTful

## Project Structure

```
Kincir_rsvp/
├── server/
│   ├── index.js              # Express server & API routes
│   ├── package.json          # Backend dependencies
│   └── rsvp.db              # SQLite database (auto-created)
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventHeader.js
│   │   │   ├── EventHeader.css
│   │   │   ├── RSVPForm.js
│   │   │   ├── RSVPForm.css
│   │   │   ├── SeatSelector.js
│   │   │   ├── SeatSelector.css
│   │   │   ├── AdminDashboard.js
│   │   │   └── AdminDashboard.css
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── docs/
└── README.md
```

## Installation

### Prerequisites
- Node.js 14+ and npm
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. In a new terminal, navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

## API Endpoints

- `GET /api/event` - Get event details
- `GET /api/seats` - Get all seats status
- `GET /api/capacity` - Get current capacity info
- `GET /api/attendees` - Get all registered attendees (admin)
- `POST /api/rsvp` - Register a new attendee
- `GET /api/health` - Health check

## Usage

1. **View Event**: Browse event details, date, location, and available spots
2. **RSVP**: Click the RSVP button, fill in your details (name, email, phone)
3. **Select Seat**: Choose a seat from the interactive seat map
4. **Admin Dashboard**: Click "Admin Dashboard" to view all RSVPs and export data

## Database Schema

### attendees table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `email` (TEXT UNIQUE)
- `phone` (TEXT)
- `seat_number` (INTEGER)
- `status` (TEXT DEFAULT 'confirmed')
- `created_at` (DATETIME)

### seats table
- `seat_id` (INTEGER PRIMARY KEY)
- `is_available` (INTEGER)
- `attendee_id` (INTEGER FOREIGN KEY)

## Notes

- The event is limited to 40 spots
- Payment of Rp15,000 is required (currently a note in the form)
- Email validation ensures unique registrations
- The database is automatically initialized on first run

## Future Enhancements

- Payment integration
- Email confirmation notifications
- QR code generation for check-in
- User authentication
- Payment proof upload
- Event modification functionality

## License

ISC
