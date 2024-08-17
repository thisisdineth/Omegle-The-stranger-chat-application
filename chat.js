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

    // Remove user from active users on disconnect
    onDisconnect(userRef).remove().then(() => {
        console.log("User disconnected.");
        updateActiveUsersCount();
    });
}

// Start a chat with a random user
async function startChat() {
    try {
        const activeUsersRef = ref(db, 'activeUsers');
        const snapshot = await get(activeUsersRef);

        if (snapshot.exists()) {
            const activeUsers = snapshot.val();
            const userIds = Object.keys(activeUsers).filter(uid => uid !== currentUser.uid);

            if (userIds.length > 0) {
                const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
                await connectToChatRoom(randomUserId);
            } else {
                alert("No other users are currently online. Please wait...");
            }
        } else {
            alert("No active users available.");
        }
    } catch (error) {
        console.error("Error starting chat:", error);
    }
}

// Connect to a chat room or create one if it doesn't exist
async function connectToChatRoom(partnerUid) {
    const chatRoomsRef = ref(db, 'chatRooms');
    const userChatRoomRef = ref(db, `users/${currentUser.uid}/currentChatRoom`);
    const partnerChatRoomRef = ref(db, `users/${partnerUid}/currentChatRoom`);

    // Check if a chat room already exists between the two users
    let existingChatRoom = null;
    const existingChatRoomsSnapshot = await get(chatRoomsRef);
    if (existingChatRoomsSnapshot.exists()) {
        existingChatRoomsSnapshot.forEach(roomSnapshot => {
            const roomData = roomSnapshot.val();
            if (roomData.users && roomData.users.includes(currentUser.uid) && roomData.users.includes(partnerUid)) {
                existingChatRoom = roomSnapshot.key;
            }
        });
    }

    if (existingChatRoom) {
        currentChatRoom = existingChatRoom;
        await set(userChatRoomRef, currentChatRoom);
        await set(partnerChatRoomRef, currentChatRoom);
    } else {
        const newChatRoomRef = push(chatRoomsRef);
        currentChatRoom = newChatRoomRef.key;
        await set(newChatRoomRef, {
            users: [currentUser.uid, partnerUid],
            messages: []
        });
        await set(userChatRoomRef, currentChatRoom);
        await set(partnerChatRoomRef, currentChatRoom);
    }

    console.log(`Connected to chat room with ID: ${currentChatRoom}`);
    redirectToChatRoom();
    listenForMessages();
    listenForTyping();
}

// Redirect user to the chat room
function redirectToChatRoom() {
    alert("Successfully connected to a user! You can now start chatting.");
    document.getElementById('chat-container').style.display = 'block';
}

// Listen for new messages in the chat room
function listenForMessages() {
    if (!currentChatRoom) return;
    const chatMessagesRef = ref(db, `chatRooms/${currentChatRoom}/messages`);
    onValue(chatMessagesRef, (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        snapshot.forEach(childSnapshot => {
            const messageData = childSnapshot.val();
            const messageElement = document.createElement('p');
            messageElement.textContent = `${messageData.uid === currentUser.uid ? 'You' : 'Stranger'}: ${messageData.message}`;
            chatBox.appendChild(messageElement);
        });
    });
}

// Listen for typing status
function listenForTyping() {
    typingRef = ref(db, `chatRooms/${currentChatRoom}/typing`);
    onValue(typingRef, (snapshot) => {
        const typingData = snapshot.val();
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingData && typingData.uid !== currentUser.uid) {
            typingIndicator.textContent = "Stranger is typing...";
        } else {
            typingIndicator.textContent = "";
        }
    });
}

// Handle typing event
function handleTyping() {
    if (typingRef) {
        set(typingRef, {
            uid: currentUser.uid,
            timestamp: serverTimestamp()
        });
    }
}

// Send a message in the chat room
function sendMessage() {
    const chatInput = document.getElementById('chat-input').value;
    if (chatInput.trim() === '') return;

    try {
        const chatMessagesRef = ref(db, `chatRooms/${currentChatRoom}/messages`);
        const newMessageRef = push(chatMessagesRef);

        set(newMessageRef, {
            uid: currentUser.uid,
            message: chatInput,
            timestamp: serverTimestamp()
        }).then(() => {
            console.log("Message sent.");
            document.getElementById('chat-input').value = '';
            handleTyping(); // Reset typing status
        }).catch((error) => {
            console.error("Error sending message:", error);
        });
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Leave the chat room and clear messages
async function leaveChatRoom() {
    if (currentChatRoom) {
        const chatRoomRef = ref(db, `chatRooms/${currentChatRoom}`);
        await remove(chatRoomRef);
        currentChatRoom = null;
        document.getElementById('chat-box').innerHTML = '';
        document.getElementById('chat-container').style.display = 'none';
        alert("You have left the chat.");
    }
}

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

// Update the local time periodically
setInterval(() => {
    const localTime = new Date().toLocaleTimeString();
    document.getElementById('local-time').textContent = localTime;
}, 1000);
