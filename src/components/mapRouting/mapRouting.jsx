import React, { useState, useEffect, useRef} from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-extra-markers/dist/css/leaflet.extra-markers.min.css';
import 'leaflet-extra-markers/dist/js/leaflet.extra-markers.js';
import apiRequest from "../../lib/apiRequest";
import 'leaflet-extra-markers';
import './mapRouting.css';




const RoutingMachine = ({ source, destination, onRouteComplete }) => {
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
  const [events, setEvents] = useState([]);
  const [showEvents, setShowEvents] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);
  const [showPotholes, setShowPotholes] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [complaintCount, setComplaintCount] = useState(0);
  const [potholeCount, setPotholeCount] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isClicked, setIsClicked] = useState(false);



  const sourceInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const sourceAutocomplete = useRef(null);
  const destinationAutocomplete = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.body.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const initializeAutocomplete = () => {
    // Initialize Google Maps Autocomplete for source input
    sourceAutocomplete.current = new window.google.maps.places.Autocomplete(
      sourceInputRef.current,
      { types: ['geocode'] }
    );

    // Initialize Google Maps Autocomplete for destination input
    destinationAutocomplete.current = new window.google.maps.places.Autocomplete(
      destinationInputRef.current,
      { types: ['geocode'] }
    );

    // Add place_changed event listeners
    sourceAutocomplete.current.addListener('place_changed', () => {
      const place = sourceAutocomplete.current.getPlace();
      if (place.geometry) {
        setSourceAddress(place.formatted_address);
        setSourceCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    });

    destinationAutocomplete.current.addListener('place_changed', () => {
      const place = destinationAutocomplete.current.getPlace();
      if (place.geometry) {
        setDestinationAddress(place.formatted_address);
        setDestinationCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    });
  };




  const handleGetRoute = async () => {
    setLoading(true);
    if (!sourceCoords || !destinationCoords) {
      alert("Please select valid source and destination addresses from the suggestions");
      setLoading(false);
      return;
    }
    setPotholes([]);
    setComplaints([]);
    setNearbyPlaces([]);
    setIsClicked(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  
  const handleClearRoute = () => {
      setPotholes([]);
      setComplaints([]);
      setNearbyPlaces([]);
  };

  const fetchComplaints = async () => {
    try {
      const response = await apiRequest.get("/complaint/getComplaintData");
      const data = response.data;
      const filteredComplaints = data.filter(complaint => {
        const complaintLatLng = L.latLng(parseFloat(complaint.latitude), parseFloat(complaint.longitude));
        return routePoints.some(routePoint => complaintLatLng.distanceTo(routePoint) <= 100);
      });
      setComplaintCount(filteredComplaints.length);
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
        return routePoints.some(routePoint => potholeLatLng.distanceTo(routePoint) <= 50);
      });
      setPotholeCount(filteredPotholes.length);
      setPotholes(filteredPotholes);
      setShowPotholes(true);
    } catch (error) {
      console.error("Error fetching potholes:", error);
    }
  };


const fetchNearbyPlace = async () => {
  if (!sourceCoords) return alert("Please set source coordinates.");

  try {
      console.log("You are about to make a backend call from the frontend!");

      let allPlaces = [];
      let nextPageToken = null;

      do {
          const response = await apiRequest.post("/nearby/", {
              params: {
                  routePoints: routePoints,
                  keyword: 'institute school technology university college',
                  pagetoken: nextPageToken, // Use next_page_token if it exists
              }
          });

          if (response.data.results) {
              allPlaces = [...allPlaces, ...response.data.results];
              nextPageToken = response.data.next_page_token;
          } else {
              nextPageToken = null; // If no more results, break out of loop
          }

          // Wait for 2 seconds if nextPageToken is available
          if (nextPageToken) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
          }
      } while (nextPageToken);

      const places = allPlaces.map(place => ({
          name: place.name,
          location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
      }));

      console.log("All nearby places within constraints:", places);
      setNearbyPlaces(places);
  } catch (error) {
      console.error("Error fetching nearby places:", error);
  }
};


  const fetchEvents = async() =>{
    try {
      const response = await apiRequest.get("/event/getEventData"); 
      const data = response.data;
  

      const now = new Date();
        const filteredEvents = data.filter(event => {
        const eventStartDate = new Date(event.startTime);
        const eventEndDate = new Date(event.endTime);
        const eventLatLng = L.latLng(parseFloat(event.latitude), parseFloat(event.longitude));
        const isOnRoute =  routePoints.some(routePoint => eventLatLng.distanceTo(routePoint) <= 50);

        return (
          eventStartDate <= now &&
          eventEndDate >= now &&
          eventStartDate.toDateString() === now.toDateString() &&
          isOnRoute
        );
      });
  
      setEvents(filteredEvents);
      setShowEvents(true);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }



  return (
    <div>
      {/* Address Input Fields */}

      <div className="address-inputs">
        <div>
          <label>Source </label>
          <input
            ref={sourceInputRef}
            className="styled-input"
            type="text"
            value={sourceAddress}
            onChange={(e) => {setSourceAddress(e.target.value); setIsClicked(false); setPotholes([]);setComplaints([]); setNearbyPlaces([]);}}
            placeholder="Enter source address"
          />
        </div>
        <div>
          <label>Destination </label>
          <input
            ref={destinationInputRef}
            className="styled-input"
            type="text"
            value={destinationAddress}
            onChange={(e) => {setDestinationAddress(e.target.value); setIsClicked(false); setPotholes([]); setComplaints([]); setNearbyPlaces([]);}}
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
        {sourceCoords && destinationCoords && isClicked && (
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

        {showEvents && events.map((event, index) => (
          <Marker
            key={index}
            position={[parseFloat(event.latitude), parseFloat(event.longitude)]}
            icon={L.ExtraMarkers.icon({
              icon: 'fa-circle',
              markerColor: 'orange',
              prefix: 'fa'
            })}
          >
            <Popup>
              <div>
                <p>{event.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {nearbyPlaces.map((place, index) => (
          <Marker key={index} position={[place.location.lat, place.location.lng]}>
            <Popup>{place.name}</Popup>
          </Marker>
        ))}

      </MapContainer>

      <div className="buttonGroup" style={{ marginTop: '10px' }}>
        <button className="btn" onClick={fetchComplaints}>Check for Complaints</button>
        <button className="btn" onClick={fetchPotholes}>Check for Potholes</button>
        <button className="btn" onClick={fetchEvents}>Check for Events</button>
        <button className="btn" onClick={fetchNearbyPlace}>Nearby schools/colleges</button>
      </div>

      <div className="reason-container">
        <h2>Probable Traffic Reason:</h2>
        <p>Number of Potholes on the route: {potholeCount}</p>
        <p>Number of Complaints registered on the route: {complaintCount}</p>{}
      </div>
    </div>
  );
};

export default MapRouting;

