import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './mapDisplay.css';

// Set default icon for Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapDisplay = () => {
  const position = [18.4636, 73.8682]; // Default coordinates (Pune)
  const [places, setPlaces] = useState([]);

  // Fetch nearby places from your API
  const fetchPlaces = async () => {
    const apiKey = 'AlzaSyYtOdJC9QSxI0MITkzxG6-Rt6H-NaCiwhZ';  // Replace with your actual API key
    const url = `https://maps.gomaps.pro/maps/api/place/nearbysearch/json?keyword=college|school|university&location=${position[0]},${position[1]}&radius=200&language=en&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.results) {
        const fetchedPlaces = data.results.map((place) => ({
          id: place.place_id,
          lat: place.geometry.location.lat,
          lon: place.geometry.location.lng,
          name: place.name,
        }));
        setPlaces(fetchedPlaces);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  return (
    <MapContainer center={position} zoom={15} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {places.map((place) => (
        <Marker key={place.id} position={[place.lat, place.lon]}>
          <Popup>{place.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapDisplay;
