import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getDatabase, ref, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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
const firestore = getFirestore(app);

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

    // Set up disconnect to remove the user from active users when they leave
    const onDisconnectRef = ref(db, `activeUsers/${currentUser.uid}`);
    remove(onDisconnectRef).then(() => console.log("User disconnected.")).catch(console.error);
}

// Start a chat with a random user
async function startChat() {
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
}

// Connect to a chat room
async function connectToChatRoom(partnerUid) {
    const chatRoomRef = collection(firestore, 'chatRooms');
    const newChatRoomRef = await addDoc(chatRoomRef, {
        users: [currentUser.uid, partnerUid],
        messages: []
    });

    currentChatRoom = newChatRoomRef.id;
    document.getElementById('chat-container').style.display = 'block';
    listenForMessages();
}

// Listen for new messages in the chat room
function listenForMessages() {
    const chatMessagesRef = collection(firestore, `chatRooms/${currentChatRoom}/messages`);
    onSnapshot(chatMessagesRef, (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = ''; // Clear chat box before updating
        snapshot.forEach(doc => {
            const messageData = doc.data();
            const messageElement = document.createElement('p');
            messageElement.textContent = `${messageData.username}: ${messageData.message} (${new Date(messageData.timestamp.toMillis()).toLocaleTimeString()})`;
            chatBox.appendChild(messageElement);
        });
    });
}

// Send a message in the chat room
function sendMessage() {
    const chatInput = document.getElementById('chat-input').value;
    if (chatInput.trim() === '') return;

    const chatMessagesRef = collection(firestore, `chatRooms/${currentChatRoom}/messages`);
    addDoc(chatMessagesRef, {
        uid: currentUser.uid,
        username: currentUser.displayName || "Anonymous",
        message: chatInput,
        timestamp: serverTimestamp()
    });

    document.getElementById('chat-input').value = '';
}

// Clean up chat room data when user leaves
async function cleanUpChatRoom() {
    if (currentChatRoom) {
        const chatRoomRef = doc(firestore, `chatRooms/${currentChatRoom}`);
        await deleteDoc(chatRoomRef);
        currentChatRoom = null;
    }
}

// Handle authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        setActiveUser();
        updateActiveUsersCount(); // Ensure the count is updated after setting active user
    } else {
        alert("Please sign in to use the chat.");
        window.location.href = "signin.html";
    }
});

// Event Listeners
document.getElementById('start-chat').addEventListener('click', startChat);
document.getElementById('send-chat').addEventListener('click', sendMessage);

// Clean up chat room on window unload
window.addEventListener('beforeunload', cleanUpChatRoom);
