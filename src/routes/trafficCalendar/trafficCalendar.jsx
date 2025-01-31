import React, { useState } from 'react';
import Select from 'react-select';
import CustomCalendar from '../../components/calendar/calendar';
import apiRequest from '../../lib/apiRequest';

const CalendarApp = () => {
  const [path, setPath] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [calendarData, setCalendarData] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false); 

  const paths = [
    { value: 'Kondhwa-Hinjewadi', label: 'Kondhwa-Hinjewadi' },
    { value: 'Swargate-Katraj', label: 'Swargate-Katraj' },
    { value: 'Hinjewadi-Swargate', label: 'Hindjewadi-Swargate' },
  ];

  const timeSlots = [
    '00-02', '02-04', '04-06', '06-08', '08-10', '10-12',
    '12-14', '14-16', '16-18', '18-20', '20-22', '22-24',
  ].map((slot) => ({ value: slot, label: slot }));

  const fetchData = async () => {
    try {
      const response = await apiRequest.get('/path-info/getCalendarData', {
        params: { pathId: path, timeRange: timeSlot },
      });
      setCalendarData(response.data);
      console.log("the data received from backend is -", response.data);
      setShowCalendar(true); // Show the calendar after fetching data
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  return (
    <div>
        <h1>Traffic -Visualization</h1>
        <div className="inputs">
            <div className="select-container">
                <label htmlFor="path" className="select-label">Select Path</label>
                <Select
                    id="path"
                    options={paths}
                    onChange={(selected) => setPath(selected.value)}
                    placeholder="Select Path"
                />
            </div>
            <div className="select-container">
                <label htmlFor="time-slot" className="select-label">Select Time Slot</label>
                <Select
                    id="time-slot"
                    options={timeSlots}
                    onChange={(selected) => setTimeSlot(selected.value)}
                    placeholder="Select Time Slot"
                />
            </div>
            <button onClick={fetchData}>Display Calendar</button>
        </div>
        {/* Conditionally render the calendar */}
        {showCalendar && <CustomCalendar data={calendarData} />}
    </div>
  );
};

export default CalendarApp;
