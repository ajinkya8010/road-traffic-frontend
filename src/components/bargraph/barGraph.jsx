import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import apiRequest from '../../lib/apiRequest';

import {
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarGraph = ({ pathId, selectedDate }) => {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/path-info/getBarGraphData', {
          params: { pathId, date: selectedDate },
        });
        console.log(response.data.data);
        
        setGraphData(response.data.data);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pathId && selectedDate) fetchData();
  }, [pathId, selectedDate]);

  const data = {
    labels: graphData.map((entry) => entry.timeRange),
    datasets: [
      {
        label: 'Score',
        data: graphData.map((entry) => entry.score),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Slot (24Hr Format)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Score',
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {graphData.length > 0 ? (
        <div style={{ height: '400px', width: '100%' }}>
          <Bar data={data} options={options} />
        </div>
      ) : (
        <p>No data available for the selected path and date.</p>
      )}
    </div>
  );
};

export default BarGraph;
