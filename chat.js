import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, get, push, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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
        username: currentUser.displayName || "Anonymous",
        timestamp: serverTimestamp()
    });
}

// Remove current user from active users on disconnect
function setDisconnect() {
    const userRef = ref(db, `activeUsers/${currentUser.uid}`);
    remove(userRef).then(() => console.log("User disconnected."));
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
                connectToChatRoom(randomUserId);
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

// Connect to a chat room
function connectToChatRoom(partnerUid) {
    try {
        const chatRoomRef = ref(db, 'chatRooms');
        const newChatRoomRef = push(chatRoomRef);

        set(newChatRoomRef, {
            users: [currentUser.uid, partnerUid],
            messages: []
        });

        currentChatRoom = newChatRoomRef.key;

        document.getElementById('chat-container').style.display = 'block';
        listenForMessages();
    } catch (error) {
        console.error("Error connecting to chat room:", error);
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
            username: currentUser.displayName || "Anonymous",
            message: chatInput,
            timestamp: serverTimestamp()
        });

        document.getElementById('chat-input').value = '';
    } catch (error) {
        console.error("Error sending message:", error);
    }
}
