import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, get, push, onValue, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA46ArJ8xW8XwDPe0f3DKiPu3Ve_0n4A54",
    authDomain: "xclonev2-5106c.firebaseapp.com",
    projectId: "xclonev2-5106c",
    storageBucket: "xclonev2-5106c.appspot.com",
    messagingSenderId: "402683016295",
    appId: "1:402683016295:web:2226862af77fadfe5910c2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;
let currentChatRoom = null;
let typingRef = null;
let mediaRecorder = null;
let audioChunks = [];
let replyToMessageId = null;

// Sign in anonymously
signInAnonymously(auth).catch((error) => {
    console.error("Error signing in anonymously:", error);
});

// Handle authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        setActiveUser();
        updateActiveUsersCount();

        // Listen for existing chat room
        const userChatRoomRef = ref(db, `users/${currentUser.uid}/currentChatRoom`);
        onValue(userChatRoomRef, (snapshot) => {
            if (snapshot.exists()) {
                currentChatRoom = snapshot.val();
                redirectToChatRoom();
                listenForMessages();
                listenForTyping();
            }
        });
    }
});

// Update active users count
function updateActiveUsersCount() {
    const activeUsersRef = ref(db, 'activeUsers');
    onValue(activeUsersRef, (snapshot) => {
        const activeUsers = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        document.getElementById('active-user-count').textContent = activeUsers;
    });
}

// Add current user to active users
function setActiveUser() {
    const userRef = ref(db, `activeUsers/${currentUser.uid}`);
    set(userRef, {
        uid: currentUser.uid,
        timestamp: serverTimestamp()
    });

    onDisconnect(userRef).remove().then(() => {
        console.log("User disconnected.");
        updateActiveUsersCount();
    });
}

// Handle voice recording
document.getElementById('mic-icon').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                    if (mediaRecorder.state === 'inactive') {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg-3' });
                        sendVoiceMessage(audioBlob);
                    }
                };
                mediaRecorder.start();
            })
            .catch(error => console.error("Error accessing microphone:", error));
    }
});

function sendVoiceMessage(audioBlob) {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
        const base64AudioMessage = reader.result.split(',')[1];

        const chatMessagesRef = ref(db, `chatRooms/${currentChatRoom}/messages`);
        const newMessageRef = push(chatMessagesRef);

        set(newMessageRef, {
            uid: currentUser.uid,
            message: base64AudioMessage,
            isAudio: true,
            timestamp: serverTimestamp()
        }).then(() => {
            console.log("Voice message sent.");
            handleTyping();
        }).catch((error) => {
            console.error("Error sending voice message:", error);
        });
    };
}

// Listen for messages
function listenForMessages() {
    if (!currentChatRoom) return;
    const chatMessagesRef = ref(db, `chatRooms/${currentChatRoom}/messages`);
    onValue(chatMessagesRef, (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        snapshot.forEach(childSnapshot => {
            const messageData = childSnapshot.val();
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.dataset.id = childSnapshot.key;

            if (messageData.uid === currentUser.uid) {
                messageElement.classList.add('you');
                messageElement.innerHTML = `You: ${messageData.isAudio ? '<audio controls src="data:audio/mpeg;base64,' + messageData.message + '"></audio>' : messageData.message}`;
                addDeleteButton(messageElement);
            } else {
                messageElement.classList.add('stranger');
                messageElement.innerHTML = `Stranger: ${messageData.isAudio ? '<audio controls src="data:audio/mpeg;base64,' + messageData.message + '"></audio>' : messageData.message}`;
            }

            if (messageData.replyTo) {
                const replyElement = document.createElement('div');
                replyElement.classList.add('reply');
                replyElement.textContent = `Replying to: ${messageData.replyTo}`;
                messageElement.prepend(replyElement);
            }

            messageElement.addEventListener('click', () => {
                if (!messageData.isAudio) {
                    replyToMessageId = childSnapshot.key;
                    document.getElementById('reply-container').style.display = 'block';
                    document.getElementById('reply-message').textContent = messageData.message;
                }
            });

            chatBox.appendChild(messageElement);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function addDeleteButton(messageElement) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const messageId = messageElement.dataset.id;
        deleteMessage(messageId);
    });
    messageElement.appendChild(deleteBtn);
}

function deleteMessage(messageId) {
    if (!currentChatRoom) return;
    const messageRef = ref(db, `chatRooms/${currentChatRoom}/messages/${messageId}`);
    remove(messageRef).then(() => {
        console.log("Message deleted.");
    }).catch((error) => {
        console.error("Error deleting message:", error);
    });
}

// Handle sending messages
function sendMessage() {
    const chatInput = document.getElementById('chat-input').value;
    if (chatInput.trim() === '') return;

    try {
        const chatMessagesRef = ref(db, `chatRooms/${currentChatRoom}/messages`);
        const newMessageRef = push(chatMessagesRef);

        set(newMessageRef, {
            uid: currentUser.uid,
            message: chatInput,
            timestamp: serverTimestamp(),
            replyTo: replyToMessageId || null
        }).then(() => {
            console.log("Message sent.");
            document.getElementById('chat-input').value = '';
            handleTyping(); 
            document.getElementById('reply-container').style.display = 'none';
            replyToMessageId = null;
        }).catch((error) => {
            console.error("Error sending message:", error);
        });
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Cancel reply
document.getElementById('cancel-reply-btn').addEventListener('click', () => {
    document.getElementById('reply-container').style.display = 'none';
    replyToMessageId = null;
});

// Event Listeners
document.getElementById('new-chat-btn').addEventListener('click', startChat);
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('skip-btn').addEventListener('click', leaveChatRoom);
document.getElementById('chat-input').addEventListener('input', handleTyping);
document.getElementById('chat-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// Update local time
setInterval(() => {
    const localTime = new Date().toLocaleTimeString();
    document.getElementById('local-time').textContent = localTime;
}, 1000);

// Define the startChat function
function startChat() {
    // Code to start a new chat
    console.log("Starting a new chat...");
    // For instance, you might want to create a new chat room or join an existing one
}

// Define the redirectToChatRoom function
function redirectToChatRoom() {
    if (currentChatRoom) {
        // Redirect to the chat room
        console.log("Redirecting to chat room:", currentChatRoom);
        // You might navigate to a different URL or update the view to show the chat room
    }
}

// Define the leaveChatRoom function
function leaveChatRoom() {
    if (currentChatRoom) {
        // Code to leave the current chat room
        console.log("Leaving chat room:", currentChatRoom);
        currentChatRoom = null;
        const userChatRoomRef = ref(db, `users/${currentUser.uid}/currentChatRoom`);
        set(userChatRoomRef, null);
        // Optionally, navigate away or update the UI
    }
}

// Handle typing indication
function handleTyping() {
    if (currentChatRoom) {
        const typingRef = ref(db, `chatRooms/${currentChatRoom}/typing/${currentUser.uid}`);
        set(typingRef, true);
        setTimeout(() => {
            set(typingRef, false);
        }, 1000);
    }
}

// Listen for typing indication
function listenForTyping() {
    if (currentChatRoom) {
        const typingRef = ref(db, `chatRooms/${currentChatRoom}/typing`);
        onValue(typingRef, (snapshot) => {
            const typingUsers = snapshot.val() || {};
            const typingList = Object.values(typingUsers).filter(Boolean);
            document.getElementById('typing-indicator').textContent = typingList.length > 0 ? 'Typing...' : '';
        });
    }
}
