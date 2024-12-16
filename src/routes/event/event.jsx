import React, { useState, useEffect } from "react";
import "./Event.css";
import apiRequest from "../../lib/apiRequest";

const Event = () => {
  const [category, setCategory] = useState("");
  const [dataType, setDataType] = useState("Point"); 
  const [location, setLocation] = useState({ lat: "", lng: "" }); 
  const [lineData, setLineData] = useState([{ lat: "", lng: "" }]); 
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [crowd, setCrowd] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation && dataType === "Point") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [dataType]);

  const handleInputChange = () => {
    setMessage("");
  };

  const handleLineDataChange = (index, field, value) => {
    const updatedLineData = [...lineData];
    updatedLineData[index][field] = value;
    setLineData(updatedLineData);
    handleInputChange();
  };

  const addLinePoint = () => {
    setLineData([...lineData, { lat: "", lng: "" }]);
  };

  const removeLinePoint = (index) => {
    const updatedLineData = lineData.filter((_, i) => i !== index);
    setLineData(updatedLineData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    try {
      const payload = {
        category,
        startTime,
        endTime,
        crowd,
        vehicleCount,
        location: {
          type: dataType,
          coordinates: dataType === "Point" 
            ? [Number(location.lng), Number(location.lat)]
            : lineData.map(point => [Number(point.lng), Number(point.lat)]).filter(point => 
                !isNaN(point[0]) && !isNaN(point[1]) && 
                point[0] !== "" && point[1] !== ""
            )
        }
      };
  
      // Add validation before sending
      if (dataType === "LineString" && payload.location.coordinates.length < 2) {
        throw new Error("LineString must have at least two valid points");
      }
  
      await apiRequest.post("/event/", payload);
      setMessage("Event registered successfully!");
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="event-container">
      <h2 className="event-title">Register an Event</h2>

      <form className="event-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="event-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleInputChange();
            }}
            required
          >
            <option value="">Select Category</option>
            <option value="Procession">Procession</option>
            <option value="Rally">Rally</option>
            <option value="Function">Function</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Data Type</label>
          <select
            id="dataType"
            className="event-select"
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
          >
            <option value="Point">Point (Single Location)</option>
            <option value="LineString">Line (Multiple Points)</option>
          </select>
        </div>

        {dataType === "Point" ? (
          <div className="form-group">
            <label>Location (auto-detected or manually enter)</label>
            <input
              type="text"
              className="event-input"
              placeholder="Enter Latitude"
              value={location.lat}
              onChange={(e) => {
                setLocation({ ...location, lat: e.target.value });
                handleInputChange();
              }}
              required
            />
            <input
              type="text"
              className="event-input"
              placeholder="Enter Longitude"
              value={location.lng}
              onChange={(e) => {
                setLocation({ ...location, lng: e.target.value });
                handleInputChange();
              }}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Line Data (Enter multiple points)</label>
            {lineData.map((point, index) => (
              <div key={index} className="line-point">
                <input
                  type="text"
                  className="event-input"
                  placeholder={`Point ${index + 1} Latitude`}
                  value={point.lat}
                  onChange={(e) => handleLineDataChange(index, "lat", e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="event-input"
                  placeholder={`Point ${index + 1} Longitude`}
                  value={point.lng}
                  onChange={(e) => handleLineDataChange(index, "lng", e.target.value)}
                  required
                />
                {index > 0 && (
                  <button type="button" onClick={() => removeLinePoint(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addLinePoint}>
              Add Point
            </button>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            type="datetime-local"
            id="startTime"
            className="event-input"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              handleInputChange();
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time</label>
          <input
            type="datetime-local"
            id="endTime"
            className="event-input"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              handleInputChange();
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="crowd">Crowd</label>
          <input
            type="number"
            id="crowd"
            className="event-input"
            value={crowd}
            onChange={(e) => {
              setCrowd(e.target.value);
              handleInputChange();
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="vehicleCount">Vehicle Count</label>
          <input
            type="number"
            id="vehicleCount"
            className="event-input"
            value={vehicleCount}
            onChange={(e) => {
              setVehicleCount(e.target.value);
              handleInputChange();
            }}
            required
          />
        </div>

        <button type="submit" className="event-submit" disabled={isLoading}>
          Submit Event
        </button>
        {error && <span>{error}</span>}
        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
};

export default Event;
