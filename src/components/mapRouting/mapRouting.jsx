import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-extra-markers/dist/css/leaflet.extra-markers.min.css';
import 'leaflet-extra-markers/dist/js/leaflet.extra-markers.js';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import apiRequest from "../../lib/apiRequest";
import 'leaflet-extra-markers';
import './mapRouting.css';

// Routing component to display route on map
const RoutingMachine = ({ source, destination, onRouteComplete }) => {
  // const [showDirections, setShowDirections] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (source && destination) {
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(source.lat, source.lng), L.latLng(destination.lat, destination.lng)],
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
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [potholes, setPotholes] = useState([]);
  const [showComplaints, setShowComplaints] = useState(false);
  const [showPotholes, setShowPotholes] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  

  const provider = new OpenStreetMapProvider();

  const handleAddressSearch = async (address, setCoords) => {
    const results = await provider.search({ query: address });
    if (results.length > 0) {
      const { x: lng, y: lat } = results[0];
      setCoords({ lat, lng });
    }
  };

  const handleGetRoute = () => {
    if (!sourceCoords && !destinationCoords) {
      console.log()
      alert("Source and destination required");
    } else {
      setLoading(true);
      setPotholes([])
      setComplaints([])
     
      setTimeout(() => {
        setLoading(false);
      }, 2000); // Simulate a delay for fetching the route
    }
  };

  
  const handleClearRoute = () => {
      setPotholes([]);
      setComplaints([]);
  };

  const fetchComplaints = async () => {
    try {
      const response = await apiRequest.get("/complaint/getComplaintData");
      const data = response.data;
      const filteredComplaints = data.filter(complaint => {
        const complaintLatLng = L.latLng(parseFloat(complaint.latitude), parseFloat(complaint.longitude));
        return routePoints.some(routePoint => complaintLatLng.distanceTo(routePoint) <= 100);
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
        return routePoints.some(routePoint => potholeLatLng.distanceTo(routePoint) <= 100);
      });
      setPotholes(filteredPotholes);
      setShowPotholes(true);
    } catch (error) {
      console.error("Error fetching potholes:", error);
    }
  };


  return (
    <div>
      {/* Address Input Fields */}
      <div className="address-inputs" style={{ marginBottom: '10px' }}>
        <div>
          <label>Source </label>
          <input
            className="styled-input"
            type="text"
            value={sourceAddress}
            onChange={(e) => setSourceAddress(e.target.value)}
            onBlur={() => handleAddressSearch(sourceAddress, setSourceCoords)}
            placeholder="Enter source address"
          />
        </div>
        <div>
          <label>Destination </label>
          <input
            className="styled-input"
            type="text"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            onBlur={() => handleAddressSearch(destinationAddress, setDestinationCoords)}
            placeholder="Enter destination address"
          />
        </div>
      </div>

      <button className="btn top1" onClick={handleGetRoute}>Get Route</button>
      <button className="btn" onClick={handleClearRoute}>Clear Route</button>

      {loading && <div className="loading">Fetching route...</div>}

      <MapContainer
        center={[18.500030, 73.858416]}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Display Markers for Source and Destination */}
        {sourceCoords && <Marker position={[sourceCoords.lat, sourceCoords.lng]}> <Popup> <p>{sourceAddress}</p> </Popup> </Marker>}
        {destinationCoords && <Marker position={[destinationCoords.lat, destinationCoords.lng]}> <Popup>{destinationAddress}</Popup> </Marker>}
        
        {/* Routing between Source and Destination */}
        {sourceCoords && destinationCoords && (
          <RoutingMachine 
            source={sourceCoords} 
            destination={destinationCoords} 
            onRouteComplete={setRoutePoints} 
          />
        )}

        {/* Display complaint markers */}
        {showComplaints && complaints.map((complaint, index) => (
          <Marker
            key={index}
            position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}
            icon={L.ExtraMarkers.icon({
              icon: 'fa-circle',
              markerColor: 'pink',
              prefix: 'fa'
            })}
          >
            <Popup>
              <div>
                <img src={complaint.src} alt="complaint" style={{ width: '100%', height: 'auto' }} />
                <p>{complaint.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Display pothole markers */}
        {showPotholes && potholes.map((pothole, index) => (
          <Marker
            key={index}
            position={[parseFloat(pothole.latitude), parseFloat(pothole.longitude)]}
            icon={L.ExtraMarkers.icon({
              icon: 'fa-circle',
              markerColor: 'yellow',
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
        <button className="btn" onClick={fetchComplaints}>Check for Complaints</button>
        <button className="btn" onClick={fetchPotholes}>Check for Potholes</button>
      </div>
    </div>
  );
};

export default MapRouting;


