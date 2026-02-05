# Hotel Booking System (ISAS)

A modern, full-stack hotel booking web application featuring a glassmorphism UI, real-time availability checking, and a comprehensive admin panel. Built with Node.js, MySQL (Master-Slave Replication), Nginx, and Docker.

## 🚀 Features

### User Features
- **Modern UI**: Responsive glassmorphism design with smooth animations.
- **Room Search**: Filter available rooms by check-in/check-out dates.
- **Booking System**: Real-time room booking with price calculation.
- **My Bookings**: View booking details by booking ID.

### Admin Features
- **Dashboard**: Overview of all rooms and bookings.
- **Room Management**: Add new rooms with dynamic room types, delete existing rooms.
- **Booking Management**: View all customer bookings with status indicators.
- **Scalable Architecture**: Master-Slave replication for separating Read and Write operations.

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0 (Master-Slave Replication)
- **Infrastructure**: Nginx (Reverse Proxy), Docker & Docker Compose

## 📂 Project Structure

```
ISAS/
├── Database/           # Backend API Service
│   ├── index.js        # Express server & R/W Splitting logic
│   └── mysql_db.js     # Master/Slave connection pools
├── mysql/              # Database Configuration
│   ├── conf/           # Custom my.cnf for Master/Slave
│   └── initmaster/     # Replication user setup lines
├── html/               # Frontend Static Files
│   ├── index.html      # Landing Page
│   ├── styles.css      # CSS Styles
│   └── app.js          # Frontend Logic
├── nginx/              # Nginx Configuration
│   └── nginx.conf      # Reverse Proxy Config
└── docker-compose.yaml # Docker Orchestration (1 API, 2 MySQL, 1 Web)
```

## 🔧 Setup & Installation

### Prerequisites
- Docker & Docker Compose installed

### Run the Application
1. **Clone/Download** the repository.
2. Open a terminal in the project root.
3. Run the following command:

```bash
docker-compose up -d --build
```
*This command starts one Master DB, one Slave DB, the API service, and the Nginx web server.*

Alternatively, to build the images individually:
```bash
docker build -t hotel-mysql-master -f mysql/master.Dockerfile ./mysql
docker build -t hotel-mysql-slave -f mysql/slave.Dockerfile ./mysql
docker build -t hotel-api ./Database
docker build -t hotel-web -f Dockerfile.web .
```

4. **Verify Replication**:
   - Access the Slave database and run: `SHOW REPLICA STATUS\G;`
   - It should show `Replica_IO_Running: Yes` and `Replica_SQL_Running: Yes`.

5. **Access the application**:
   - **Main Site**: [http://localhost](http://localhost)
   - **Admin Panel**: [http://localhost/admin.html](http://localhost/admin.html)

## 📡 API Endpoints

All API requests are routed through `/api`. Read operations are automatically load-balanced to the Slave, while Write operations go to the Master.

| Method | Endpoint             | DB Target | Description |
|--------|----------------------|-----------|-------------|
| `GET`  | `/rooms`             | Slave     | Get all rooms (Admin) |
| `GET`  | `/rooms/available`   | Slave     | Search available rooms |
| `GET`  | `/bookings`          | Slave     | Get all bookings (Admin) |
| `POST` | `/bookings`          | Master    | Create a new booking |
| `PATCH`| `.../check-in`       | Master    | Update booking status |
| `DELETE`| `/rooms/:id`        | Master    | Delete a room |

## ⚙️ Configuration

| Variable | Description | Value |
|----------|-------------|-------|
| `DB_HOST` | Master DB Host | `mysql_master` |
| `DB_READ_HOST` | Slave DB Host | `mysql_slave` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `password` |

## 📝 License
This project is for educational purposes (ISAS).
