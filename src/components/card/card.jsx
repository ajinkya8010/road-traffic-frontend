import React from 'react';
import './Card.css';

const Card = ({ obj }) => {
  return (
    <div className="custom-card">
      <img src={obj['src']} alt="Card Image" className="card-image" />
      <div className="card-content">
        <h3>{obj['desc']} - {obj['points']}</h3>
        <button className="card-button">Redeem</button>
      </div>
    </div>
  );
};

export default Card;