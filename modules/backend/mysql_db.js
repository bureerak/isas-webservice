const mysql = require("mysql2/promise");

const masterConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "hotel_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const slaveConfig = {
    host: process.env.DB_READ_HOST || process.env.DB_HOST || "localhost",
    port: process.env.DB_READ_PORT || "3306",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "hotel_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const masterPool = mysql.createPool(masterConfig);
const slavePool = mysql.createPool(slaveConfig);

const initDB = async () => {
    try {
        const connection = await masterPool.getConnection();
        console.log("Connected to the Master MySQL database.");

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
            guest_id INT,
            room_id INT,
            check_in_date DATE NOT NULL,
            check_out_date DATE NOT NULL,
            total_price DECIMAL(10, 2) NOT NULL,
            status ENUM('Confirmed', 'Checked_In', 'Checked_Out', 'Cancelled') DEFAULT 'Confirmed',
            FOREIGN KEY (room_id) REFERENCES Rooms(id)
        )`);

        // Staff Table
        await connection.query(`CREATE TABLE IF NOT EXISTS Staff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role ENUM('manager', 'receptionist') NOT NULL DEFAULT 'receptionist',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Guests Table
        await connection.query(`CREATE TABLE IF NOT EXISTS Guests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(255),
            id_card VARCHAR(20),
            nationality VARCHAR(100),
            address TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log("Tables verified/created successfully on Master.");

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

        // Seed default Manager account if Staff table is empty
        const [staffCount] = await connection.query("SELECT COUNT(*) as count FROM Staff");
        if (staffCount[0].count === 0) {
            console.log("Seeding default admin account...");
            const bcrypt = require('bcrypt');
            const passwordHash = await bcrypt.hash('admin1234', 10);
            await connection.query(
                "INSERT INTO Staff (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
                ['admin', passwordHash, 'Hotel Manager', 'manager']
            );
            console.log("Default admin account created (username: admin, password: admin1234)");
        }

        connection.release();
    } catch (err) {
        throw err;
    }
};

const waitForDB = async (attempts = 30) => {
    while (attempts > 0) {
        try {
            // 1. Initialize Master
            await initDB();
            console.log("Master database initialized.");

            // 2. Wait for Slave to be ready and sync tables
            console.log("Waiting for Slave database to sync...");
            const slaveConn = await slavePool.getConnection();
            try {
                // Check if one of the tables exists on Slave
                await slaveConn.query("SELECT 1 FROM Rooms LIMIT 1");
                console.log("Slave database synced and ready.");
                slaveConn.release();
                return;
            } catch (slaveErr) {
                slaveConn.release();
                throw new Error(`Slave not synced yet: ${slaveErr.message}`);
            }
        } catch (err) {
            console.log(`Still waiting for database cluster to be fully ready... (${err.message})`);
            attempts--;
            if (attempts === 0) throw new Error("Database cluster failed to initialize after multiple attempts.");
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

module.exports = {
    master: masterPool,
    slave: slavePool,
    waitForDB
};
