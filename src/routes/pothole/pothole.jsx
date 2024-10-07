import React, { useState, useEffect, useContext } from 'react';
import './pothole.css';
import apiRequest from '../../lib/apiRequest';
import { AuthContext } from '../../context/authContext';

const Pothole = () => {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser} = useContext(AuthContext);

  // Automatically fetch user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error fetching location:', error);
        }
      );
    } else {
      console.error('Geolocation not supported by this browser.');
    }
  }, []);

  // Handle image file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const {lat,lng} = location; 
    const userId = currentUser._id;
    console.log(currentUser)
    try {
      const res = await apiRequest.post("/model/", {
        userId,
        lng,
        lat,
        image},{
        headers: {
        'Content-Type': 'multipart/form-data',
        }
      });
      setMessage('Pothole image submitted successfully!'); 
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="pothole-container">
      <h2 className="pothole-title">Upload Pothole Image</h2>

      <form className="pothole-form" onSubmit={handleSubmit} >
        <div className="form-group">
          <label htmlFor="image-upload">Upload Image</label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </div>

        {image && (
          <div className="image-preview">
            <p>Selected image: {image.name}</p>
            <img
              src={URL.createObjectURL(image)}
              alt="Pothole Preview"
              className="image-thumbnail"
            />
          </div>
        )}

        <div className="form-group">
          <label>Location (auto-detected)</label>
          <input
            type="text"
            className="location-input"
            value={`Lat: ${location.lat}, Lng: ${location.lng}`}
            readOnly
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          Submit Pothole Image
        </button>
        {error && <span>{error}</span>}
        {message && <p className="success-message">{message}</p>}

      </form>
    </div>
  );
}

export default Pothole;

