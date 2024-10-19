import React, { useState, useEffect, useContext } from 'react';
import './Complaint.css';
import { AuthContext } from '../../context/authContext';
import apiRequest from '../../lib/apiRequest';

const Complaint = () => {
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useContext(AuthContext);

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
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation not supported by this browser');
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const { lat, lng } = location; 
    const userId = currentUser._id;

    try {
      const res = await apiRequest.post("/complaint/", {
        userId,
        lng,
        lat,
        image,
        category
      }, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      setMessage('Image submitted successfully!'); 
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="complaint-container">
      <h2 className="complaint-title">Submit a Complaint</h2>

      <form className="complaint-form" onSubmit={handleSubmit}>

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
              alt="Image Preview"
              className="image-thumbnail"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="complaint-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="Pothole">Pothole</option>
            <option value="Poor traffic light timing or synchronization">Poor traffic light timing or synchronization</option>
            <option value="Road construction/maintenance work">Road construction/maintenance work</option>
            <option value="Illegal parking reducing road capacity">Illegal parking reducing road capacity</option>
            <option value="Pandal">Pandal</option>
            <option value="Landslide/Accident">Landslide/Accident</option>
            <option value="Wrong side driving/riding">Wrong side driving/riding</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location (auto-detected or manually enter)</label>
          <input
            type="text"
            className="complaint-input"
            placeholder="Enter Latitude"
            value={location.lat}
            onChange={(e) => setLocation({ ...location, lat: e.target.value })}
            required
          />
          <input
            type="text"
            className="complaint-input"
            placeholder="Enter Longitude"
            value={location.lng}
            onChange={(e) => setLocation({ ...location, lng: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="complaint-submit" disabled={isLoading}>
          Submit Complaint
        </button>
        {error && <span>{error}</span>}
        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
};

export default Complaint;
