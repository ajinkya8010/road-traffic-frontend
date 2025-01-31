import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import apiRequest from "../../lib/apiRequest";

import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineGraph = ({ pathId, timeRange, festivalDates }) => {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Transform festivalDates into an array of ISO date strings
        const dateList = festivalDates.map((festival) => festival.iso);
        console.log(dateList);
        

        // Send the transformed dates in the request params
        const response = await apiRequest.get('/path-info/getFestivalData', {
          params: { 
            pathId, 
            timeRange, 
            dates: JSON.stringify(dateList), // Pass as JSON string
          },
        });
        const sortedData = response.data.sort((a, b) => a.year - b.year);
        
        setGraphData(sortedData);
        console.log(sortedData);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pathId && timeRange && festivalDates?.length) fetchData();
  }, [pathId, timeRange, festivalDates]);

  const data = {
    labels: graphData.map((entry) => entry.year),
    datasets: [
      {
        label: 'Score',
        data: graphData.map((entry) => entry.score),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
        text: 'Graph Title (Optional)', // Add a title for the chart
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year', // Label for the X-axis
        },
      },
      y: {
        title: {
          display: true,
          text: 'Score', // Label for the Y-axis
        },
      },
    },
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h3>Line Graph: Score v/s Year</h3>
      {graphData.length > 0 ? (
        <div style={{ height: '400px', width: '100%' }}>
          <Line
            key={`${pathId}-${timeRange}`} 
            data={data}
            options={options}
          />
        </div>
      ) : (
        <p>No data available for the selected path and time range.</p>
      )}
    </div>
  );
};

export default LineGraph;
