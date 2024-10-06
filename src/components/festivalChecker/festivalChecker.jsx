import React, { useEffect, useState } from 'react';
import fetchFestivals from '../../lib/fetchFestivals';

const FestivalChecker = () => {
  const [festivals, setFestivals] = useState([]);
  const [trafficReason, setTrafficReason] = useState('');

  useEffect(() => {
    const checkForFestivals = async () => {
      const year = new Date().getFullYear();
      const country = 'IN';
      const festivalsData = await fetchFestivals(year, country);
      setFestivals(festivalsData);
    };

    checkForFestivals();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    console.log("Hi");
    console.log(festivals);
    const festivalToday = festivals.find(festival => festival.date.iso === today);
    
    if (festivalToday) {
      setTrafficReason(`Festival traffic due to ${festivalToday.name}`);
    }
  }, [festivals]);

  return (
    <div>
      <h2>Traffic Reason:</h2>
      {trafficReason ? <p>{trafficReason}</p> : <p>No major events today.</p>}
    </div>
  );
};

export default FestivalChecker;
