// Importing dependencies
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "dummy-password",
  database: "hotel_reservation",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err.stack);
    process.exit(1); // Exit the process if the DB connection fails
  }
  console.log("Connected to the database.");
});

// API to fetch all rooms
app.get("/api/rooms", (req, res) => {
  const query = "SELECT * FROM rooms ORDER BY floor, room_number";
  db.query(query, (err, results) => {
    if (err) return res.status(500).send({ message: "Database error", error: err });
    res.send(results);
  });
});

// API to book rooms
app.post("/api/book", (req, res) => {
  const { numRooms } = req.body;

  if (!numRooms || numRooms <= 0) {
    return res.status(400).send({ message: "Please specify a valid number of rooms to book." });
  }

  // Query to find the optimal rooms for booking
  const query = `SELECT * FROM rooms WHERE is_booked = 0 ORDER BY floor, room_number LIMIT ?`;

  db.query(query, [numRooms], (err, results) => {
    if (err) return res.status(500).send({ message: "Database error", error: err });

    if (results.length < numRooms) {
      return res.status(400).send({
        message: "Not enough rooms available to complete the booking.",
      });
    }

    const roomIds = results.map((room) => room.id);
    const updateQuery = `UPDATE rooms SET is_booked = 1 WHERE id IN (?)`;

    db.query(updateQuery, [roomIds], (err) => {
      if (err) return res.status(500).send({ message: "Error booking rooms", error: err });

      const bookedRooms = results.map((room) => room.room_number); // Send room numbers instead of IDs
      res.send({
        message: "Rooms booked successfully.",
        bookedRooms,
      });
    });
  });
});

// API to generate random room occupancy
app.post("/api/randomize", (req, res) => {
  const query = `UPDATE rooms SET is_booked = FLOOR(RAND() * 2);`;

  db.query(query, (err) => {
    if (err) return res.status(500).send({ message: "Error randomizing occupancy", error: err });
    res.send({ message: "Random occupancy generated." });
  });
});

// API to reset all bookings
app.post("/api/reset", (req, res) => {
  const query = `UPDATE rooms SET is_booked = 0`;

  db.query(query, (err) => {
    if (err) return res.status(500).send({ message: "Error resetting bookings", error: err });
    res.send({ message: "All bookings reset." });
  });
});

// Starting the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
