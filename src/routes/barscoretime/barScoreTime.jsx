import React, { useState } from 'react';
import './barScoreTime.css';
import BarGraph from '../../components/bargraph/barGraph';

const BarScoreTime = () => {
  const [selectedRoad, setSelectedRoad] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const roads = ['Katraj-Kondhwa', 'Swargate-Katraj', 'Kothrud-Shivajinagar'];

  // Generate last 8 days as options
  const last8Days = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i-1);
    return date.toISOString().split('T')[0]; 
  });

  return (
    <div className="Peak-traffic-container">
      <h2>Peak traffic hours analysis</h2>
      <div className="dropdown-container">
        {/* Road Dropdown */}
        <div className="dropdown">
          <label htmlFor="road-select">Select Road</label>
          <select
            id="road-select"
            value={selectedRoad}
            onChange={(e) => setSelectedRoad(e.target.value)}
          >
            <option value="">--Select a Road--</option>
            {roads.map((road) => (
              <option key={road} value={road}>
                {road}
              </option>
            ))}
          </select>
        </div>

        {/* Date Dropdown */}
        <div className="dropdown">
          <label htmlFor="date-select">Select Date</label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">--Select a Date--</option>
            {last8Days.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bar-graph-container">
        {selectedRoad && selectedDate ? (
          <BarGraph pathId={selectedRoad} selectedDate={selectedDate} />
        ) : (
          <p>Please select both a road and a date to view the bar graph.</p>
        )}
      </div>
    </div>
  );
};

export default BarScoreTime;
