// API Base URL
const API_BASE = '/api';

// Utility Functions
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

// User Page Functions
if (document.getElementById('searchForm')) {
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;

        if (new Date(checkIn) >= new Date(checkOut)) {
            showAlert('Check-out date must be after check-in date', 'error');
            return;
        }

        try {
            showLoading('roomsList');
            const response = await fetch(`${API_BASE}/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`);
            const rooms = await response.json();

            if (response.ok) {
                displayRooms(rooms, checkIn, checkOut);
                document.getElementById('roomsContainer').classList.remove('hidden');
            } else {
                showAlert(rooms.error || 'Failed to fetch rooms', 'error');
            }
        } catch (error) {
            showAlert('Error connecting to server', 'error');
            console.error(error);
        }
    });
}

function displayRooms(rooms, checkIn, checkOut) {
    const container = document.getElementById('roomsList');

    if (rooms.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">No rooms available for selected dates</p>';
        return;
    }

    container.innerHTML = rooms.map(room => `
        <div class="room-card">
            <div class="room-card-header">
                <h3 class="room-card-title">${room.type_name}</h3>
                <p>Room #${room.room_number}</p>
            </div>
            <div class="room-card-body">
                <p><strong>Capacity:</strong> ${room.capacity} guests</p>
                <p class="room-card-price">฿${room.base_price.toLocaleString()}/night</p>
                <p><strong>Status:</strong> ${room.status}</p>
                <button class="btn btn-primary" onclick="selectRoom(${room.id}, '${room.type_name}', ${room.base_price}, '${room.room_number}', '${checkIn}', '${checkOut}')">
                    Book Now
                </button>
            </div>
        </div>
    `).join('');
}

function selectRoom(roomId, typeName, basePrice, roomNumber, checkIn, checkOut) {
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = basePrice * nights;

    document.getElementById('selectedRoomId').value = roomId;
    document.getElementById('selectedRoomInfo').innerHTML = `
        <strong>${typeName}</strong> - Room #${roomNumber}<br>
        ${nights} night(s) × ฿${basePrice.toLocaleString()} = ฿${totalPrice.toLocaleString()}
    `;
    document.getElementById('bookingCheckIn').value = checkIn;
    document.getElementById('bookingCheckOut').value = checkOut;
    document.getElementById('totalPrice').value = totalPrice;

    document.getElementById('bookingFormContainer').classList.remove('hidden');
    document.getElementById('bookingFormContainer').scrollIntoView({ behavior: 'smooth' });
}

function cancelBooking() {
    document.getElementById('bookingFormContainer').classList.add('hidden');
    document.getElementById('bookingForm').reset();
}

if (document.getElementById('bookingForm')) {
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const bookingData = {
            guest_name: document.getElementById('guestName').value,
            room_id: parseInt(document.getElementById('selectedRoomId').value),
            check_in_date: document.getElementById('bookingCheckIn').value,
            check_out_date: document.getElementById('bookingCheckOut').value,
            total_price: parseFloat(document.getElementById('totalPrice').value)
        };

        try {
            const response = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (response.ok) {
                showAlert(`Booking successful! Your booking ID is: ${result.bookingId}`, 'success');
                document.getElementById('bookingForm').reset();
                document.getElementById('bookingFormContainer').classList.add('hidden');
                document.getElementById('searchBookingId').value = result.bookingId;
            } else {
                showAlert(result.error || 'Booking failed', 'error');
            }
        } catch (error) {
            showAlert('Error connecting to server', 'error');
            console.error(error);
        }
    });
}

async function loadBooking() {
    const bookingId = document.getElementById('searchBookingId').value;

    if (!bookingId) {
        showAlert('Please enter a booking ID', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}`);
        const booking = await response.json();

        if (response.ok) {
            // Create and show modal with booking details
            const modalHtml = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                    <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; position: relative;">
                        <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                        <h2 style="margin-top: 0; color: #333;">Booking #${booking.id}</h2>
                        <div style="margin: 1.5rem 0; color: #555;">
                            <p><strong>Guest:</strong> ${booking.guest_name}</p>
                            <p><strong>Room:</strong> ${booking.room_type} (${booking.room_number})</p>
                            <p><strong>Check-in:</strong> ${booking.check_in_date}</p>
                            <p><strong>Check-out:</strong> ${booking.check_out_date}</p>
                            <p><strong>Total Price:</strong> ฿${booking.total_price.toLocaleString()}</p>
                            <p><strong>Status:</strong> <span style="color: ${getStatusColor(booking.status)}">${booking.status}</span></p>
                        </div>
                        <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary" style="width: 100%;">Close</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } else {
            showAlert(booking.error || 'Booking not found', 'error');
        }

    } catch (error) {
        showAlert('Error connecting to server', 'error');
        console.error(error);
    }
}

// Admin Page Functions
async function loadRoomTypes() {
    const select = document.getElementById('roomTypeId');
    if (!select) return;

    try {
        const response = await fetch(`${API_BASE}/roomtypes`);
        const roomTypes = await response.json();

        if (response.ok && roomTypes.length > 0) {
            select.innerHTML = '<option value="">Select Room Type</option>' +
                roomTypes.map(rt => `
                    <option value="${rt.id}">${rt.name} (฿${rt.base_price.toLocaleString()}/night, ${rt.capacity} guests)</option>
                `).join('');
        } else {
            select.innerHTML = '<option value="">No room types available</option>';
        }
    } catch (error) {
        select.innerHTML = '<option value="">Error loading room types</option>';
        console.error(error);
    }
}

// Load room types when admin page loads
if (document.getElementById('addRoomForm')) {
    loadRoomTypes();

    document.getElementById('addRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const roomData = {
            room_number: document.getElementById('roomNumber').value,
            room_type_id: parseInt(document.getElementById('roomTypeId').value)
        };

        try {
            const response = await fetch(`${API_BASE}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });

            const result = await response.json();

            if (response.ok) {
                showAlert(`Room added successfully! Room ID: ${result.roomId}`, 'success');
                document.getElementById('addRoomForm').reset();
                loadAllRooms();
            } else {
                showAlert(result.error || 'Failed to add room', 'error');
            }
        } catch (error) {
            showAlert('Error connecting to server', 'error');
            console.error(error);
        }
    });
}

if (document.getElementById('deleteRoomForm')) {
    document.getElementById('deleteRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const roomId = document.getElementById('deleteRoomId').value;

        if (!confirm(`Are you sure you want to delete room ID ${roomId}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/rooms/${roomId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                showAlert('Room deleted successfully', 'success');
                document.getElementById('deleteRoomForm').reset();
                loadAllRooms();
            } else {
                showAlert(result.error || 'Failed to delete room', 'error');
            }
        } catch (error) {
            showAlert('Error connecting to server', 'error');
            console.error(error);
        }
    });
}

async function loadAllRooms() {
    const tbody = document.getElementById('roomsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><div class="spinner"></div></td></tr>';

    try {
        const response = await fetch(`${API_BASE}/rooms`);
        const rooms = await response.json();

        if (response.ok && rooms.length > 0) {
            tbody.innerHTML = rooms.map(room => `
                <tr>
                    <td>${room.id}</td>
                    <td>${room.room_number}</td>
                    <td>${room.type_name || 'N/A'}</td>
                    <td>${room.status}</td>
                    <td>฿${room.base_price ? room.base_price.toLocaleString() : 'N/A'}</td>
                    <td>${room.capacity || 'N/A'}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No rooms found</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading rooms</td></tr>';
        console.error(error);
    }
}

async function loadAllBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner"></div></td></tr>';

    try {
        const response = await fetch(`${API_BASE}/bookings`);
        const bookings = await response.json();

        if (response.ok && bookings.length > 0) {
            tbody.innerHTML = bookings.map(booking => `
                <tr>
                    <td>${booking.id}</td>
                    <td>${booking.guest_name}</td>
                    <td>${booking.room_id} (${booking.room_number})</td>
                    <td>${booking.check_in_date}</td>
                    <td>${booking.check_out_date}</td>
                    <td>฿${booking.total_price.toLocaleString()}</td>
                    <td><span style="padding: 0.25rem 0.75rem; border-radius: 8px; background: ${getStatusColor(booking.status)}; color: white; font-size: 0.875rem;">${booking.status}</span></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No bookings found</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading bookings</td></tr>';
        console.error(error);
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'Confirmed': return '#3b82f6';
        case 'Checked_In': return '#10b981';
        case 'Checked_Out': return '#6b7280';
        case 'Cancelled': return '#ef4444';
        default: return '#6b7280';
    }
}
