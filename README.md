# Hotel Booking System (ISAS)

A modern, full-stack hotel booking web application featuring a glassmorphism UI, real-time availability checking, and a comprehensive admin panel. Built with Node.js, MySQL, Nginx, and Docker.

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
- **Auto-Initialization**: Automatic database schema setup for initial installation.

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0
- **Infrastructure**: Nginx (Reverse Proxy), Docker & Docker Compose

## 📂 Project Structure

```
ISAS/
├── Database/           # Backend API Service
│   ├── index.js        # Express server & API routes
│   └── mysql_db.js     # MySQL Database connection & queries
├── html/               # Frontend Static Files
│   ├── index.html      # Landing Page
│   ├── user.html       # Booking Interface
│   ├── admin.html      # Management Panel
│   ├── styles.css      # CSS Styles
│   └── app.js          # Frontend Logic
├── nginx/              # Nginx Configuration
│   └── nginx.conf      # Reverse Proxy Config
├── Dockerfile.web      # Dockerfile for frontend service
└── docker-compose.yaml # Docker Orchestration
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
*This command builds the images and starts the services in the background.*

4. **Access the application**:
   - **Main Site**: [http://localhost](http://localhost)
   - **Admin Panel**: [http://localhost/admin.html](http://localhost/admin.html)
   - **API Docs (Swagger)**: [http://localhost/api-docs](http://localhost/api-docs)

## 📡 API Endpoints

All API requests are routed through `/api`.

| Method | Endpoint             | Description |
|--------|----------------------|-------------|
| `GET`  | `/rooms`             | Get all rooms (Admin) |
| `GET`  | `/rooms/available`   | Search available rooms by date |
| `GET`  | `/roomtypes`         | Get available room types |
| `GET`  | `/bookings`          | Get all bookings (Admin) |
| `GET`  | `/bookings/:id`      | Get specific booking details |
| `POST` | `/bookings`          | Create a new booking |
| `POST` | `/rooms`             | Add a new room |
| `DELETE`| `/rooms/:id`        | Delete a room |
| `PATCH` | `/bookings/:id/check-in` | Update booking status to Checked-In |
| `PATCH` | `/bookings/:id/check-out` | Update booking status to Checked-Out |

## ⚙️ Configuration

The application uses environment variables for database configuration, which are defined in `docker-compose.yaml`.

### Database Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `DB_HOST` | Hostname of the MySQL container | `mysql_db` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `password` |
| `DB_NAME` | Database name | `hotel_db` |

### MySQL Container Variables

| Variable | Description | Value |
|----------|-------------|-------|
| `MYSQL_ROOT_PASSWORD` | Root password for MySQL | `password` |
| `MYSQL_DATABASE` | Database name to create | `hotel_db` |

## 📝 License
This project is for educational purposes (ISAS).
