import React, { useEffect, useState } from 'react';
import './potholeDisplay.css';
import PotholeCard from '../../components/potholeCard/potholeCard';
import apiRequest from "../../lib/apiRequest";

const PotholeDisplay = () => {
  const [potholes, setPotholes] = useState([]);

  const fetchPotholes = async () => {
    try {
      const response = await apiRequest.get("/model/getPotholeData");
      const data = response.data;
      setPotholes(data);
    } catch (error) {
      console.error("Error fetching potholes:", error);
    }
  };

  useEffect(() => {
    fetchPotholes();
  }, []);

  const handleResolved = (id) => {
    console.log(`Pothole ${id} resolved`);
  };

  return (
    <div className="pothole-display">
      {potholes.length > 0 ? (
        <div className="pothole-grid">
          {potholes.map((pothole) => (
            <PotholeCard
              key={pothole._id}
              imageSrc={pothole.src}
              longitude={pothole.longitude}
              latitude={pothole.latitude}
              onResolved={() => handleResolved(pothole._id)}
            />
          ))}
        </div>
      ) : (
        <p>No potholes found.</p>
      )}
    </div>
  );
};

export default PotholeDisplay;
