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
├── modules/
│   ├── backend/           # Node.js backend (Express API)
│   ├── frontend/          # Nginx frontend (Static files)
│   ├── mysql-master/      # MySQL Master node
│   └── mysql-slave/       # MySQL Slave node
├── docker-compose.yaml    # Docker Orchestration
└── README.md              # Documentation
```

## 🔧 Setup & Installation

### Prerequisites
- Docker & Docker Compose installed

### Run with Docker Compose (Recommended)
1. **Clone/Download** the repository.
2. Open a terminal in the project root.
3. Run the following command:

```bash
docker-compose up -d --build
```
*Wait for a few seconds. The backend will automatically wait for the MySQL Master to be ready and the Slave to synchronize before starting.*

### Run Modules Individually (For GNS3 Deployment)
หากต้องการนำไปใช้งานใน GNS3 คุณต้อง Build Image แยกทีละตัวเพื่อให้สามารถโหลดเข้าโหนดแต่ละตัวได้:

```bash
# 1. Build MySQL Master (Node: SQL-Master)
docker build -t isas-sql-master ./modules/mysql-master

# 2. Build MySQL Slave (Node: SQL-Slave)
docker build -t isas-sql-slave ./modules/mysql-slave

# 3. Build Backend API (Node: Backend-API)
docker build -t isas-api ./modules/backend

# 4. Build Frontend Web (Node: Frontend-Web)
docker build -t isas-web ./modules/frontend
```

### 📡 Monitoring Configuration (Zabbix)
ทุก Image ถูกติดตั้ง **Zabbix Agent 2** ไว้ภายในแล้ว เพื่อความสมจริงในการจำลองเครือข่าย คุณต้องตั้งค่า Environment Variables เมื่อรันแต่ละ Container ดังนี้:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `ZBX_SERVER_HOST` | IP ของ Zabbix Server ใน GNS3 | `192.168.1.100` |
| `ZBX_HOSTNAME` | ชื่อ Host ที่จะปรากฏใน Zabbix | `Hotel-SQL-Master` |

**ตัวอย่างการรันแบบ manual (ถ้าไม่ใช้ Compose):**
```bash
docker run -d --name web-node \
  -e ZBX_SERVER_HOST=192.168.1.100 \
  -e ZBX_HOSTNAME=Hotel-Web \
  isas-web
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
