import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import fetchFestivals from '../../lib/fetchFestivals';


const CustomCalendar = ({ data }) => {
  const [hoveredDate, setHoveredDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [festivals, setFestivals] = useState([]);

  // Fetch festival data when the component mounts or the month changes
  useEffect(() => {
    const fetchData = async () => {
      const year = currentMonth.getFullYear();
      const country = 'IN'; // Replace with the desired country code
      const festivalData = await fetchFestivals(year, country);
      setFestivals(festivalData);
    };
    console.log("Hi");
    
    fetchData();
  }, [currentMonth]);

  // Function to determine the class name for each tile
  const getTileClassName = ({ date }) => {
    const dayData = data.find(
      (entry) =>
        new Date(entry.date).toLocaleDateString('en-CA') ===
        date.toLocaleDateString('en-CA')
    );

    let baseClass = 'tile';
    if (date.getDay() === 0 || date.getDay() === 6) {
      baseClass += ' weekend'; // Add weekend class
    } else {
      baseClass += ' weekday';
    }

    if (!dayData) {
      return `${baseClass} no-data`;
    }

    const { score } = dayData;
    if (score < 20) baseClass += ' faint-green';
    else if (score < 40) baseClass += ' medium-green';
    else baseClass += ' dark-green';

    // Check if the date has a festival
    const hasFestival = festivals.some(
      (festival) =>
        new Date(festival.date.iso).toLocaleDateString('en-CA') ===
        date.toLocaleDateString('en-CA')
    );

    if (hasFestival) {
      baseClass += ' festival'; // Add festival class
    }

    return baseClass;
  };

  // Function to handle month change
  const handleMonthChange = ({ activeStartDate }) => {
    setCurrentMonth(activeStartDate);
  };

  // Function to get hovered day score and category
  const getHoveredDayInfo = (date) => {
    const dayData = data.find(
      (entry) => new Date(entry.date).toDateString() === date.toDateString()
    );
    if (!dayData) return 'No data';

    const { score } = dayData;
    let category = '';
    if (score < 20) category = 'Low';
    else if (score < 40) category = 'Medium';
    else category = 'High';

    return `${category} (${score})`;
  };

  // Tile content with hover tooltip
  const tileContent = ({ date }) => (
    <div
      className="tile-content"
      onMouseOver={() => setHoveredDate(date)}
      onMouseOut={() => setHoveredDate(null)}
    >
      {hoveredDate?.toDateString() === date.toDateString() && (
        <div className="tooltip">
          {getHoveredDayInfo(date)}
        </div>
      )}
    </div>
  );

  return (
    <div className="custom-calendar">
      <h2>MONTHLY TRAFFIC VISUALIZATION CALENDAR</h2>
      <div className="container-calender">
        <div className="legendd">
            <h3>Legend</h3>
            <div className="legend-item">
              <div className="legend-box low-traffic"></div> Low Traffic
            </div>
            <div className="legend-item">
              <div className="legend-box medium-traffic"></div> Medium Traffic
            </div>
            <div className="legend-item">
              <div className="legend-box high-traffic"></div> High Traffic
            </div>
            <div className="legend-item">
              <div className="legend-box festival-border"></div> Festival
            </div>
        </div>
        <Calendar
          className="calendar"
          onActiveStartDateChange={handleMonthChange}
          tileClassName={getTileClassName}
          tileContent={tileContent}
          maxDate={new Date()}
          onClickDay={() => {}} // Disable click behavior
        />
      </div>
      
    </div>
  );
};

export default CustomCalendar;