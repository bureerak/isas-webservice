const mysql = require("mysql2/promise");

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "hotel_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to the MySQL database.");

        // RoomTypes Table
        await connection.query(`CREATE TABLE IF NOT EXISTS RoomTypes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            base_price DECIMAL(10, 2) NOT NULL,
            capacity INT NOT NULL
        )`);

        // Rooms Table
        await connection.query(`CREATE TABLE IF NOT EXISTS Rooms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_number VARCHAR(255) NOT NULL UNIQUE,
            room_type_id INT,
            status ENUM('Available', 'Occupied', 'Cleaning', 'Maintenance') DEFAULT 'Available',
            FOREIGN KEY (room_type_id) REFERENCES RoomTypes(id)
        )`);

        // Bookings Table
        await connection.query(`CREATE TABLE IF NOT EXISTS Bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guest_name VARCHAR(255) NOT NULL,
            room_id INT,
            check_in_date DATE NOT NULL,
            check_out_date DATE NOT NULL,
            total_price DECIMAL(10, 2) NOT NULL,
            status ENUM('Confirmed', 'Checked_In', 'Checked_Out', 'Cancelled') DEFAULT 'Confirmed',
            FOREIGN KEY (room_id) REFERENCES Rooms(id)
        )`);

        console.log("Tables created successfully.");

        // Seed RoomTypes if empty
        const [roomTypesCount] = await connection.query("SELECT COUNT(*) as count FROM RoomTypes");
        if (roomTypesCount[0].count === 0) {
            console.log("Seeding RoomTypes...");
            const roomTypes = [
                { name: "Standard", base_price: 1500, capacity: 2 },
                { name: "Deluxe", base_price: 2500, capacity: 3 },
                { name: "Suite", base_price: 4000, capacity: 4 }
            ];

            const insertRtSql = "INSERT INTO RoomTypes (name, base_price, capacity) VALUES (?, ?, ?)";
            for (const rt of roomTypes) {
                await connection.query(insertRtSql, [rt.name, rt.base_price, rt.capacity]);
            }
            console.log("RoomTypes seeded successfully.");
        }

        // Seed Rooms if empty
        const [roomsCount] = await connection.query("SELECT COUNT(*) as count FROM Rooms");
        if (roomsCount[0].count === 0) {
            console.log("Seeding Rooms...");
            const rooms = [
                { room_number: "101", room_type_id: 1 },
                { room_number: "102", room_type_id: 1 },
                { room_number: "103", room_type_id: 1 },
                { room_number: "201", room_type_id: 2 },
                { room_number: "202", room_type_id: 2 },
                { room_number: "301", room_type_id: 3 }
            ];

            const insertRoomSql = "INSERT INTO Rooms (room_number, room_type_id, status) VALUES (?, ?, 'Available')";
            for (const r of rooms) {
                await connection.query(insertRoomSql, [r.room_number, r.room_type_id]);
            }
            console.log("Rooms seeded successfully.");
        }

        connection.release();
    } catch (err) {
        console.error("Database initialization error:", err);
        // Retry logic could be added here if needed, but for now we log and process might exit or rely on restart
    }
};

// Wait for database to be ready (simple retry mechanism)
const waitForDB = async (attempts = 5) => {
    while (attempts > 0) {
        try {
            await initDB();
            return;
        } catch (err) {
            console.log("Waiting for database...");
            attempts--;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    console.error("Could not connect to database after multiple attempts.");
};

waitForDB();

module.exports = pool;
