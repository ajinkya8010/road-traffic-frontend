import React, { useState } from 'react';
import './lineScoreDate.css';
import LineGraph from '../../components/lineGraph/lineGraph';

const LineScoreDate = () => {
  const [selectedRoad, setSelectedRoad] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('');

  const roads = ['Katraj-Kondhwa', 'Swargate-Katraj', 'Kothrud-Shivajinagar'];
  const timeRanges = [
    '00-02', '02-04', '04-06', '06-08', '08-10', '10-12',
    '12-14', '14-16', '16-18', '18-20', '20-22', '22-00',
  ];

  return (
    <div className="route-history-container">
      <h2>Route History</h2>
      <div className="dropdown-container">
        <div className="dropdown">
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
          <select
            id="time-range-select"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            <option value="">--Select a Time Slot--</option>
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

export default LineScoreDate;
