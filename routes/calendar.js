const express = require('express');
const router = express.Router();

// Helper function to ensure calendar_events table exists
function ensureCalendarTableExists(db, callback) {
  try {
    // Check if table exists
    db.query("SHOW TABLES LIKE 'calendar_events'", (err, tables) => {
      if (err) {
        console.error('Error checking calendar table:', err);
        return callback(err);
      }
      
      if (tables.length === 0) {
        console.log('Creating calendar_events table...');
        
        // Create the table
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS calendar_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            all_day BOOLEAN DEFAULT FALSE,
            event_type ENUM('class', 'meeting', 'exam', 'holiday', 'other') DEFAULT 'other',
            color VARCHAR(20) DEFAULT '#3788d8',
            location VARCHAR(255),
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
          )
        `;
        
        db.query(createTableQuery, (err) => {
          if (err) {
            console.error('Error creating calendar table:', err);
            return callback(err);
          }
          
          // Create indexes
          const indexQueries = [
            'CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date)',
            'CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date)',
            'CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type)',
            'CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by)'
          ];
          
          let indexCount = 0;
          indexQueries.forEach(indexQuery => {
            db.query(indexQuery, (indexErr) => {
              if (indexErr) {
                console.log('Index may already exist:', indexErr.message);
              }
              indexCount++;
              if (indexCount === indexQueries.length) {
                // Insert sample data
                const sampleDataQuery = `
                  INSERT INTO calendar_events (title, description, start_date, end_date, all_day, event_type, color, location) VALUES
                  ('Web Development Class', 'Introduction to HTML and CSS', '2024-01-15 09:00:00', '2024-01-15 11:00:00', FALSE, 'class', '#3788d8', 'Ever Green Campus'),
                  ('Staff Meeting', 'Weekly staff meeting to discuss progress', '2024-01-16 14:00:00', '2024-01-16 15:00:00', FALSE, 'meeting', '#dc3545', 'Main Campus'),
                  ('Midterm Exam', 'Web Development midterm examination', '2024-01-18 10:00:00', '2024-01-18 12:00:00', FALSE, 'exam', '#ffc107', 'Ever Green Campus'),
                  ('Martin Luther King Day', 'School closed for holiday', '2024-01-20 00:00:00', '2024-01-20 23:59:59', TRUE, 'holiday', '#28a745', 'School-wide'),
                  ('Data Science Lab', 'Python programming lab session', '2024-01-22 13:00:00', '2024-01-22 16:00:00', FALSE, 'class', '#17a2b8', 'Main Campus')
                `;
                
                db.query(sampleDataQuery, (sampleErr) => {
                  if (sampleErr) {
                    console.error('Error inserting sample data:', sampleErr);
                  } else {
                    console.log('calendar_events table created successfully with sample data');
                  }
                  callback();
                });
              }
            });
          });
        });
      } else {
        callback();
      }
    });
  } catch (error) {
    console.error('Error ensuring calendar table exists:', error);
    callback(error);
  }
}

// @route   GET /api/calendar/events
// @desc    Get all calendar events
// @access  Private
router.get('/events', (req, res) => {
  const db = req.app.locals.db;
  
  // Ensure table exists
  ensureCalendarTableExists(db, (err) => {
    if (err) {
      console.error('Error ensuring calendar table exists:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    const { start, end, event_type } = req.query;

    let query = `
      SELECT 
        id,
        title,
        description,
        start_date,
        end_date,
        all_day,
        event_type,
        color,
        location,
        created_by,
        created_at,
        updated_at
      FROM calendar_events
      WHERE 1=1
    `;
    
    const params = [];

    // Filter by date range if provided
    if (start && end) {
      query += ` AND (
        (start_date BETWEEN ? AND ?) OR 
        (end_date BETWEEN ? AND ?) OR 
        (start_date <= ? AND end_date >= ?)
      )`;
      params.push(start, end, start, end, start, end);
    }

    // Filter by event type if provided
    if (event_type) {
      query += ` AND event_type = ?`;
      params.push(event_type);
    }

    query += ` ORDER BY start_date ASC`;

    db.query(query, params, (err, events) => {
      if (err) {
        console.error('Error fetching calendar events:', err);
        return res.status(500).json({ message: 'Server error while fetching events' });
      }

      // Format events for frontend calendar
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_date,
        end: event.end_date,
        allDay: event.all_day === 1,
        type: event.event_type,
        color: event.color,
        location: event.location,
        createdBy: event.created_by,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      }));

      res.json({ success: true, events: formattedEvents });
    });
  });
});

// @route   POST /api/calendar/events
// @desc    Create a new calendar event
// @access  Private
router.post('/events', (req, res) => {
  const db = req.app.locals.db;
  
  // Ensure table exists
  ensureCalendarTableExists(db, (err) => {
    if (err) {
      console.error('Error ensuring calendar table exists:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    console.log(req.body)

    const {
      title,
      description,
      start_date,
      end_date,
      all_day = false,
      event_type = 'other',
      color = '#3788d8',
      location
    } = req.body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      console.log('Title, start date, and end date are required')
      return res.status(400).json({ message: 'Title, start date, and end date are required' });
    }

    // Validate date format
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const query = `
      INSERT INTO calendar_events 
      (title, description, start_date, end_date, all_day, event_type, color, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      title,
      description || null,
      start_date,
      end_date,
      all_day,
      event_type,
      color,
      location || null,
      req.user?.id || null
    ], (err, result) => {
      if (err) {
        console.error('Error creating calendar event:', err);
        return res.status(500).json({ message: 'Server error while creating event' });
      }

      res.status(201).json({ 
        success: true, 
        message: 'Calendar event created successfully',
        eventId: result.insertId 
      });
    });
  });
});

// @route   PUT /api/calendar/events/:id
// @desc    Update a calendar event
// @access  Private
router.put('/events/:id', (req, res) => {
  const db = req.app.locals.db;
  
  // Ensure table exists
  ensureCalendarTableExists(db, (err) => {
    if (err) {
      console.error('Error ensuring calendar table exists:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    const eventId = req.params.id;
    const {
      title,
      description,
      start_date,
      end_date,
      all_day,
      event_type,
      color,
      location
    } = req.body;

    // Check if event exists
    const query = 'SELECT * FROM calendar_events WHERE id = ?';
    db.query(query, [eventId], (err, events) => {
      if (err) {
        console.error('Error checking event:', err);
        return res.status(500).json({ message: 'Server error while checking event' });
      }

      if (events.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const event = events[0];

      // Validate required fields
      if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Title, start date, and end date are required' });
      }

      // Validate date format
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      if (startDate >= endDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      const updateQuery = `
        UPDATE calendar_events 
        SET title = ?, description = ?, start_date = ?, end_date = ?, 
            all_day = ?, event_type = ?, color = ?, location = ?
        WHERE id = ?
      `;

      db.query(updateQuery, [
        title,
        description || null,
        start_date,
        end_date,
        all_day,
        event_type,
        color,
        location || null,
        eventId
      ], (err, result) => {
        if (err) {
          console.error('Error updating event:', err);
          return res.status(500).json({ message: 'Server error while updating event' });
        }

        // Fetch the updated event
        const fetchQuery = 'SELECT * FROM calendar_events WHERE id = ?';
        db.query(fetchQuery, [eventId], (err, updatedEvents) => {
          if (err) {
            console.error('Error fetching updated event:', err);
            return res.status(500).json({ message: 'Server error while fetching updated event' });
          }

          if (updatedEvents.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
          }

          const updatedEvent = updatedEvents[0];
          const formattedEvent = {
            id: updatedEvent.id,
            title: updatedEvent.title,
            description: updatedEvent.description,
            start: updatedEvent.start_date,
            end: updatedEvent.end_date,
            allDay: updatedEvent.all_day === 1,
            type: updatedEvent.event_type,
            color: updatedEvent.color,
            location: updatedEvent.location,
            createdBy: updatedEvent.created_by,
            createdAt: updatedEvent.created_at,
            updatedAt: updatedEvent.updated_at
          };

          res.json({ success: true, event: formattedEvent });
        });
      });
    });
  });
});

// @route   DELETE /api/calendar/events/:id
// @desc    Delete a calendar event
// @access  Private
router.delete('/events/:id', (req, res) => {
  const db = req.app.locals.db;
  
  // Ensure table exists
  ensureCalendarTableExists(db, (err) => {
    if (err) {
      console.error('Error ensuring calendar table exists:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    const eventId = req.params.id;

    // Check if event exists
    const query = 'SELECT * FROM calendar_events WHERE id = ?';
    db.query(query, [eventId], (err, events) => {
      if (err) {
        console.error('Error checking event:', err);
        return res.status(500).json({ message: 'Server error while checking event' });
      }

      if (events.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const event = events[0];
      const eventTitle = event.title;

      // Delete the event
      const deleteQuery = 'DELETE FROM calendar_events WHERE id = ?';
      db.query(deleteQuery, [eventId], (err, result) => {
        if (err) {
          console.error('Error deleting event:', err);
          return res.status(500).json({ message: 'Server error while deleting event' });
        }

        res.json({ success: true, message: 'Event deleted successfully' });
      });
    });
  });
});

// @route   GET /api/calendar/events/:id
// @desc    Get a specific calendar event
// @access  Private
router.get('/events/:id', (req, res) => {
  const db = req.app.locals.db;
  
  // Ensure table exists
  ensureCalendarTableExists(db, (err) => {
    if (err) {
      console.error('Error ensuring calendar table exists:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    const eventId = req.params.id;

    const query = 'SELECT * FROM calendar_events WHERE id = ?';
    db.query(query, [eventId], (err, events) => {
      if (err) {
        console.error('Error fetching event:', err);
        return res.status(500).json({ message: 'Server error while fetching event' });
      }

      if (events.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const event = events[0];
      const formattedEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_date,
        end: event.end_date,
        allDay: event.all_day === 1,
        type: event.event_type,
        color: event.color,
        location: event.location,
        createdBy: event.created_by,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      };

      res.json({ success: true, event: formattedEvent });
    });
  });
});

module.exports = router; 