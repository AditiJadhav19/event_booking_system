import { initializeFirebase } from './firebase-config.js';
import { ref, onValue, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

(async function () {
    const database = await initializeFirebase();
    const allEventContainer = document.getElementById('allEventCards');
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById('bookingForm');
    let currentEventId = null;
    let maxTicketsAvailable = 0;
    let events = {}; // Declare a global variable to store events

    // Fetch all events from Firebase
    const dbRef = ref(database, 'events');
    onValue(dbRef, (snapshot) => {
        events = snapshot.val(); // Store events globally
        allEventContainer.innerHTML = ''; // Clear existing items

        if (!events) {
            allEventContainer.innerHTML = `
                <div class="text-center mt-4">
                    <h3>No events are registered till today</h3>
                </div>
            `;
            return;
        }

        const imageNames = ['1.svg', '2.svg', '3.svg', '4.svg', '5.svg']; // Array of image names
        let imageIndex = 0; // Initialize image index

        for (const key in events) {
            const event = events[key];
            const availableAttendees = event.attendees - (event.booked || 0);

            // Get the image for the current card in a cyclic manner
            const imageName = imageNames[imageIndex % imageNames.length];
            imageIndex++; // Increment the image index for the next card

            const eventCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <img src="images/${imageName}" class="card-img-top" alt="Event Image" style="width: 100%; height: 200px; object-fit: contain;">
                        <div class="card-body">
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text"><strong>Organizer:</strong> ${event.organizer}</p>
                            <p class="card-text"><strong>Type:</strong> ${event.type}</p>
                            <p class="card-text"><strong>Available Attendees:</strong> ${availableAttendees}</p>
                            <button class="btn btn-primary book-now" data-id="${key}" data-available="${availableAttendees}">Book Now</button>
                        </div>
                    </div>
                </div>
            `;
            allEventContainer.innerHTML += eventCard;
        }

        // Add event listeners for "Book Now" buttons
        document.querySelectorAll('.book-now').forEach(button => {
            button.addEventListener('click', (e) => {
                currentEventId = e.target.getAttribute('data-id');
                maxTicketsAvailable = parseInt(e.target.getAttribute('data-available'), 10);

                // Update modal ticket limit message
                document.getElementById('ticketLimit').textContent = `Maximum tickets you can book: ${maxTicketsAvailable}`;

                // Show the booking modal
                bookingModal.show();
            });
        });
    });

    // Handle booking form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const phone = document.getElementById('userPhone').value;
        const tickets = parseInt(document.getElementById('userTickets').value, 10);

        if (tickets > maxTicketsAvailable) {
            alert('Error: Number of tickets exceeds available attendees.');
            return;
        }

        const eventRef = ref(database, `events/${currentEventId}`);
        const bookingsRef = ref(database, `bookings/${currentEventId}`); // Reference for storing user bookings

        // Update the booked count for the event
        update(eventRef, {
            booked: (events[currentEventId].booked || 0) + tickets
        }).then(() => {
            // Store user booking details
            const bookingDetails = {
                name,
                email,
                phone,
                tickets
            };
            push(bookingsRef, bookingDetails).then(() => {
                alert('Booking successful!');
                bookingModal.hide(); // Close the modal
                bookingForm.reset(); // Reset the form
            }).catch((error) => {
                console.error('Error storing booking details:', error);
                alert('Failed to store booking details. Please try again.');
            });
        }).catch((error) => {
            console.error('Error booking event:', error);
            alert('Failed to book event. Please try again.');
        });
    });
})();