import React, { useState, useEffect } from 'react';
import './lineScoreDate.css';
import LineGraph from '../../components/lineGraph/lineGraph';
import fetchFestivals from '../../lib/fetchFestivals';

const LineScoreDate = () => {
  const [selectedRoad, setSelectedRoad] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('');
  const [selectedFestival, setSelectedFestival] = useState('');
  const [festivalDates, setFestivalDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const lastFourYears = Array.from({ length: 4 }, (_, i) => currentYear - (i + 1));

  const roads = ['Kondhwa-Hinjewadi', 'Swargate-Katraj', 'Hinjewadi-Swargate'];
  const timeRanges = [
    '00-02', '02-04', '04-06', '06-08', '08-10', '10-12',
    '12-14', '14-16', '16-18', '18-20', '20-22', '22-00',
  ];

  const festivals = [
    "New Year's Day", "Diwali/Deepavali", "Ganesh Chaturthi/Vinayaka Chaturthi", "New Year's Eve, Christmas", 
    "Shivaji Jayanti", "Janmashtami", "Republic Day", "Independence Day"
  ];

  const fetchFestivalDates = async (festival) => {
    setLoading(true);
    const countryCode = 'IN';
    let dates = [];

    for (const year of lastFourYears) {
      const data = await fetchFestivals(year, countryCode);      
      const festivalData = data.filter((f) => f.name === festival);
      dates = [...dates, ...festivalData.map((f) => f.date)];
    }

    console.log(dates);
    

    setFestivalDates(dates);
    setLoading(false);
  };

  const handleFestivalChange = (e) => {
    const selected = e.target.value;
    setSelectedFestival(selected);

    if (selected) {
      fetchFestivalDates(selected);
    } else {
      setFestivalDates([]);
    }
  };

  return (
    <div className="route-history-container">
      <h2>Festival Traffic Analysis</h2>
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
        <div className="dropdown">
          <select
            id="festival-select"
            value={selectedFestival}
            onChange={handleFestivalChange}
          >
            <option value="">--Select a Festival--</option>
            {festivals.map((festival) => (
              <option key={festival} value={festival}>
                {festival}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <p>Loading festival dates...</p>
      ) : (
        <div className="line-graph-container">
          {selectedRoad && selectedTimeRange && festivalDates.length > 0 ? (
            <LineGraph
              pathId={selectedRoad}
              timeRange={selectedTimeRange}
              festivalDates={festivalDates}
            />
          ) : (
            <p>Please select a road, time range, and festival to view the graph.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LineScoreDate;
