const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 3000;
const mongoUri = 'mongodb://localhost:27017/lost-places-explorer';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- MongoDB Connection ---
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schema and Model ---
const placeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    access_notes: String,
    danger_level: { type: Number, min: 1, max: 5 },
    type: String,
    createdAt: { type: Date, default: Date.now }
});

const Place = mongoose.model('Place', placeSchema);


// --- API Endpoints ---

// GET all user-submitted places
app.get('/api/places', async (req, res) => {
    try {
        const places = await Place.find();
        res.json(places);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching places', error: error.message });
    }
});

// POST a new place
app.post('/api/places', async (req, res) => {
    const { title, latitude, longitude, access_notes, danger_level, type } = req.body;

    const newPlace = new Place({
        title,
        latitude,
        longitude,
        access_notes,
        danger_level,
        type
    });

    try {
        const savedPlace = await newPlace.save();
        res.status(201).json({
            message: 'Place submitted successfully!',
            place: savedPlace
        });
    } catch (error) {
        res.status(400).json({ message: 'Error saving place', error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
