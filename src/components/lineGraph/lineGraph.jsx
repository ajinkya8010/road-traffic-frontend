import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import apiRequest from "../../lib/apiRequest";

// Register the necessary components for Chart.js
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

const LineGraph = ({ pathId, timeRange }) => {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/path-info/getPastPathData', {
          params: { pathId, timeRange },
        });
        setGraphData(response.data.data);
        console.log(response.data.data);
        console.log(response.data.message);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pathId && timeRange) fetchData();
  }, [pathId, timeRange]);

  const data = {
    labels: graphData.map((entry) => entry.date),
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
        text: 'Date', // Label for the X-axis
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
      <h3>Line Graph: Score v/s Date</h3>
      {graphData.length > 0 ? (
        <div style={{ height: '400px', width: '100%' }}>
          <Line
            key={`${pathId}-${timeRange}`} // Ensure a unique key for the chart instance
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
