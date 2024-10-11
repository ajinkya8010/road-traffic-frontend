
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import axios from 'axios'; // For API requests
import 'leaflet-extra-markers/dist/css/leaflet.extra-markers.min.css';
import 'leaflet-extra-markers/dist/js/leaflet.extra-markers.js';
import 'leaflet-extra-markers';
import apiRequest from "../../lib/apiRequest";
// import "./MapRouting.css"

const RoutingMachine = ({ source, destination, onRouteComplete }) => {
  const map = useMap();

  useEffect(() => {
    if (source && destination) {
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(source), L.latLng(destination)],
        routeWhileDragging: true,
        lineOptions: {
          styles: [{ color: '#6FA1EC', weight: 4 }],
        },
        createMarker: () => null, // Disable marker creation
      }).addTo(map);

      routingControl.on('routesfound', (e) => {
        const route = e.routes[0];
        const waypoints = route.coordinates.map(coord => L.latLng(coord.lat, coord.lng));
        onRouteComplete(waypoints);
      });

      return () => map.removeControl(routingControl);
    }
  }, [source, destination, map, onRouteComplete]);

  return null;
};


const MapRouting = () => {
  const [source] = useState([18.496140, 73.858200]);
  const [destination] = useState([18.463357, 73.867262]);
  const [complaints, setComplaints] = useState([]);
  const [potholes, setPotholes] = useState([]);
  const [showComplaints, setShowComplaints] = useState(false);
  const [showPotholes, setShowPotholes] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  
  

  const fetchComplaints = async () => {
    try {
      const response = await apiRequest.get("/complaint/getComplaintData");
      const data = response.data;

      const filteredComplaints = data.filter(complaint => {
        const complaintLatLng = L.latLng(parseFloat(complaint.latitude), parseFloat(complaint.longitude));
        return routePoints.some(routePoint => 
          complaintLatLng.distanceTo(routePoint) <= 100
        );
      });

      setComplaints(filteredComplaints);
      setShowComplaints(true);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const fetchPotholes = async () => {
    try {
      
      const response = await apiRequest.get("/model/getPotholeData");

      const data = response.data;

      const filteredPotholes = data.filter(pothole => {
        const potholeLatLng = L.latLng(parseFloat(pothole.latitude), parseFloat(pothole.longitude));
        return routePoints.some(routePoint => 
          potholeLatLng.distanceTo(routePoint) <= 100
        );
      });

      setPotholes(filteredPotholes);
      setShowPotholes(true);
    } catch (error) {
      console.error("Error fetching potholes:", error);
    }
  };

  const handleCheckComplaints = () => {
    fetchComplaints();
  };

  const handleCheckPotholes = () => {
    fetchPotholes();
  };

  return (
    <div>
      <MapContainer
        center={[18.500030, 73.858416]}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={source} />
        <Marker position={destination} />
        <RoutingMachine 
          source={source} 
          destination={destination} 
          onRouteComplete={setRoutePoints} 
        />

        {/* Display complaint markers */}
        {showComplaints && complaints.map((complaint, index) => (
          <Marker
            key={index}
            position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}
            icon={L.ExtraMarkers.icon({
              icon: 'fa-circle', // use font-awesome circle
              markerColor: 'pink', // color of the marker
              prefix: 'fa'
             
            })}
            
            
          > <Popup>
              <div>
                <img src={complaint.src} alt="complaint" style={{ width: '100%', height: 'auto' }} />
                <p>{complaint.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Display pothole markers with images */}
        {showPotholes && potholes.map((pothole, index) => (
          <Marker
            key={index}
            position={[parseFloat(pothole.latitude), parseFloat(pothole.longitude)]}
            icon={L.ExtraMarkers.icon({
              icon: 'fa-circle', // use font-awesome circle
              markerColor: 'yellow', // color of the marker
              prefix: 'fa'
             
            })}
            
          > 
            
            <Popup>
              <div>
                <img src={pothole.src} alt="Pothole" style={{ width: '100%', height: 'auto' }} />
                <p>Pothole</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="buttonGroup" style={{ marginTop: '10px' }}>
        <button className="btn" onClick={handleCheckComplaints}>Check for Complaints</button>
        <button className="btn" onClick={handleCheckPotholes}>Check for Potholes</button>
      </div>
    </div>
  );
};

export default MapRouting;
