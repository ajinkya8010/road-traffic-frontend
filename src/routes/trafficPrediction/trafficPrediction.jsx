import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import "./trafficPrediction.css";
import apiRequest from "../../lib/apiRequest";

const TrafficPrediction = () => {
  const [timeSlot, setTimeSlot] = useState(null);
  const [date, setDate] = useState("");
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const sourceInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const sourceAutocomplete = useRef(null);
  const destinationAutocomplete = useRef(null);
  const googleMapRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [message,setMessage] = useState(false);
  const [score, setScore] = useState(0);
  const [constructions, setConstructions] = useState(0);
  const [event, setEvents] = useState(0);
  const [diversions, setDiversions] = useState(0);
  const [hotspots, setHotspots] = useState(0);
  const [festival, setFestival] = useState(null);
  
  const isScriptLoaded = useRef(false);
  const isMapInitialized = useRef(false);

  const sourceMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
    
    
      // Initialize Google Maps
      const loadGoogleMapsScript = () => {
        return new Promise((resolve, reject) => {
          // Check if Google Maps is already loaded
          if (window.google && window.google.maps) {
            resolve();
            return;
          }
      
          // Prevent multiple script loading attempts
          if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            const checkGoogle = setInterval(() => {
              if (window.google && window.google.maps) {
                clearInterval(checkGoogle);
                resolve();
              }
            }, 200);
            return;
          }
      
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
          script.async = true;
          script.defer = true;
      
          script.onload = () => {
            const checkGoogle = setInterval(() => {
              if (window.google && window.google.maps) {
                clearInterval(checkGoogle);
                resolve();
              }
            }, 200);
          };
      
          script.onerror = (error) => {
            console.error('Failed to load Google Maps script', error);
            reject(error);
          };
      
          document.head.appendChild(script);
        });
      };
    
      const initializeMap = async () => {
        // Prevent multiple initializations
        if (isMapInitialized.current) return;
        
        try {
          // Ensure Google Maps script is loaded
          await loadGoogleMapsScript();
      
          // Wait for the map container to be available
          const mapContainer = document.getElementById('googleMap');
          if (!mapContainer) {
            console.error('Map container not found. Retrying...');
            return;
          }
      
          // Ensure Google Maps and its libraries are fully loaded
          if (!window.google?.maps?.Map) {
            throw new Error('Google Maps API not fully loaded');
          }
      
          const mapOptions = {
            zoom: 12,
            center: { lat: 18.46456, lng: 73.87389 },
            mapTypeId: window.google.maps.MapTypeId.ROADMAP
          };
      
          const map = new window.google.maps.Map(mapContainer, mapOptions);
          googleMapRef.current = map;
      
          // Add layers and renderers safely
          if (window.google.maps.TrafficLayer) {
            const trafficLayer = new window.google.maps.TrafficLayer();
            trafficLayer.setMap(map);
          }
      
          const renderer = new window.google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#1e11f0',
              strokeWeight: 2
            }
          });
          setDirectionsRenderer(renderer);
      
          // Initialize autocomplete after map is ready
          initializeAutocomplete();
      
          isMapInitialized.current = true;
        } catch (error) {
          console.error('Initialization error:', error);
          // Reset initialization flag to allow retry
          isMapInitialized.current = false;
        }
      };

      const updateEndpointMarkers = () => {
        // Clear existing endpoint markers
        if (sourceMarkerRef.current) sourceMarkerRef.current.setMap(null);
        if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
    
        // Create source marker
        if (sourceCoords) {
          sourceMarkerRef.current = new window.google.maps.Marker({
            position: sourceCoords,
            map: googleMapRef.current,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new window.google.maps.Size(35, 35)
            },
            title: 'Source'
          });
        }
    
        // Create destination marker
        if (destinationCoords) {
          destinationMarkerRef.current = new window.google.maps.Marker({
            position: destinationCoords,
            map: googleMapRef.current,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(35, 35)
            },
            title: 'Destination'
          });
        }
      };
    
      // Modify useEffect to handle potential initialization failures
      useEffect(() => {
        let isMounted = true;
        
        const safeInit = async () => {
          try {
            if (isMounted) {
              await initializeMap();
            }
          } catch (error) {
            console.error('Initialization failed:', error);
          }
        };
      
        safeInit();
      
        return () => {
          isMounted = false;
          isMapInitialized.current = false;
          isScriptLoaded.current = false;
        };
      }, []); // Empty dependency array ensures this runs only once
    
      const initializeAutocomplete = () => {
        if (!sourceInputRef.current || !destinationInputRef.current) return;
    
        sourceAutocomplete.current = new window.google.maps.places.Autocomplete(sourceInputRef.current);
        destinationAutocomplete.current = new window.google.maps.places.Autocomplete(destinationInputRef.current);
    
        sourceAutocomplete.current?.addListener('place_changed', () => {
          const place = sourceAutocomplete.current.getPlace();
          if (place?.geometry) {
            setSourceAddress(place.formatted_address);
            setSourceCoords({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
        });
    
        destinationAutocomplete.current?.addListener('place_changed', () => {
          const place = destinationAutocomplete.current.getPlace();
          if (place?.geometry) {
            setDestinationAddress(place.formatted_address);
            setDestinationCoords({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
        });
      };
    
    
      const handleGetRoute = async () => {
        
        try {
          if (!sourceCoords || !destinationCoords) {
            throw new Error("Please select valid source and destination addresses");
          }
    
          if (!window.google?.maps) {
            throw new Error("Google Maps not initialized");
          }
    
          const directionsService = new window.google.maps.DirectionsService();
          
          const result = await new Promise((resolve, reject) => {
            directionsService.route({
              origin: sourceCoords,
              destination: destinationCoords,
              travelMode: window.google.maps.TravelMode.DRIVING
            }, (response, status) => {
              if (status === 'OK') resolve(response);
              else reject(new Error(`Directions request failed: ${status}`));
            });
          });
    
          if (directionsRenderer && result.routes?.[0]) {
            directionsRenderer.setDirections(result);
            
            const path = result.routes[0].overview_path;
            const points = path.map(point => ({
              lat: point.lat(),
              lng: point.lng()
            }));
            
            setRoutePoints(points);
            
          }
        } catch (error) {
          console.error("Error calculating route:", error);
          alert(error.message);
        }
      };
    
      useEffect(() => {
          if (googleMapRef.current) {
            updateEndpointMarkers();
          }
        }, [sourceCoords, destinationCoords]);

  const timeSlots = [
    { value: "00", label: "00-02" },
    { value: "02", label: "02-04" },
    { value: "04", label: "04-06" },
    { value: "06", label: "06-08" },
    { value: "08", label: "08-10" },
    { value: "10", label: "10-12" },
    { value: "12", label: "12-14" },
    { value: "14", label: "14-16" },
    { value: "16", label: "16-18" },
    { value: "18", label: "18-20" },
    { value: "20", label: "20-22" },
    { value: "22", label: "22-00" },
  ];

  const handleButtonClick = async () => {
    if (!timeSlot || !date) {
      alert("Please select all fields.");
      return;
    }

   try {
    
      const response = await apiRequest.get('/path-info/predictTraffic',{
        params:{
          timeSlot,
          date,
          routePoints
        }
      });
      const checkForFestivals = async () => {
        const year = new Date().getFullYear();
        const country = 'IN';
        const festivalsData = await fetchFestivals(year, country);
        const today = new Date().toISOString().split('T')[0];
        const festivalToday = festivalsData.find(festival => festival.date.iso === today);
        setFestival(festivalToday);
      };
      checkForFestivals();   
      const data = await response.data;
      setMessage(true);
      if(festival){
        setScore(data.score+5);
      }else{
        setScore(data.score);
      }
      setConstructions(data.constructionCount);
      setDiversions(data.diversionCount);
      setEvents(data.eventCount);
      setHotspots(data.hotspotCount);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="traffic-prediction-container">
      <h1 className="header">Traffic Prediction</h1>

      <div className="address-inputs">
        <div>
          <input
            ref={sourceInputRef}
            className="styled-input"
            type="text"
            value={sourceAddress}
            onChange={(e) => {
              setSourceAddress(e.target.value);
            }}
            placeholder="Enter source address"
          />
        </div>
        <div>
          <input
            ref={destinationInputRef}
            className="styled-input"
            type="text"
            value={destinationAddress}
            onChange={(e) => {
              setDestinationAddress(e.target.value);
            }}
            placeholder="Enter destination address"
          />
        </div>
        <button className="btn-top" id="get" onClick={handleGetRoute}>
          Get Route
        </button>
      </div>

      <div className='map'>
        <div id="googleMap" style={{ height: '460px', width: '100%', border: '2.5px solid black'}}></div>
      </div>

      <div className="input-group">
        <label className="input-label">Select Time Slot</label>
        <Select
          options={timeSlots}
          onChange={(selected) => setTimeSlot(selected.value)}
          className="dropdown"
        />
      </div>


      <div className="input-group">
        <label className="input-label">Select Future Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="date-picker"
        />
      </div>

      <button onClick={handleButtonClick} className="predict-button">
        Predict
      </button>

      {message && (
        <div className="message-predict-box">
          <div className="message-predict">
              <p style={{
                color: totalScore <= 15 
                  ? 'green' 
                  : totalScore <= 29 
                    ? 'lightgreen' 
                    : totalScore <= 59 
                      ? 'orange' 
                      : totalScore <= 79 
                        ? 'red' 
                        : 'darkred',
                fontSize: '20px',
                fontWeight: 'bold',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                margin: '20px 0',
              }}>

              {/* Traffic Message */}
              <span>
                {score <= 15 && "🚦 Traffic on the selected route seems will be VERY LOW "}
                {score >= 16 && score <= 29 && "🟢 Traffic on the selected route will be LOW "}
                {score >= 30 && score <= 59 && "🟠 Traffic on the selected route will be MEDIUM "}
                {score >= 60 && score <= 79 && "🔴 Traffic on the selected route seems will be HIGH "}
                {score >= 80 && "🚨 Traffic on the selected route seems will be VERY HIGH "}
              </span>

              <span style={{
                fontSize: '16px',
                color: '#555',
                animation: 'fadeIn 1s',
              }}>
                Predicted Traffic Score: {score}
              </span>
            </p>

            <h3>Traffic Predicted based on:</h3>
            <ul>
              <li>Constructions: {constructions}</li>
              <li>Diversions: {diversions}</li>
              <li>Hotspots: {hotspots}</li>
              <li>Events: {event}</li>
              {festival && <li>Festival: {festival}</li>}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrafficPrediction;
