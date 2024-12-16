import React, { useState } from 'react';
import './routeHistory.css';
import LineGraph from '../../components/lineGraph/lineGraph';

const RouteHistory = () => {
  const [selectedRoad, setSelectedRoad] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('');

  const roads = ['Katraj-Kondhwa', 'Swargate-Katraj', 'Kothrud-Shivajinagar'];
  const timeRanges = [
    '0-2', '2-4', '4-6', '6-8', '8-10', '10-12',
    '12-14', '14-16', '16-18', '18-20', '20-22', '22-24',
  ];

  return (
    <div className="route-history-container">
      <h2>Route History</h2>
      <div className="dropdown-container">
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
        <div className="dropdown">
          <label htmlFor="time-range-select">Select Time Range</label>
          <select
            id="time-range-select"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            <option value="">--Select a Time Range--</option>
            {timeRanges.map((timeRange) => (
              <option key={timeRange} value={timeRange}>
                {timeRange}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="line-graph-container">
        {selectedRoad && selectedTimeRange ? (
          <LineGraph pathId={selectedRoad} timeRange={selectedTimeRange} />
        ) : (
          <p>Please select a road and time range to view the graph.</p>
        )}
      </div>
    </div>
  );
};

export default RouteHistory;
