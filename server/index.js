const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database setup
const dbPath = path.join(__dirname, 'rsvp.db');
let db;

function initDatabase() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      
      // Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          location TEXT NOT NULL,
          host TEXT NOT NULL,
          total_spots INTEGER DEFAULT 40,
          hero_image TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS attendees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER DEFAULT 1,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT NOT NULL,
          seat_number INTEGER,
          status TEXT DEFAULT 'confirmed',
          has_payment_proof INTEGER DEFAULT 0,
          payment_proof_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS seats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER DEFAULT 1,
          seat_id INTEGER NOT NULL,
          is_available INTEGER DEFAULT 1,
          attendee_id INTEGER,
          FOREIGN KEY (event_id) REFERENCES events(id),
          FOREIGN KEY (attendee_id) REFERENCES attendees(id),
          UNIQUE(event_id, seat_id)
        )
      `);

      // Insert default event if none exists
        db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
        if (row && row.count === 0) {
          db.run(`
            INSERT INTO events (title, description, date, time, location, host, total_spots, hero_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            'Volunteer Engagement',
            'Haii Volunteerss!! 👋\n\nKamu diajak untuk berpartisipasi dalam acara Volunteer Engagement dengan tema "Blue Thread: A Reality We Must Face"!!\n\nUntuk konfirmasi kehadiran, mohon isi data berikut dengan lengkap: Email, Nomor Telephone, dan Nama Lengkap.\n\nVolunteer juga diminta untuk melakukan pembayaran sebesar Rp15.000. Setelah melakukan pembayaran, silakan upload bukti pembayaran dan pilih seat yang kamu mau.\n\n👉 Isi datanya, upload bukti pembayaran, dan klik RSVP untuk mengamankan tempatmu!\n\nTerima kasih dan sampai ketemu di acara! ✨',
            'Saturday, Mar 28',
            '9:00 AM BST',
            'Jakarta',
            'Wahana Visi Indonesia',
            40,
            '/images/event-hero.jpg'
          ]);
        }
      });

      // Initialize seats for default event
      db.all('SELECT COUNT(*) as count FROM seats WHERE event_id = 1', (err, rows) => {
        if (rows && rows[0].count === 0) {
          const insertSeat = db.prepare('INSERT INTO seats (event_id, seat_id, is_available) VALUES (1, ?, 1)');
          for (let i = 1; i <= 40; i++) {
            insertSeat.run(i);
          }
          insertSeat.finalize();
          console.log('Initialized 40 seats for default event');
        }
      });

      // Start server after database is initialized
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`navigate to http://localhost:${PORT}/api/health to check server status`);
      });
    }
  });
}

// API Routes

// Get event details
app.get('/api/event', (req, res) => {
  const eventId = req.query.id || 1; // Default to event ID 1 for now
  db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        time: row.time,
        location: row.location,
        host: row.host,
        totalSpots: row.total_spots,
        heroImage: row.hero_image
      });
    }
  });
});

// Get available seats
app.get('/api/seats', (req, res) => {
  const eventId = req.query.eventId || 1;
  db.all('SELECT * FROM seats WHERE event_id = ? ORDER BY seat_id', [eventId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get attendees count and capacity
app.get('/api/capacity', (req, res) => {
  const eventId = req.query.eventId || 1;
  console.log('Capacity request for eventId:', eventId);
  
  const query = `
    SELECT 
      COALESCE(confirmed_count.confirmed, 0) as confirmed,
      e.total_spots as total,
      (e.total_spots - COALESCE(confirmed_count.confirmed, 0)) as available
    FROM events e
    LEFT JOIN (
      SELECT event_id, COUNT(*) as confirmed 
      FROM attendees 
      WHERE status = 'confirmed' 
      GROUP BY event_id
    ) confirmed_count ON e.id = confirmed_count.event_id
    WHERE e.id = ?
  `;
  
  db.get(query, [eventId], (err, row) => {
    if (err) {
      console.error('Capacity query error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(row);
  });
});

// Get all attendees (admin)
app.get('/api/attendees', (req, res) => {
  const eventId = req.query.eventId || 1;
  db.all('SELECT id, name, email, phone, seat_number, status, has_payment_proof, created_at FROM attendees WHERE event_id = ? ORDER BY created_at DESC', [eventId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// RSVP - Create new attendee
app.post('/api/rsvp', (req, res) => {
  const { name, email, phone, seatNumber, hasPaymentProof, eventId = 1 } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  // Check capacity
  db.get('SELECT COUNT(*) as confirmed FROM attendees WHERE event_id = ? AND status = \'confirmed\'', [eventId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get total spots for this event
    db.get('SELECT total_spots FROM events WHERE id = ?', [eventId], (err2, eventRow) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      const totalSpots = eventRow ? eventRow.total_spots : 40;
      if (row.confirmed >= totalSpots) {
        return res.status(400).json({ error: 'Event is full' });
      }

      // Try to book seat
      const query = `
        INSERT INTO attendees (event_id, name, email, phone, seat_number, status, has_payment_proof)
        VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
      `;

      db.run(query, [eventId, name, email, phone, seatNumber || null, hasPaymentProof ? 1 : 0], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Email already registered' });
          } else {
            res.status(500).json({ error: err.message });
          }
        } else {
          // Update seat if selected
          if (seatNumber) {
            db.run('UPDATE seats SET is_available = 0, attendee_id = ? WHERE event_id = ? AND seat_id = ?', 
              [this.lastID, eventId, seatNumber]);
          }
          
          res.json({
            id: this.lastID,
            name,
            email,
            phone,
            seatNumber,
            status: 'confirmed'
          });
        }
      });
    });
  });
});

// Upload payment proof
app.post('/api/upload-proof', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Update attendee record with payment proof path
  db.run(
    'UPDATE attendees SET payment_proof_path = ?, has_payment_proof = 1 WHERE email = ?',
    [req.file.filename, email],
    function(err) {
      if (err) {
        console.error('Error updating payment proof:', err);
        return res.status(500).json({ error: 'Failed to save payment proof' });
      }
      res.json({ 
        success: true, 
        filename: req.file.filename,
        message: 'Payment proof uploaded successfully'
      });
    }
  );
});

// Event Management API Routes

// Get all events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        time: row.time,
        location: row.location,
        host: row.host,
        totalSpots: row.total_spots,
        heroImage: row.hero_image,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })));
    }
  });
});

// Create new event
app.post('/api/events', (req, res) => {
  const { title, description, date, time, location, host, totalSpots, heroImage } = req.body;

  if (!title || !description || !date || !time || !location || !host) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    INSERT INTO events (title, description, date, time, location, host, total_spots, hero_image, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  db.run(query, [title, description, date, time, location, host, totalSpots || 40, heroImage || '/images/event-hero.jpg'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const eventId = this.lastID;
      // Initialize seats for the new event
      const insertSeat = db.prepare('INSERT INTO seats (event_id, seat_id, is_available) VALUES (?, ?, 1)');
      for (let i = 1; i <= (totalSpots || 40); i++) {
        insertSeat.run(eventId, i);
      }
      insertSeat.finalize();

      res.json({
        id: eventId,
        title,
        description,
        date,
        time,
        location,
        host,
        totalSpots: totalSpots || 40,
        heroImage: heroImage || '/images/event-hero.jpg'
      });
    }
  });
});

// Update event
app.put('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const { title, description, date, time, location, host, totalSpots, heroImage } = req.body;

  if (!title || !description || !date || !time || !location || !host) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    UPDATE events 
    SET title = ?, description = ?, date = ?, time = ?, location = ?, host = ?, 
        total_spots = ?, hero_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [title, description, date, time, location, host, totalSpots || 40, heroImage || '/images/event-hero.jpg', eventId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      // If total spots changed, we might need to adjust seats
      // For simplicity, we'll just update the event for now
      res.json({
        id: eventId,
        title,
        description,
        date,
        time,
        location,
        host,
        totalSpots: totalSpots || 40,
        heroImage: heroImage || '/images/event-hero.jpg'
      });
    }
  });
});

// Delete event
app.delete('/api/events/:id', (req, res) => {
  const eventId = req.params.id;

  // Check if this is the last event
  db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last event' });
    }

    // Delete associated data first
    db.run('DELETE FROM seats WHERE event_id = ?', [eventId], (err1) => {
      if (err1) {
        return res.status(500).json({ error: err1.message });
      }

      db.run('DELETE FROM attendees WHERE event_id = ?', [eventId], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }

        db.run('DELETE FROM events WHERE id = ?', [eventId], function(err3) {
          if (err3) {
            res.status(500).json({ error: err3.message });
          } else if (this.changes === 0) {
            res.status(404).json({ error: 'Event not found' });
          } else {
            res.json({ message: 'Event deleted successfully' });
          }
        });
      });
    });
  });
});

// Error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initDatabase();

