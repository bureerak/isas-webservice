const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/database.db", (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Connected to the SQlite database.");
});

db.serialize(() => {
    // RoomTypes Table
    db.run(`CREATE TABLE IF NOT EXISTS RoomTypes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        base_price REAL NOT NULL,
        capacity INTEGER NOT NULL
    )`);

    // Rooms Table
    db.run(`CREATE TABLE IF NOT EXISTS Rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        room_type_id INTEGER,
        status TEXT CHECK( status IN ('Available', 'Occupied', 'Cleaning', 'Maintenance') ) DEFAULT 'Available',
        FOREIGN KEY (room_type_id) REFERENCES RoomTypes(id)
    )`);

    // Bookings Table
    db.run(`CREATE TABLE IF NOT EXISTS Bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_name TEXT NOT NULL,
        room_id INTEGER,
        check_in_date TEXT NOT NULL,
        check_out_date TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT CHECK( status IN ('Confirmed', 'Checked_In', 'Checked_Out', 'Cancelled') ) DEFAULT 'Confirmed',
        FOREIGN KEY (room_id) REFERENCES Rooms(id)
    )`);

    console.log("Tables created successfully.");

    // Seed RoomTypes if empty
    db.get("SELECT COUNT(*) as count FROM RoomTypes", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }

        if (row.count === 0) {
            console.log("Seeding RoomTypes...");
            const roomTypes = [
                { name: "Standard", base_price: 1500, capacity: 2 },
                { name: "Deluxe", base_price: 2500, capacity: 3 },
                { name: "Suite", base_price: 4000, capacity: 4 }
            ];

            const stmt = db.prepare("INSERT INTO RoomTypes (name, base_price, capacity) VALUES (?, ?, ?)");
            roomTypes.forEach(rt => {
                stmt.run(rt.name, rt.base_price, rt.capacity);
            });
            stmt.finalize();
            console.log("RoomTypes seeded successfully.");
        }
    });

    // Seed Rooms if empty
    db.get("SELECT COUNT(*) as count FROM Rooms", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }

        if (row.count === 0) {
            console.log("Seeding Rooms...");
            const rooms = [
                { room_number: "101", room_type_id: 1 },
                { room_number: "102", room_type_id: 1 },
                { room_number: "103", room_type_id: 1 },
                { room_number: "201", room_type_id: 2 },
                { room_number: "202", room_type_id: 2 },
                { room_number: "301", room_type_id: 3 }
            ];

            const stmt = db.prepare("INSERT INTO Rooms (room_number, room_type_id, status) VALUES (?, ?, 'Available')");
            rooms.forEach(r => {
                stmt.run(r.room_number, r.room_type_id);
            });
            stmt.finalize();
            console.log("Rooms seeded successfully.");
        }
    });
});

module.exports = db;