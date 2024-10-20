import React from 'react';
import './PotholeCard.css';

const PotholeCard = ({ imageSrc, longitude, latitude, placeName, onResolved }) => {
  return (
    <div className="pothole-card">
      <img src={imageSrc} alt="Pothole" className="pothole-image" />
      <div className="pothole-info">
        <p>Location: {placeName}</p>
        <p>Longitude: {longitude}</p>
        <p>Latitude: {latitude}</p>
      </div>
      <button className="resolved-button" onClick={onResolved}>Resolved</button>
    </div>
  );
};

export default PotholeCard;
