import React from 'react';
import './complaintCard.css';

const ComplaintCard = ({ imageSrc, longitude, latitude, category, onResolved }) => {
  return (
    <div className="complaint-card">
      <img src={imageSrc} alt="Complaint" className="complaint-image" />
      <div className="complaint-info">
        <p>Category: {category}</p>
        <p>Longitude: {longitude}</p>
        <p>Latitude: {latitude}</p>
      </div>
      <button className="resolved-button" onClick={onResolved}>Resolved</button>
    </div>
  );
};

export default ComplaintCard;
