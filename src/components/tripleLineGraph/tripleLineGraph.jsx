import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import apiRequest from '../../lib/apiRequest';
import './tripleLineGraph.css';

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

const TripleLineGraph = ({ timeRange }) => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/path-info/getPastPathDataAll', {
          params: { timeRange },
        });
        setGraphData(response.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (timeRange) fetchGraphData();
  }, [timeRange]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!graphData) {
    return <p>No data available for the selected time range.</p>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
        text: 'Triple Line Graph for Last 8 Days',
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

  return (
    <div className="triple-line-graph-container">
      <h3>Triple Line Graph: Score v/s Date</h3>
      <div style={{ height: '400px', width: '100%' }}>
        <Line data={graphData} options={options} />
      </div>
    </div>
  );
};

export default TripleLineGraph;
