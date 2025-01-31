import React, { useState } from "react";
import Select from "react-select";
import { Line } from "react-chartjs-2";
import apiRequest from "../../lib/apiRequest";

// Path and Time Ranges
const paths = [
  { value: "Kondhwa-Hinjewadi", label: "Kondhwa-Hinjewadi" },
  { value: "Swargate-Katraj", label: "Swargate-Katraj" },
  { value: "Hinjewadi-Swargate", label: "Hinjewadi-Swargate" },
];
const timeRanges = [
  { value: "00-02", label: "00-02" },
  { value: "02-04", label: "02-04" },
  { value: "04-06", label: "04-06" },
  { value: "06-08", label: "06-08" },
  { value: "08-10", label: "08-10" },
  { value: "10-12", label: "10-12" },
  { value: "12-14", label: "12-14" },
  { value: "14-16", label: "14-16" },
  { value: "16-18", label: "16-18" },
  { value: "18-20", label: "18-20" },
  { value: "20-22", label: "20-22" },
  { value: "22-00", label: "22-00" },
];
const days = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const LineWeekDay = () => {
  const [path, setPath] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [day, setDay] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState("");

  const fetchLineChartData = async () => {
    if (!path || !timeRange || day === null) {
      setMessage("Please select all fields to display the chart.");
      return;
    }

    try {
      setMessage("");
      const response = await apiRequest.get("/path-info/getLastFourWeek", {
        params: {
          path,
          timeRange,
          day,
        },
      });
      console.log(response);
      

      if (!response.data || response.data.length === 0) {
        setMessage("No data is available for the selected options.");
        setChartData(null);
        setAnalysis("");
        return;
      }

      const data = response.data.map((entry) => ({
        date: entry.date,        
        score: entry.score,
      }));
      console.log(data);
      

      // Analyze the trend of scores
    let isIncreasing = true;
    let isDecreasing = true;

    for (let i = 1; i < data.length; i++) {
      if (data[i].score <= data[i - 1].score) {
        isIncreasing = false;
      }
      if (data[i].score >= data[i - 1].score) {
        isDecreasing = false;
      }
    }

    if (isIncreasing) {
      setAnalysis("Traffic seems to be increasing week by week.");
    } else if (isDecreasing) {
      setAnalysis("Traffic seems to be decreasing week by week.");
    } else {
      setAnalysis(""); // Leave empty for zig-zag or mixed trends
    }


      setChartData({
        labels: data.map((item) => item.date),
        datasets: [
          {
            label: `Traffic Scores (${path} - ${timeRange})`,
            data: data.map((item) => item.score),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
          },
        ],
      });
    } catch (err) {
      setMessage("Failed to fetch chart data. Please try again.");
      setChartData(null);
      setAnalysis("");
    }
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>Weekly Traffic Analysis Line Graph</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <div>
          <label>Select Path</label>
          <Select options={paths} onChange={(selected) => setPath(selected.value)} />
        </div>
        <div>
          <label>Select Time Range</label>
          <Select options={timeRanges} onChange={(selected) => setTimeRange(selected.value)} />
        </div>
        <div>
          <label>Select Day</label>
          <Select options={days} onChange={(selected) => setDay(selected.value)} />
        </div>
      </div>

      <button
        onClick={fetchLineChartData}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Display Line Graph
      </button>

      {message && <p style={{ color: "#444", marginTop: "10px" }}>{message}</p>}

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        {chartData ? (
          <div style={{ maxWidth: "800px", maxHeight: "400px" }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
              height={300}
              width={800}
            />
            <p>
                {analysis}
            </p>
          </div>
        ) : (
          <p>
          </p>
        )}
      </div>
    </div>
  );
};

export default LineWeekDay;
