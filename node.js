// server.js (Node.js and Express)

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/twitter-clone', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema and Model
const userSchema = new mongoose.Schema({
    uid: String,
    verified: Boolean,
    name: String
});
const User = mongoose.model('User', userSchema);

// Route to update user verification status
app.post('/update-verification', async (req, res) => {
    const { userId, verified } = req.body;

    try {
        await User.updateOne({ uid: userId }, { $set: { verified } });
        res.status(200).send({ message: 'User verification status updated.' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to update verification status.' });
    }
});

// Route to get tweets (example)
app.get('/tweets', async (req, res) => {
    const tweets = [
        { id: '1', userId: 'r7cftIXj5KXgdthiPa2W0z9B9Un1', content: 'Hello World!', authorName: 'John Doe' },
        { id: '2', userId: '2HMeoRwreZNAFusGU3xLldvQflh1', content: 'Another tweet!', authorName: 'Jane Smith' }
    ];
    res.status(200).json(tweets);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
