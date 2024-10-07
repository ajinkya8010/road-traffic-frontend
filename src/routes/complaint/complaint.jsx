import React, { useState, useEffect,useContext } from 'react';
import './Complaint.css';
import { AuthContext } from '../../context/authContext';
import apiRequest from '../../lib/apiRequest';

const Complaint = () => {
  const [complaint, setComplaint] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser} = useContext(AuthContext);

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

  const handleSubmit = async(e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const {lat,lng} = location; 
    const userId = currentUser._id;
    try {
      const res = await apiRequest.post("/complaint/", {
        userId,
        lng,
        lat,
        complaint,
        category,
      });
      setMessage('Complaint Submitted!');
      setComplaint('');
      setCategory('');
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="complaint-container">
      <h2 className="complaint-title">Submit a Complaint</h2>

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="complaint">Complaint</label>
          <textarea
            id="complaint"
            className="complaint-textarea"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Describe your complaint..."
            required
          />
        </div>

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
            <option value="Road construction or maintenance work">Road construction or maintenance work</option>
            <option value="Illegal parking reducing road capacity">Illegal parking reducing road capacity</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location (auto-detected)</label>
          <input
            type="text"
            className="complaint-input"
            value={`Lat: ${location.lat}, Lng: ${location.lng}`}
            readOnly
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
