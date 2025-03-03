import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import apiRequest from '../../lib/apiRequest';
import './TrafficStatus.css';

const MapMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const TrafficStatus = () => {
  const [locationType, setLocationType] = useState('');
  const [position, setPosition] = useState(null);
  const [category, setCategory] = useState('Accidents/Crashes');
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition([position.coords.latitude, position.coords.longitude]);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Error getting your location. Please try again.");
          setIsLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!position) {
      alert('Please select a location first');
      return;
    }

    try {
      const response = await apiRequest.post('/traffic-status/', {
        latitude: position[0],
        longitude: position[1],
        category
      });
      alert('Traffic status updated successfully!');
    } catch (error) {
      alert('Error updating traffic status: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="traffic-status-container">
      <div className="traffic-status-card">
        <div className="card-header">
          <h2>Update Traffic Status</h2>
        </div>
        
        <div className="card-content">
          <div className="location-selection">
            <p className="section-label">How would you like to update the location?</p>
            <div className="radio-group">
              <div className="radio-option">
                <input 
                  type="radio" 
                  id="current" 
                  name="locationType" 
                  value="current"
                  checked={locationType === 'current'}
                  onChange={(e) => {
                    setLocationType(e.target.value);
                    getCurrentLocation();
                  }}
                />
                <label htmlFor="current">Use my current location</label>
              </div>
              
              <div className="radio-option">
                <input 
                  type="radio" 
                  id="map" 
                  name="locationType" 
                  value="map"
                  checked={locationType === 'map'}
                  onChange={(e) => {
                    setLocationType(e.target.value);
                    setPosition(null);
                  }}
                />
                <label htmlFor="map">Select location on map</label>
              </div>
            </div>
          </div>

          {locationType === 'map' && (
            <div className="map-container-status">
              <MapContainer
                center={[18.5204, 73.8567]}
                zoom={13}
                className="map"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
          )}

          {position && (
            <div className="form-section">
              <div className="coordinates-grid">
                <div className="coordinate-box">
                  <label>Latitude</label>
                  <div className="coordinate-value">{position[0]}</div>
                </div>
                <div className="coordinate-box">
                  <label>Longitude</label>
                  <div className="coordinate-value">{position[1]}</div>
                </div>
              </div>

              <div className="status-selection">
                <label htmlFor="status">Traffic Reason</label>
                <select
                  id="status"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="status-dropdown"
                >
                  <option value="Accidents/Crashes">Accidents/Crashes</option>
                  <option value="Road Closures">Road Closures</option>
                  <option value="Hazards on the Road">Hazards on the Road</option>
                  <option value="Weather Issues">Weather Issues</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`submit-button ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? 'Loading...' : 'Update Traffic Status'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficStatus;