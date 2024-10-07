import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

const RoutingMachine = ({ source, destination }) => {
  const map = useMap();

  useEffect(() => {
    if (source && destination) {
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(source), L.latLng(destination)],
        routeWhileDragging: true,
        lineOptions: {
          styles: [{ color: '#6FA1EC', weight: 4 }],
        },
      }).addTo(map);

      // Cleanup function to remove the routing layer when component unmounts or updates
      return () => map.removeControl(routingControl);
    }
  }, [source, destination, map]);

  return null;
};

const MapRouting = () => {
  const [source] = useState([18.516726, 73.856255]);
  const [destination] = useState([18.501059, 73.862686]);

  return (
    <MapContainer
      center={[18.516726, 73.856255]}
      zoom={13}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={source} />
      <Marker position={destination} />
      <RoutingMachine source={source} destination={destination} />
    </MapContainer>
  );
};

export default MapRouting;