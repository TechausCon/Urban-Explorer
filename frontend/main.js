// Initialize the map and set its view to a default location and zoom
const map = L.map('map').setView([51.505, -0.09], 13);

// --- Map Layers ---
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

streetLayer.addTo(map); // Default layer

const baseMaps = {
    "Streets": streetLayer,
    "Satellite": satelliteLayer
};

const overpassUrl = 'https://overpass-api.de/api/interpreter';
const osmMarkersLayer = L.layerGroup().addTo(map);
const userMarkersLayer = L.layerGroup().addTo(map);

const overlayMaps = {
    "OSM Places": osmMarkersLayer,
    "User Submissions": userMarkersLayer
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

// Custom icon for user-submitted places
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

let osmData = []; // To store the raw OSM data

function renderOsmMarkers(filter = 'all') {
    osmMarkersLayer.clearLayers();

    const filteredData = osmData.filter(element => {
        if (filter === 'all') return true;
        if (!element.tags) return false;

        // Simple matching, can be improved
        if (filter === 'industrial' && element.tags.industrial) return true;
        if (filter === 'railway' && element.tags.railway) return true;
        if (filter === 'military' && element.tags.military) return true;
        if (filter === 'hospital' && element.tags.amenity === 'hospital') return true;
        if (filter === 'place_of_worship' && element.tags.amenity === 'place_of_worship') return true;

        return false;
    });

    filteredData.forEach(element => {
        let lat, lon;
        if (element.type === 'node') {
            lat = element.lat;
            lon = element.lon;
        } else if (element.center) {
            lat = element.center.lat;
            lon = element.center.lon;
        }

        if (lat && lon) {
            const marker = L.marker([lat, lon]);
            const name = element.tags?.name || 'No name available';
            const osmLink = `https://www.openstreetmap.org/${element.type}/${element.id}`;
            const tags = Object.entries(element.tags).map(([key, value]) => `<li>${key}: ${value}</li>`).join('');

            const popupContent = `
                <b>${name}</b><br>
                Coordinates: ${lat.toFixed(5)}, ${lon.toFixed(5)}<br>
                <a href="${osmLink}" target="_blank">View on OSM</a>
                <hr>
                <b>Tags:</b>
                <ul>${tags}</ul>
            `;
            marker.bindPopup(popupContent);
            osmMarkersLayer.addLayer(marker);
        }
    });
}

function fetchUserPlaces() {
    fetch('http://localhost:3000/api/places')
        .then(response => response.json())
        .then(places => {
            userMarkersLayer.clearLayers();
            places.forEach(place => {
                const marker = L.marker([place.latitude, place.longitude], { icon: greenIcon });
                const popupContent = `
                    <b>${place.title}</b> (User-submitted)<br>
                    Type: ${place.type}<br>
                    Danger Level: ${place.danger_level}/5<br>
                    Access: ${place.access_notes || 'N/A'}
                `;
                marker.bindPopup(popupContent);
                userMarkersLayer.addLayer(marker);
            });
        })
        .catch(error => console.error('Error fetching user places:', error));
}

function fetchAbandonedPlaces() {
    const bounds = map.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

    const query = `
        [out:json][timeout:25];
        (
          node["abandoned:building"="yes"](${bbox});
          way["abandoned:building"="yes"](${bbox});
          relation["abandoned:building"="yes"](${bbox});
          node["building"="ruins"](${bbox});
          way["building"="ruins"](${bbox});
          relation["building"="ruins"](${bbox});
          node["disused"="yes"](${bbox});
          way["disused"="yes"](${bbox});
          relation["disused"="yes"](${bbox});
        );
        out center;
    `;

    const url = `${overpassUrl}?data=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            osmData = data.elements;
            renderOsmMarkers(); // Render all markers initially
        })
        .catch(error => {
            console.error('Error fetching abandoned places:', error);
        });
}

// --- Event Listeners and Initializers ---
document.addEventListener('DOMContentLoaded', () => {
    // Populate country dropdown
    const countryFilter = document.getElementById('country-filter');
    if (typeof countries !== 'undefined') {
        countries.sort((a, b) => a.name.localeCompare(b.name));
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = `${country.lat},${country.lon}`;
            option.textContent = country.name;
            countryFilter.appendChild(option);
        });

        countryFilter.addEventListener('change', (event) => {
            const value = event.target.value;
            if (value !== 'default') {
                const [lat, lon] = value.split(',');
                map.setView([lat, lon], 6);
            }
        });
    }

    // Handle tag filter change
    const tagFilterElement = document.getElementById('tag-filter');
    tagFilterElement.addEventListener('change', (event) => {
        renderOsmMarkers(event.target.value);
    });

    // Handle form submission
    const submissionForm = document.getElementById('submission-form');
    submissionForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(submissionForm);
        const data = Object.fromEntries(formData.entries());

        data.latitude = parseFloat(data.latitude);
        data.longitude = parseFloat(data.longitude);
        data.danger_level = parseInt(data.danger_level, 10);

        fetch('http://localhost:3000/api/places', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            console.log('Success:', result);
            alert('Place submitted successfully!');
            submissionForm.reset();
            fetchUserPlaces();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting place. See console for details.');
        });
    });

    // Fetch data on map move
    map.on('moveend', fetchAbandonedPlaces);

    // Initial data fetch
    fetchAbandonedPlaces();
    fetchUserPlaces();
});
