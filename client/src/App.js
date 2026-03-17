import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import EventPage from './EventPage';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/event/:id" element={<EventPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={<div className="landing">
          <h1>Kincir RSVP</h1>
          <p>Manage your events and RSVPs</p>
          <a href="/admin">Go to Admin Dashboard</a>
        </div>} />
      </Routes>
    </Router>
  );
}

export default App;

