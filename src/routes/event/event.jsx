import React, { useState } from "react";
import { MapContainer, TileLayer, FeatureGroup} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "./event.css";
import apiRequest from "../../lib/apiRequest";

const Event = () => {
  const [formData, setFormData] = useState({
    category: "",
    startTime: "",
    endTime: "",
    crowd: "",
    vehicleCount: "",
    eventPoints: [], 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest.post("/event/", formData);
      alert(response.data.message || "Event created successfully!");
    } catch (error) {
      alert("Error creating event: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDrawCreated = (e) => {
    const layer = e.layer;

    if (layer) {
      const latLngs = layer.getLatLngs().map((latlng) => ({
        lat: latlng.lat,
        lng: latlng.lng,
      }));

      setFormData((prevData) => ({
        ...prevData,
        eventPoints: latLngs,
      }));
    }
  };

  return (
    <div className="event-container">
      {/* Map Section */}
      <div className="event-map-container">
        <MapContainer center={[18.5204, 73.8567]} zoom={13} className="event-map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleDrawCreated}
              draw={{
                rectangle: false,
                circle: false,
                marker: false,
                polygon: false,
                polyline: true,
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {/* Form Section */}
      <div className="event-form-container">
        <h1>Create Event</h1>
        <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
            <label>Category:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select event category
              </option>
              <option value="Rally">Rally</option>
              <option value="Procession">Procession</option>
              <option value="Function">Function</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start Time:</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>End Time:</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Crowd Size:</label>
            <input
              type="number"
              name="crowd"
              value={formData.crowd}
              onChange={handleChange}
              required
              placeholder="Enter estimated crowd size"
            />
          </div>
          <div className="form-group">
            <label>Vehicle Count:</label>
            <input
              type="number"
              name="vehicleCount"
              value={formData.vehicleCount}
              onChange={handleChange}
              required
              placeholder="Enter estimated vehicle count"
            />
          </div>
          <div className="form-group">
            <label>Event Points:</label>
            <textarea
              name="eventPoints"
              value={JSON.stringify(formData.eventPoints, null, 2)}
              readOnly
              rows="5"
            ></textarea>
          </div>
          <button type="submit" className="submit-btn">
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
};

export default Event;
