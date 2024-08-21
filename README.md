

```markdown
# Find a Guest | Chat Application

Welcome to the **Find a Guest** chat application! This app allows users to chat with strangers and find new people to talk to. It features user authentication, profile management, and real-time chat functionality.

## Features

- **Sign Up & Sign In**: Users can create an account or log in using email/password or Google authentication.
- **Profile Management**: Users can upload a profile picture and manage their profile.
- **Real-Time Chat**: Users can chat with strangers in real-time and find new people to connect with.
- **Password Reset**: Users can request a password reset via email.

## Technologies Used

- **Firebase**: For authentication, database, and storage.
- **HTML/CSS**: For building the user interface.
- **JavaScript**: For app functionality and real-time operations.

## Setup

### 1. Firebase Configuration

Replace the placeholders in `auth.js` with your actual Firebase project configuration:

```javascript
// Initialize Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual API key
    authDomain: "YOUR_AUTH_DOMAIN", // Replace with your Firebase Auth domain
    projectId: "YOUR_PROJECT_ID", // Replace with your Firebase project ID
    storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your Firebase storage bucket
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Firebase messaging sender ID
    appId: "YOUR_APP_ID" // Replace with your Firebase app ID
};
```

### 2. Install Dependencies

Make sure to include the Firebase SDKs in your project. Your `auth.js` script imports these SDKs from the CDN.

### 3. HTML Structure

Ensure your `index.html` or other HTML files are set up correctly. An example is provided:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="chat.css">
    <title>Find a Guest | Chat</title>
</head>
<body>
    <div id="header">
        <div id="header-left">
            <img src="img/logo.png" alt="Logo" id="logo">
            <span id="active-users">Active Users: <span id="active-user-count">0</span></span>
        </div>
        <div id="header-right">
            <span id="local-time"></span>
        </div>
    </div>
    <div id="status">Keep In mind You are chatting with stranger, Talk more respectfully!</div>
    <div id="chat-container">
        <div id="chat-box"></div>
        <div id="typing-indicator"></div>
    </div>
    <div id="chat-input-container">
        <input type="text" id="chat-input" placeholder="You: Type a message...">
        <button id="send-btn">Send</button>
    </div>
    <div id="controls">
        <button id="new-chat-btn">Find New One To Chat</button>
        <button id="skip-btn">Leave The Chat</button>
    </div>
    <script type="module" src="chat.js"></script>
    <footer>
        <p class="ptext"> &copy; 2024 findaguest.online | by Dineth Gunawardana</p>
    </footer>
</body>
</html>
```

## Usage

### Authentication

- **Sign Up**: Users can sign up with email/password or Google. Profile picture and username are required for Google sign-ups.
- **Sign In**: Users can log in with email/password or username (if registered).

### Chat Functionality

- **Start New Chat**: Click "Find New One To Chat" to connect with a new stranger.
- **Skip Chat**: Click "Leave The Chat" to disconnect and find a new chat partner.

### Password Reset

- **Forgot Password**: Click the "Forgot Password" link to request a password reset email.

## Running the Project

1. Ensure you have a local server running to serve your HTML files. You can use tools like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-server) in Visual Studio Code.
2. Open the `index.html` file in your browser.

## Contributing

Feel free to submit issues or pull requests if you find any bugs or have suggestions for improvements!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Find a Guest** | 2024 by Dineth Gunawardana
```
