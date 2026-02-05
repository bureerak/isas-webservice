const express = require("express");
const db = require("./mysql_db.js");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());

const PORT = 3000;

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Hotel Management API",
            version: "1.0.0",
            description: "API for managing hotel rooms and bookings",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./index.js"], // Files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Helper function for database queries using promises (MySQL adapter)
// dbRun is for WRITE operations (Master)
const dbRun = async (sql, params = []) => {
    const [result] = await db.master.execute(sql, params);
    return result;
};

// dbAll is for READ operations (Slave)
const dbAll = async (sql, params = []) => {
    const [rows] = await db.slave.execute(sql, params);
    return rows;
};

// dbGet is for READ operations (Slave)
const dbGet = async (sql, params = []) => {
    const [rows] = await db.slave.execute(sql, params);
    return rows[0];
};

/**
 * @swagger
 * /seed:
 *   post:
 *     summary: Seed database with initial data
 *     description: Populates the database with RoomTypes and sample rooms (one-time setup)
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *       500:
 *         description: Server error
 */
app.post("/seed", async (req, res) => {
    // Seeding is now handled in mysql_db.js initDB
    res.json({ message: "Database seeding is handled automatically on startup." });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - guest_name
 *         - room_id
 *         - check_in_date
 *         - check_out_date
 *         - total_price
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the booking
 *         guest_name:
 *           type: string
 *           description: Name of the guest
 *         room_id:
 *           type: integer
 *           description: ID of the room
 *         check_in_date:
 *           type: string
 *           format: date
 *           description: Check-in date (YYYY-MM-DD)
 *         check_out_date:
 *           type: string
 *           format: date
 *           description: Check-out date (YYYY-MM-DD)
 *         total_price:
 *           type: number
 *           description: Total price of the stay
 *         status:
 *           type: string
 *           enum: [Confirmed, Checked_In, Checked_Out, Cancelled]
 *           description: Status of the booking
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the room
 *         room_number:
 *           type: string
 *           description: Room number
 *         room_type_id:
 *           type: integer
 *           description: ID of the room type
 *         status:
 *           type: string
 *           enum: [Available, Occupied, Cleaning, Maintenance]
 *           description: Status of the room
 */

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms (Admin)
 *     description: Returns a list of all rooms with their type information.
 *     responses:
 *       200:
 *         description: List of all rooms
 *       500:
 *         description: Server error
 */
app.get("/rooms", async (req, res) => {
    try {
        const sql = `
            SELECT 
                r.*,
                rt.name as type_name,
                rt.base_price,
                rt.capacity
            FROM Rooms r
            LEFT JOIN RoomTypes rt ON r.room_type_id = rt.id
            ORDER BY r.id ASC
        `;
        const rooms = await dbAll(sql);
        res.json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /rooms/available:
 *   get:
 *     summary: Find available rooms
 *     description: Returns a list of rooms that are not booked during the specified date range.
 *     parameters:
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Check-in date (YYYY-MM-DD)
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Check-out date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: The list of available rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       400:
 *         description: Missing checkIn or checkOut dates
 *       500:
 *         description: Server error
 */
app.get("/rooms/available", async (req, res) => {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
        return res.status(400).json({ error: "Missing checkIn or checkOut dates" });
    }

    try {
        // Logic: Select * from Rooms where NOT EXISTS in Bookings with Overlap
        // Overlap: (New_CI < Existing_CO) AND (New_CO > Existing_CI)
        // We want rooms that NEVER match this condition for the given dates.
        const sql = `
      SELECT r.*, rt.name as type_name, rt.base_price, rt.capacity
      FROM Rooms r
      JOIN RoomTypes rt ON r.room_type_id = rt.id
      WHERE r.id NOT IN (
        SELECT room_id FROM Bookings
        WHERE status IN ('Confirmed', 'Checked_In')
        AND (
          (check_in_date < ?) AND (check_out_date > ?)
        )
      )
    `;

        // Note: To check overlap:
        // (Requested_CheckIn < Existing_CheckOut) AND (Requested_CheckOut > Existing_CheckIn)
        // So we pass [checkOut, checkIn] to the query based on the clause above.
        const availableRooms = await dbAll(sql, [checkOut, checkIn]);
        res.json(availableRooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (Admin)
 *     description: Returns a list of all bookings with guest and room information.
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 */
app.get("/bookings", async (req, res) => {
    try {
        const sql = `
            SELECT 
                b.*,
                r.room_number,
                rt.name as room_type
            FROM Bookings b
            JOIN Rooms r ON b.room_id = r.id
            JOIN RoomTypes rt ON r.room_type_id = rt.id
            ORDER BY b.id DESC
        `;
        const bookings = await dbAll(sql);
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     description: Returns details of a specific booking.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
app.get("/bookings/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                b.*,
                r.room_number,
                rt.name as room_type
            FROM Bookings b
            JOIN Rooms r ON b.room_id = r.id
            JOIN RoomTypes rt ON r.room_type_id = rt.id
            WHERE b.id = ?
        `;
        const booking = await dbGet(sql, [id]);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Creates a booking if the room is available for the selected dates.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bookingId:
 *                   type: integer
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Room is not available for the selected dates
 *       500:
 *         description: Server error
 */
app.post("/bookings", async (req, res) => {
    const { guest_name, room_id, check_in_date, check_out_date, total_price } = req.body;

    if (!guest_name || !room_id || !check_in_date || !check_out_date || !total_price) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1. Overlap Check
        const overlapSql = `
      SELECT id FROM Bookings
      WHERE room_id = ?
      AND status IN ('Confirmed', 'Checked_In')
      AND (
        (check_in_date < ?) AND (check_out_date > ?)
      )
    `;
        const existingBookings = await dbAll(overlapSql, [room_id, check_out_date, check_in_date]);

        if (existingBookings.length > 0) {
            return res.status(409).json({ error: "Room is not available for the selected dates." });
        }

        // 2. Create Booking
        const insertSql = `
      INSERT INTO Bookings (guest_name, room_id, check_in_date, check_out_date, total_price, status)
      VALUES (?, ?, ?, ?, ?, 'Confirmed')
    `;
        const result = await dbRun(insertSql, [guest_name, room_id, check_in_date, check_out_date, total_price]);

        res.status(201).json({
            message: "Booking created successfully",
            bookingId: result.lastID || result.insertId // Support both or just insertId for mysql
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /bookings/{id}/check-in:
 *   patch:
 *     summary: Check-in a booking
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Cannot check-in (invalid status)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
app.patch("/bookings/:id/check-in", async (req, res) => {
    const { id } = req.params;

    try {
        const booking = await dbGet("SELECT * FROM Bookings WHERE id = ?", [id]);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.status !== 'Confirmed') {
            return res.status(400).json({ error: `Cannot check-in. Current status: ${booking.status}` });
        }

        // Transaction-like update (SQLite doesn't support nested transactions easily here without better driver, doing sequential)
        await dbRun("UPDATE Bookings SET status = 'Checked_In' WHERE id = ?", [id]);
        await dbRun("UPDATE Rooms SET status = 'Occupied' WHERE id = ?", [booking.room_id]);

        res.json({ message: "Check-in successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /bookings/{id}/check-out:
 *   patch:
 *     summary: Check-out a booking
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Check-out successful
 *       400:
 *         description: Cannot check-out (invalid status)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
app.patch("/bookings/:id/check-out", async (req, res) => {
    const { id } = req.params;

    try {
        const booking = await dbGet("SELECT * FROM Bookings WHERE id = ?", [id]);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.status !== 'Checked_In') {
            return res.status(400).json({ error: `Cannot check-out. Current status: ${booking.status}` });
        }

        await dbRun("UPDATE Bookings SET status = 'Checked_Out' WHERE id = ?", [id]);
        await dbRun("UPDATE Rooms SET status = 'Available' WHERE id = ?", [booking.room_id]);

        res.json({ message: "Check-out successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /roomtypes:
 *   get:
 *     summary: Get all room types
 *     description: Returns a list of all available room types.
 *     responses:
 *       200:
 *         description: List of room types
 *       500:
 *         description: Server error
 */
app.get("/roomtypes", async (req, res) => {
    try {
        const sql = "SELECT * FROM RoomTypes ORDER BY id ASC";
        const roomTypes = await dbAll(sql);
        res.json(roomTypes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Add a new room (Admin)
 *     description: Creates a new room. ID is auto-generated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_number
 *               - room_type_id
 *             properties:
 *               room_number:
 *                 type: string
 *               room_type_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 roomId:
 *                   type: integer
 *       400:
 *         description: Missing required fields or duplicate room number
 *       500:
 *         description: Server error
 */
app.post("/rooms", async (req, res) => {
    const { room_number, room_type_id } = req.body;

    if (!room_number || !room_type_id) {
        return res.status(400).json({ error: "Missing room_number or room_type_id" });
    }

    try {
        const insertSql = `INSERT INTO Rooms (room_number, room_type_id) VALUES (?, ?)`;
        const result = await dbRun(insertSql, [room_number, room_type_id]);

        res.status(201).json({
            message: "Room created successfully",
            roomId: result.lastID || result.insertId
        });
    } catch (err) {
        console.error(err);
        if (err.message.includes("Duplicate entry")) { // MySQL duplicate error
            return res.status(400).json({ error: "Room number already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});


/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Delete a room (Admin)
 *     description: Deletes a room by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
app.delete("/rooms/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const room = await dbGet("SELECT * FROM Rooms WHERE id = ?", [id]);
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        await dbRun("DELETE FROM Rooms WHERE id = ?", [id]);

        res.json({ message: "Room deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

