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
import fetchFestivals from '../../lib/fetchFestivals';
import { MetroLines, checkMetroIntersection } from '../../lib/metroData.jsx';

import { OpenStreetMapProvider } from 'leaflet-geosearch';




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
  const [showNearByPlaces, setShowNearByPlaces] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const [showMetro, setShowMetro] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [spots, setSpots] = useState([]);
  const [isClicked, setIsClicked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [festival, setFestival] = useState(null);
  const [analysis, setShowAnalysis] = useState(false);

  const sourceInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const sourceAutocomplete = useRef(null);
  const destinationAutocomplete = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [googleDirectionsRenderer, setGoogleDirectionsRenderer] = useState({
    main: null,
    outline: null
  });
  const googleMapRef = useRef(null);


 useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeAutocomplete();
        initGoogleMap();
      };
      document.body.appendChild(script);
    };
    loadGoogleMapsScript();
  }, []);
  

  const initGoogleMap = () => {
    const mapOptions = {
      zoom: 12,
      center: { lat: 18.46456, lng: 73.87389 },
    };
  
    const googleMap = new window.google.maps.Map(document.getElementById('googleMap'), mapOptions);
    googleMapRef.current = googleMap;
  
    const trafficLayer = new window.google.maps.TrafficLayer();
    trafficLayer.setMap(googleMap);
  
    // Initialize the DirectionsRenderer with custom styling
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: googleMap,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#FFFFFF',    // Light color
        strokeOpacity: 0.7,        // Increased opacity
        strokeWeight: 5,           // Slightly thicker
        zIndex: 1                  // Below traffic layer
      },
    });
    
    const outlineRenderer = new window.google.maps.DirectionsRenderer({
      map: googleMap,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#000000',    // Outline color
        strokeOpacity: 0.4,        // Transparent outline
        strokeWeight: 7,           // Slightly thicker than main line
        zIndex: 0                  // Below main line
      },
    });
    
  
    setGoogleDirectionsRenderer({
      main: directionsRenderer,
      outline: outlineRenderer
    });
  };

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

  const displayGoogleMapsRoute = async (source, destination) => {
    if (!window.google || !googleMapRef.current || !googleDirectionsRenderer) return;
  
    const directionsService = new window.google.maps.DirectionsService();
  
    try {
      const result = await directionsService.route({
        origin: { lat: source.lat, lng: source.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
  
      // Set the route on both renderers
      googleDirectionsRenderer.main.setDirections(result);
      googleDirectionsRenderer.outline.setDirections(result);
  
      // Optional: Fit the map to show the entire route
      const bounds = new window.google.maps.LatLngBounds();
      const route = result.routes[0].legs[0];
      bounds.extend(route.start_location);
      bounds.extend(route.end_location);
      googleMapRef.current.fitBounds(bounds);
    } catch (error) {
      console.error("Error displaying route on Google Maps:", error);
    }
  };


 const provider = new OpenStreetMapProvider();

  const handleAddressSearch = async (address) => {
    const results = await provider.search({ query: address });
    if (results.length > 0) {
      const { x: lng, y: lat } = results[0];
      return { lat, lng }; 
    }
    return null; 
  };



  const handleGetRoute = async () => {
    setLoading(true);
    if (!sourceCoords || !destinationCoords) {
      alert("Please select valid source and destination addresses from the suggestions");
      setLoading(false);
      return;
    }

   /*const [sourceCoords, destinationCoords] = await Promise.all([
      handleAddressSearch(sourceAddress),
      handleAddressSearch(destinationAddress)
    ]);
    if (!sourceCoords || !destinationCoords) {
      console.log(sourceCoords+" "+destinationCoords);
      alert("Source and destination required");
      setLoading(false);
      return;
    } 
    setSourceCoords(sourceCoords);
    setDestinationCoords(destinationCoords); */
  
    //151-163 to be removed later
    handleClearRoute();
    setIsClicked(true); 
    await displayGoogleMapsRoute(sourceCoords, destinationCoords);
  };
  
  /*useEffect(() => {
    if (isClicked && routePoints.length > 0) {
      (async () => {
        await Promise.all([fetchComplaints(), fetchPotholes(), fetchEvents(), fetchSpots()]); //fetchNearbyPlace() add later
        console.log("Hi");
        setTotalScore(6*potholes.length+10*spots.length+7*complaints.length+10*events.length+8*nearbyPlaces.length);
        if (festival) {
          setTotalScore(prevScore => prevScore + 4);
        }
        setLoading(false);
      })();
    }
  }, [routePoints, isClicked]); */

  useEffect(() => {
    if (isClicked && routePoints.length > 0) {
      (async () => {
        await Promise.all([fetchComplaints(), fetchPotholes(),fetchNearbyPlace() ,fetchEvents(), fetchSpots()]); 
        setLoading(false);
      })();
    }
  }, [routePoints, isClicked]);
  

  useEffect(() => {
    if (routePoints.length > 0 && isClicked) {
      let score = 6 * potholes.length + 10 * spots.length + 7 * complaints.length + 10 * events.length + 8 * nearbyPlaces.length;
      if (festival) score += 4;
      if (checkMetroIntersection(routePoints)) {
        score += 9;
      }
      setTotalScore(score);
    }
  }, [potholes, spots, complaints, events, nearbyPlaces, festival, routePoints, isClicked]);
  



  useEffect(() => {
    const checkForFestivals = async () => {
      const year = new Date().getFullYear();
      const country = 'IN';
      const festivalsData = await fetchFestivals(year, country);
      const today = new Date().toISOString().split('T')[0];
      const festivalToday = festivalsData.find(festival => festival.date.iso === today);
      setFestival(festivalToday);
    };
    checkForFestivals();
  }, []);
  
  
  const handleClearRoute = () => {
      setShowComplaints(false);
      setShowPotholes(false);
      setShowEvents(false);
      setShowNearByPlaces(false);
      setShowSpots(false);
      setShowAnalysis(false);
      setShowMetro(false);

      if (googleDirectionsRenderer) {
        googleDirectionsRenderer.main.setDirections({ routes: [] });
        googleDirectionsRenderer.outline.setDirections({ routes: [] });
      }
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
      setPotholes(filteredPotholes);
    } catch (error) {
      console.error("Error fetching potholes:", error);
    }
  };


const fetchSpots = async () => {
  if (!sourceCoords) return alert("Please set source coordinates.");

  try {

      let allSpots = [];
      let nextPageToken = null;

      do {
          const response = await apiRequest.post("/nearby/hotspots", {
              params: {
                  routePoints: routePoints,
                  pagetoken: nextPageToken, 
              }
          });

          if (response.data.results) {
              allSpots = [...allSpots, ...response.data.results];
              nextPageToken = response.data.next_page_token;
          } else {
              nextPageToken = null; // If no more results, break out of loop
          }

          // Wait for 2 seconds if nextPageToken is available
          if (nextPageToken) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
          }
      } while (nextPageToken);

      const spots = allSpots.map(spot => ({
         name: spot.location,
         location: { lat: spot.lat, lng: spot.lng },
      }));
      setSpots(spots);
  } catch (error) {
      console.error("Error fetching traffic Spots:", error);
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
      setNearbyPlaces(places);
      //setShowNearByPlaces(true);
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
      //setShowEvents(true);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }



  return (
    <div>
      {/* Address Input Fields */}

      {/*<div className="address-inputs">
        <div>
          <label>Source </label>
          <input
            className="styled-input"
            type="text"
            value={sourceAddress}
            onChange={(e) => {setSourceAddress(e.target.value); handleClearRoute();}}
            placeholder="Enter source address"
          />
        </div>
        <div>
          <label>Destination </label>
          <input
            className="styled-input"
            type="text"
            value={destinationAddress}
            onChange={(e) => {setDestinationAddress(e.target.value); handleClearRoute();}}
            placeholder="Enter destination address"
          />
        </div>
        <button className="btn-map top1" onClick={handleGetRoute}>Get Route</button>
        <button className="btn-map" onClick={handleClearRoute}>Clear Route</button>
      </div>*/}


      {<div className="address-inputs">
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
        <button className="btn-map top1" id="get" onClick={handleGetRoute}>Get Route</button>
        <button className="btn-map" id="clear" onClick={handleClearRoute}>Clear Route</button>
      </div>}



     

      {loading && <div className="loading">Fetching route...</div>}
      <div className='map'>
      <div className="buttonGroup">
        <button className="btn-map" onClick={() => setShowComplaints(true)}>Check for Complaints</button>
        <button className="btn-map" onClick={() => setShowPotholes(true)}>Check for Potholes</button>
        <button className="btn-map" onClick={() => setShowEvents(true)}>Check for the Events</button>
        <button className="btn-map" onClick={() => setShowNearByPlaces(true)}>Nearby schools/colleges</button>
        <button className="btn-map" onClick={() => setShowSpots(true)}>Check for Traffic Spots</button>
        <button className="btn-map" onClick={() => setShowMetro(true)}>Check for Metro Lines</button>
      </div>
      <MapContainer
        center={[18.500030, 73.858416]}
        zoom={13}
        style={{ height: '460px', width: '48%', border:'2.5px solid black' }}
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

        
        {showSpots && spots.map((spot, index) => (
          <Marker
            key={index}
            position={[parseFloat(spot.location.lat), parseFloat(spot.location.lng)]}
            icon={L.ExtraMarkers.icon({
              icon: 'fa-circle',
              markerColor: 'green',
              prefix: 'fa'
            })}
          >
            <Popup>
              <div>
                <p>{spot.location}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        

        {showNearByPlaces && nearbyPlaces.map((place, index) => (
          <Marker key={index} position={[place.location.lat, place.location.lng]}>
            <Popup>{place.name}</Popup>
          </Marker>
        ))}

        <MetroLines showMetro={showMetro} routePoints={routePoints} />

      </MapContainer>
      <div id="googleMap" style={{ height: '460px', width: '48%', border:'2.5px solid black'}}></div>
      </div>


      {routePoints.length>0 && <div className='message'>
        <button className="btn-map" id="analyze" onClick={() => setShowAnalysis(true)}>View Detailed Analysis</button>
        <p style={{
          color: totalScore <= 19 ? 'green' : totalScore <= 39 ? 'yellow' : 'red'
        }}>
        {totalScore <= 19 && "Traffic on the selected route seems to be LOW "}
        {totalScore >= 20 && totalScore <= 39 && "Traffic on the selected route seems to be MEDIUM "}
        {totalScore >= 40 && "Traffic on the selected route seems to be HIGH "}
        {totalScore}
      </p>
      </div>}



      {analysis && <div className="reason-container">
        <h2>Probable Traffic Reasons:</h2>
        {potholes.length>0 && <p>Number of Potholes on the route: {potholes.length}</p>}
        {complaints.length>0 && <p>Number of Complaints registered on the route: {complaints.length}</p>}
        {complaints.length>0 && <p>Number of Events registered on the route: {complaints.length}</p>}
        {nearbyPlaces.length>0 && <p>Number of Schools & College with opening & closing time soon: {nearbyPlaces.length}</p>}
        {spots.length>0 && <p>Number of Traffic Hotspots according recent Data by PMC: {spots.length}</p>}
        {checkMetroIntersection(routePoints) && <p>Metro construction work is ongoing on this route</p>}
        {festival && <p>6. Festival today: {festival}</p>}

      </div>}


    </div>
  );
};

export default MapRouting;

