import React, { useState } from 'react';
import './lineScoreDateAll.css';
import TripleLineGraph from '../../components/tripleLineGraph/tripleLineGraph';

const LineScoreDateAll = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('');

  const timeRanges = [
    '00-02', '02-04', '04-06', '06-08', '08-10', '10-12',
    '12-14', '14-16', '16-18', '18-20', '20-22', '22-00',
  ];

  return (
    <div className="route-history-container">
      <h2>Route History</h2>
      <div className="dropdown-container">
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
        {selectedTimeRange ? (
          <TripleLineGraph timeRange={selectedTimeRange} />
        ) : (
          <p>Please select a time range to view the graph.</p>
        )}
      </div>
    </div>
  );
};

export default LineScoreDateAll;
