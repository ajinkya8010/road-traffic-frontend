import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(Tooltip, Legend, ArcElement);

const PieChart= ({ data }) => {
  const chartData = {
    labels: ['Pending', 'Closed', 'Rejected'],
    datasets: [
      {
        data: [
          data.reduce((sum, item) => sum + item.Pending, 0),
          data.reduce((sum, item) => sum + item.Closed, 0),
          data.reduce((sum, item) => sum + item.Rejected, 0),
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF4384', '#2692EB', '#FFAE56'],
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
  };

  return (
    <div style={{ width: '50%', margin: '0 auto' }}>
      <h3>Complaint Status Overview</h3>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
