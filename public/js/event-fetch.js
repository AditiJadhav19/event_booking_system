import { initializeFirebase } from './firebase-config.js';
import { ref, onValue, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

(async function () {
    const database = await initializeFirebase();

    const eventContainer = document.getElementById('eventCards');
    const createEventForm = document.getElementById('createEventForm');
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById('bookingForm');
    const showMoreButton = document.getElementById('showMoreEvents');
    let currentEventId = null;
    let maxTicketsAvailable = 0;
    let events = {}; // Declare a global variable to store events

        // Function to generate three unique random images
    function getUniqueImages() {
        const imageNames = ['1.svg', '2.svg', '3.svg', '4.svg', '5.svg'];
        const selectedImages = [];
    
        while (selectedImages.length < 3) {
            const randomIndex = Math.floor(Math.random() * imageNames.length);
            const randomImage = imageNames[randomIndex];
    
            if (!selectedImages.includes(randomImage)) {
                selectedImages.push(randomImage);
            }
        }
    
        return selectedImages;
    }
    
    // Fetch events from Firebase
    const dbRef = ref(database, 'events');
    onValue(dbRef, (snapshot) => {
        events = snapshot.val(); // Store events globally
        eventContainer.innerHTML = ''; // Clear existing items
    
        if (!events) {
            eventContainer.innerHTML = `
                <div class="text-center mt-4">
                    <h3>No events are registered till today</h3>
                </div>
            `;
            showMoreButton.classList.add('d-none'); // Hide the button if no events
            return;
        }
    
        const eventKeys = Object.keys(events);
        const maxCardsToShow = 3;
    
        // Get three unique images for the cards
        const uniqueImages = getUniqueImages();
    
        // Display only the first three events
        eventKeys.slice(0, maxCardsToShow).forEach((key, index) => {
            const event = events[key];
            const availableAttendees = event.attendees - (event.booked || 0);
            const randomImage = `images/${uniqueImages[index]}`; // Use unique image for each card
    
            const eventCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <img src="${randomImage}" class="card-img-top" alt="Event Image" style="width: 100%; height: 200px; object-fit: contain;">
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
            eventContainer.innerHTML += eventCard;
        });
    
        // Show the "Show More Events" button if there are more than three events
        if (eventKeys.length > maxCardsToShow) {
            showMoreButton.classList.remove('d-none');
        } else {
            showMoreButton.classList.add('d-none');
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

    // Redirect to another page when "Show More Events" is clicked
    showMoreButton.addEventListener('click', () => {
        window.location.href = 'more-events.html'; // Redirect to the "More Events" page
    });

    // Handle event creation
    createEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEvent = {
            title: document.getElementById('eventName').value,
            organizer: document.getElementById('organizerName').value,
            email: document.getElementById('email').value,
            contact: document.getElementById('contactNumber').value,
            type: document.getElementById('eventType').value,
            attendees: parseInt(document.getElementById('attendees').value, 10),
            details: document.getElementById('eventDetails').value,
            date: document.getElementById('eventDate').value, // Capture the selected date
            booked: 0 // Initialize booked attendees to 0
        };
        push(dbRef, newEvent);
        createEventForm.reset();
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