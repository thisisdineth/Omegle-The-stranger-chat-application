import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

// Sign Up Function
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const birthday = document.getElementById('signup-birthday').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional user data in the database
        await set(ref(db, 'users/' + user.uid), {
            name: name,
            birthday: birthday,
            email: email
        });

        alert("Sign Up Successful!");
        window.location.href = "index.html"; // Redirect to the main page after sign-up
    } catch (error) {
        console.error("Sign Up Error: ", error.message);
    }
});

// Sign In Function
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        // Sign in user with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Sign In Successful!");
        window.location.href = "index.html"; // Redirect to the main page after sign-in
    } catch (error) {
        console.error("Sign In Error: ", error.message);
    }
});

// Auth State Change Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        // You can add additional code here to handle user-specific tasks when they are signed in
    } else {
        console.log("No user is signed in.");
        // Optionally, you can redirect to the sign-in page if no user is signed in
        // window.location.href = "signup.html";
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const switchBtn = document.getElementById('switch-btn');
    const signupContainer = document.getElementById('signup-container');
    const signinContainer = document.getElementById('signin-container');

    switchBtn.addEventListener('click', () => {
        if (signupContainer.style.display === 'none') {
            signupContainer.style.display = 'block';
            signinContainer.style.display = 'none';
            switchBtn.textContent = 'Already have an Account?';
        } else {
            signupContainer.style.display = 'none';
            signinContainer.style.display = 'block';
            switchBtn.textContent = 'Create an Account';
        }
    });
});