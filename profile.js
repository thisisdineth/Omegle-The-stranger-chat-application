import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

// Auth State Listener to ensure user is authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "signup.html"; // Redirect to sign-in/sign-up page if not authenticated
    }
});

// Load and display all user profiles
async function loadProfiles() {
    const profilesSection = document.getElementById('profiles-section');
    profilesSection.innerHTML = ''; // Clear previous profiles

    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
        const usersData = snapshot.val();
        for (const userId in usersData) {
            const userData = usersData[userId];
            const profileDiv = document.createElement('div');
            profileDiv.className = 'profile';

            profileDiv.innerHTML = `
                <img src="${userData.profilePicture || 'default-profile.png'}" alt="${userData.name}" class="profile-pic">
                <div class="profile-info">
                    <h3>${userData.name || 'Unknown Name'}</h3>
                    <p>@${userData.username || 'Unknown Username'}</p>
                </div>
            `;
            profilesSection.appendChild(profileDiv);
        }
    } else {
        profilesSection.innerHTML = '<p>No profiles available.</p>';
    }
}

// Search functionality
document.getElementById('search-bar').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const profiles = document.querySelectorAll('.profile');

    profiles.forEach(profile => {
        const name = profile.querySelector('.profile-info h3').textContent.toLowerCase();
        const username = profile.querySelector('.profile-info p').textContent.toLowerCase();
        if (name.includes(query) || username.includes(query)) {
            profile.style.display = 'block';
        } else {
            profile.style.display = 'none';
        }
    });
});

// Initial profile load
loadProfiles();

// Logout functionality
document.getElementById('logout-button').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "signup.html"; // Redirect to sign-in/sign-up page
    }).catch((error) => {
        console.error("Error signing out:", error.message);
    });
});

