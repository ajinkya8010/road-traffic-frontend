import React from 'react';
import './PotholeCard.css';

const PotholeCard = ({ imageSrc, longitude, latitude,onResolved }) => {
  return (
    <div className="pothole-card">
      <img src={imageSrc} alt="Pothole" className="pothole-image" />
      <div className="pothole-info">
        <p>Longitude: {longitude}</p>
        <p>Latitude: {latitude}</p>
      </div>
      <button className="resolved-button" onClick={onResolved}>Resolved</button>
    </div>
  );
};

export default PotholeCard;
