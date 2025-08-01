# Lost Places Explorer

## 🌍 Overview

Lost Places Explorer is a fullstack web application designed to help users discover, explore, and contribute to a database of abandoned places and ruins around the world. It leverages real-time data from OpenStreetMap and allows users to add their own findings.

## ✨ Features

- **Interactive Map**: A Leaflet.js map interface to explore the world.
- **Real-time OSM Data**: Automatically fetches and displays places tagged as `abandoned`, `ruins`, or `disused` from the Overpass API based on your map view.
- **User Contributions**: Users can submit their own "lost places" via a simple form, which are then saved to a database.
- **Distinct Markers**: OSM data (blue markers) and user-submitted places (green markers) are visually distinct.
- **Layer Control**: Switch between "Street" and "Satellite" map views. Toggle OSM and user-submitted data layers on and off.
- **Tag Filtering**: Filter the displayed OSM places by common tags (e.g., Industrial, Railway, Military).
- **Country Selector**: Easily jump to a specific country using a dropdown menu.
- **Location Details**: Click on any marker to see more details, including name, coordinates, and a link to its OpenStreetMap page.

## 📦 Tech Stack

- **Frontend**: Vanilla JavaScript, Leaflet.js, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **APIs**: OpenStreetMap Overpass API

## Local Development

To run this project locally, you will need Node.js and a running MongoDB instance.

### 1. Clone the repository

```bash
git clone <repository-url>
cd lost-places-explorer
```

### 2. Backend Setup

The backend server connects to the database and serves the API for user submissions.

```bash
cd backend
npm install
```

Make sure your MongoDB server is running on the default port (`mongodb://localhost:27017`).

Once dependencies are installed, you can start the server:

```bash
npm start
```
The backend will be running at `http://localhost:3000`.

### 3. Frontend Setup

The frontend is a vanilla JS application that interacts with the backend and the Overpass API.

Open a new terminal window and navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

The `npm install` command will install `http-server` to easily serve the static files.

To start the frontend server:

```bash
npm start
```
The application will be available at `http://localhost:8080`. Open this URL in your web browser to use the Lost Places Explorer.

---
*Note: The Overpass API has rate limits. If you pan or zoom around the map too quickly, you may be temporarily blocked.*
