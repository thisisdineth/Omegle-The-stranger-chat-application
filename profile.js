import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
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

// Auth State Listener to load profile data
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadProfile(user);
    } else {
        window.location.href = "signup.html"; // Redirect to sign-in/sign-up page if not authenticated
    }
});

// Load Profile Data
async function loadProfile(user) {
    const userRef = ref(db, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        const userData = snapshot.val();
        document.getElementById('profile-name').value = userData.name || '';
        document.getElementById('profile-birthday').value = userData.birthday || '';

        // Load profile picture if available
        if (userData.profilePicture) {
            document.getElementById('profile-pic').src = userData.profilePicture;
        }
    } else {
        console.log("No profile data available.");
    }
}

// Update Profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profile-name').value;
    const birthday = document.getElementById('profile-birthday').value;
    const user = auth.currentUser;

    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        await update(userRef, {
            name: name,
            birthday: birthday,
        });

        // Update profile name in authentication
        await updateProfile(user, { displayName: name });

        alert("Profile updated successfully!");
    }
});

// Profile Picture Upload
document.getElementById('profile-picture').addEventListener('change', async (e) => {
    const file = e.target.files[0];

    if (file && file.size <= 2 * 1024 * 1024) { // Check file size
        const user = auth.currentUser;
        const storageReference = storageRef(storage, 'profile_pictures/' + user.uid);
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
                await update(ref(db, 'users/' + user.uid), {
                    profilePicture: downloadURL
                });
            }
        );
    } else {
        alert("Please upload a file less than 2MB.");
    }
});

// Logout
document.getElementById('logout-button').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "signup.html"; // Redirect to sign-in/sign-up page
    }).catch((error) => {
        console.error("Error signing out:", error.message);
    });
});
