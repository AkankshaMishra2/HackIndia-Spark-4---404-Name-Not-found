const socket = io();
let name;
let textarea = document.querySelector('#textarea');
let messageArea = document.querySelector('.message__area');
let timerDisplay = document.createElement('div'); // Timer display element
timerDisplay.setAttribute('id', 'timer');
document.body.prepend(timerDisplay); // Add timer to the body
let timeOverMessage = document.createElement('div'); // Time over message element
timeOverMessage.setAttribute('id', 'timeOverMessage');
timeOverMessage.style.color = 'red';
timeOverMessage.style.fontSize = '28px';
timeOverMessage.style.fontWeight = 'bold';
timeOverMessage.style.textAlign = 'center';
timeOverMessage.style.display = 'none'; // Hidden initially
document.body.prepend(timeOverMessage); // Add time over message to the body

let timeLeft = 1 * 30; // 10 minutes in seconds

// Prompt for user name
do {
    name = prompt('Please enter your name: ');
} while (!name);

// Add event listener for 'Enter' key to send messages
textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        sendMessage(e.target.value);
    }
});

// Function to send a message
function sendMessage(message) {
    let msg = {
        user: name,
        message: message.trim(),
    };
    appendMessage(msg, 'outgoing');
    textarea.value = '';
    scrollToBottom();

    // Send the message to the server
    socket.emit('message', msg);
}

// Function to append a message to the chat area
function appendMessage(msg, type) {
    let mainDiv = document.createElement('div');
    let className = type;
    mainDiv.classList.add(className, 'message');

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `;
    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
}

// Listen for incoming messages from the server
socket.on('message', (msg) => {
    appendMessage(msg, 'incoming');
    scrollToBottom();
});

// Scroll the message area to the bottom
function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Timer countdown function
function startTimer() {
    let timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            seconds = seconds < 10 ? '0' + seconds : seconds; // Format seconds
            timerDisplay.innerText = `Time Left: ${minutes}:${seconds}`;
        } else {
            clearInterval(timerInterval);
            timerDisplay.style.display = 'none'; // Hide the timer
            timeOverMessage.innerText = 'Time Over! Get your GCs in the wallet!';
            timeOverMessage.style.display = 'block'; // Show the time over message
        }
    }, 1000);
}

// Start the countdown timer
startTimer();
