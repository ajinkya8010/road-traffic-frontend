import React, { useState, useEffect, useContext } from 'react';
import './Event.css';
import { AuthContext } from '../../context/authContext';
import apiRequest from '../../lib/apiRequest';

const Event = () => {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const { lat, lng } = location; 
    const userId = currentUser._id;

    try {
      const res = await apiRequest.post("/event/", {
        userId,
        lng,
        lat,
        category,
        startTime,
        endTime
      });
      setMessage('Event registered successfully!'); 
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="event-container">
      <h2 className="event-title">Register an Event</h2>

      <form className="event-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="event-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="Procession">Procession</option>
            <option value="Rally">Rally</option>
            <option value="Function">Function</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location (auto-detected or manually enter)</label>
          <input
            type="text"
            className="event-input"
            placeholder="Enter Latitude"
            value={location.lat}
            onChange={(e) => setLocation({ ...location, lat: e.target.value })}
            required
          />
          <input
            type="text"
            className="event-input"
            placeholder="Enter Longitude"
            value={location.lng}
            onChange={(e) => setLocation({ ...location, lng: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            type="datetime-local"
            id="startTime"
            className="event-input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time</label>
          <input
            type="datetime-local"
            id="endTime"
            className="event-input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="event-submit" disabled={isLoading}>
          Submit Event
        </button>
        {error && <span>{error}</span>}
        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
};

export default Event;
