import React, { useState, useEffect } from 'react';
import './Complaint.css';
import apiRequest from '../../lib/apiRequest';

const Complaint = () => {
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setMessage('');
    setError('');
  };

  const handleInputChange = () => {
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { lat, lng } = location;

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('lat', lat);
      formData.append('lng', lng);

      const res = await apiRequest.post('/complaint/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Complaint submitted successfully!');
    } catch (err) {
      setError('Error: ' + err.message);
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
            onChange={(e) => {
              setCategory(e.target.value);
              handleInputChange();
            }}
            required
          >
            <option value="">Select Category</option>
            <option value="Pothole">Pothole</option>
            <option value="Poor traffic light timing or synchronization">
              Poor traffic light timing or synchronization
            </option>
            <option value="Road construction/maintenance work">
              Road construction/maintenance work
            </option>
            <option value="Illegal parking reducing road capacity">
              Illegal parking reducing road capacity
            </option>
            <option value="Pandal">Pandal</option>
            <option value="Landslide/Accident">Landslide/Accident</option>
            <option value="Wrong side driving/riding">
              Wrong side driving/riding
            </option>
            <option value="Congestion at Bus Stops">Congestion at Bus Stops</option>
            <option value="Road Obstructions: Debris">Road Obstructions: Debris</option>
            <option value="Road Obstructions: Debris">Road Obstructions: Debris</option>
            <option value="Road Obstructions: Garbage">Road Obstructions: Garbage</option>
            <option value="Road Obstructions: Waste Management">Road Obstructions: Waste Management</option>
            <option value="Other">Other</option>
            
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="complaint-textarea"
            placeholder="Provide details about the complaint"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              handleInputChange();
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Location (auto-detected or manually enter)</label>
          <input
            type="text"
            className="complaint-input"
            placeholder="Enter Latitude"
            value={location.lat}
            onChange={(e) => {
              setLocation({ ...location, lat: e.target.value });
              handleInputChange();
            }}
            required
          />
          <input
            type="text"
            className="complaint-input"
            placeholder="Enter Longitude"
            value={location.lng}
            onChange={(e) => {
              setLocation({ ...location, lng: e.target.value });
              handleInputChange();
            }}
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
