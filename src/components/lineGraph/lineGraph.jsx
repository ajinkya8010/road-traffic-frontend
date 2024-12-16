import apiRequest from "../../lib/apiRequest";
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';


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

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h3>Line Graph for Last 8 Days</h3>
      {graphData.length > 0 ? (
        <Line
          key={`${pathId}-${timeRange}`} // Add a unique key based on props
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      ) : (
        <p>No data available for the selected path and time range.</p>
      )}
    </div>
  );
};

export default LineGraph;
