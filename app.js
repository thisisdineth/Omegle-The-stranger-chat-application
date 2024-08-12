import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

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
const storage = getStorage(app);

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        loadTweets();
        loadProfilePicture();
    } else {
        console.log("No user is signed in.");
        window.location.href = "signup.html"; // Redirect to sign-in/sign-up page
    }
});

// Post Tweet
document.getElementById('tweet-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('tweet-content').value;

    const tweetRef = push(ref(db, 'tweets/'));
    await set(tweetRef, {
        uid: auth.currentUser.uid,
        content: content,
        timestamp: Date.now(),
        likes: 0
    });

    document.getElementById('tweet-content').value = '';
});

// Load Tweets
function loadTweets() {
    const tweetsRef = ref(db, 'tweets/');
    onValue(tweetsRef, (snapshot) => {
        const tweetsList = document.getElementById('tweets');
        tweetsList.innerHTML = ''; // Clear existing tweets
        snapshot.forEach((childSnapshot) => {
            const tweet = childSnapshot.val();
            const li = document.createElement('li');
            li.textContent = tweet.content;
            tweetsList.appendChild(li);
        });
    });
}

// Upload Profile Picture
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('profile-picture').files[0];

    if (file && file.size <= 2 * 1024 * 1024) { // Check file size
        const storageReference = storageRef(storage, 'profile_pictures/' + auth.currentUser.uid);
        const uploadTask = uploadBytesResumable(storageReference, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Optional: Add progress monitoring here
            }, 
            (error) => {
                console.error("Error uploading file:", error.message);
            }, 
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                document.getElementById('profile-pic').src = downloadURL; // Update profile picture
            }
        );
    } else {
        alert("Please upload a file less than 2MB.");
    }
});

// Load Profile Picture
function loadProfilePicture() {
    const user = auth.currentUser;
    if (user) {
        const storageReference = storageRef(storage, 'profile_pictures/' + user.uid);
        getDownloadURL(storageReference).then((url) => {
            document.getElementById('profile-pic').src = url;
        }).catch((error) => {
            console.error("Error loading profile picture:", error.message);
        });
    }
}

// Logout
document.getElementById('logout-button').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("User signed out.");
        window.location.href = "signup.html"; // Redirect to sign-in/sign-up page
    }).catch((error) => {
        console.error("Error signing out:", error.message);
    });
});
