import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getDatabase, ref, set, get, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth();

let currentChatId = null;
let isChatting = false;
let currentUserUid = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        set(ref(rtdb, `activeUsers/${currentUserUid}`), {
            timestamp: Date.now(),
        });

        setupRealTimeChat();
    }
});

// Display local time
const updateTime = () => {
    const now = new Date();
    document.getElementById('local-time').textContent = now.toLocaleTimeString();
};
setInterval(updateTime, 1000);

function setupRealTimeChat() {
    const activeUserCountRef = ref(rtdb, 'activeUsers');
    onValue(activeUserCountRef, (snapshot) => {
        const activeUsers = snapshot.val();
        const activeUserCount = activeUsers ? Object.keys(activeUsers).length : 0;
        document.getElementById('active-user-count').textContent = activeUserCount;

        if (!isChatting) {
            findChatPartner(activeUsers);
        }
    });

    document.getElementById('new-chat-btn').addEventListener('click', startNewChat);
    document.getElementById('skip-btn').addEventListener('click', skipChat);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
}

async function findChatPartner(activeUsers) {
    if (!activeUsers) return;

    const availableUsers = Object.keys(activeUsers).filter(uid => uid !== currentUserUid);

    if (availableUsers.length > 0) {
        const partnerUid = availableUsers[Math.floor(Math.random() * availableUsers.length)];

        // Create a new chat document in Firestore
        const chatDoc = await addDoc(collection(db, 'chats'), {
            users: [currentUserUid, partnerUid],
            messages: [],
            createdAt: serverTimestamp(),
        });

        currentChatId = chatDoc.id;
        isChatting = true;

        document.getElementById('status').textContent = 'Stranger connected!';
        document.getElementById('chat-container').style.display = 'block';

        // Listen for messages
        onSnapshot(doc(db, 'chats', currentChatId), (snapshot) => {
            const chatData = snapshot.data();
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = '';

            chatData.messages.forEach((msg) => {
                const messageElement = document.createElement('p');
                messageElement.textContent = msg.text;
                chatBox.appendChild(messageElement);
            });

            chatBox.scrollTop = chatBox.scrollHeight;
        });
    } else {
        document.getElementById('status').textContent = 'No active users available.';
    }
}

function startNewChat() {
    if (currentChatId) {
        deleteDoc(doc(db, 'chats', currentChatId));
        currentChatId = null;
    }

    isChatting = false;
    document.getElementById('status').textContent = 'Connecting to a user...';
    document.getElementById('chat-container').style.display = 'none';
}

function skipChat() {
    startNewChat();
    setupRealTimeChat();
}

function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const messageText = messageInput.value.trim();

    if (messageText && currentChatId) {
        const chatRef = doc(db, 'chats', currentChatId);
        addDoc(collection(chatRef, 'messages'), {
            text: messageText,
            createdAt: serverTimestamp(),
            sender: currentUserUid,
        });

        messageInput.value = '';
    }
}
