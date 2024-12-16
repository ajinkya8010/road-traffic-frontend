import React, { useState, useEffect, useRef } from 'react';
import apiRequest from "../../lib/apiRequest";
import { MetroLines, checkMetroIntersection } from '../../lib/metroData.jsx';
import fetchFestivals from '../../lib/fetchFestivals';
import './mapRouting.css';

const MapRouting = () => {
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [potholes, setPotholes] = useState([]);
  const [events, setEvents] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [schools, setSchools] = useState([]);
  const [spots, setSpots] = useState([]);
  const [banquethalls, setBanquetHalls] = useState([]);
  const [gardens,setGardens] = useState([]);
  const [hospitals,setHospitals] = useState([]);
  const [hotels,setHotels] = useState([]);
  const [malls, setMalls] = useState([]);
  const [parkingbuildings,setParkingBuildings] = useState([]);
  const [diversions, setDiversions] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [festival, setFestival] = useState(null);
  const [isClicked, setIsClicked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [analysis, setShowAnalysis] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const sourceInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const sourceAutocomplete = useRef(null);
  const destinationAutocomplete = useRef(null);
  const googleMapRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const isScriptLoaded = useRef(false);
  const isMapInitialized = useRef(false);

  const [markerGroups, setMarkerGroups] = useState({
    potholes: [],
    complaints: [],
    events: [],
    nearbyPlaces: [],
    spots: [],
    metro: [],
    banquethalls:[],
    gardens:[],
    hospitals:[],
    hotels:[],
    malls:[],
    parkingbuildings: [],
    schools:[],
    diversions:[],
    constructions:[]
  });

  const [visibility, setVisibility] = useState({
    potholes: false,
    complaints: false,
    events: false,
    nearbyPlaces: false,
    spots: false,
    metro: false,
    banquethalls: false,
    gardens:false,
    hospitals:false,
    hotels:false,
    malls:false,
    parkingbuildings: false,
    schools:false,
    diversions:false,
    constructions:false
  });

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
        // Optional: implement a retry mechanism
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
          strokeColor: '#6FA1EC',
          strokeWeight: 4
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
    setLoading(true);
    
    try {
      if (!sourceCoords || !destinationCoords) {
        throw new Error("Please select valid source and destination addresses");
      }

      if (!window.google?.maps) {
        throw new Error("Google Maps not initialized");
      }

      handleClearRoute();
      setIsClicked(true);

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
    } finally {
      setLoading(false);
    }
  };

   // Modify handleClearRoute to include marker clearing
   const handleClearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    clearAllMarkers();
    setShowAnalysis(false);
    setRoutePoints([]);
    setVisibility({
      potholes: false,
      complaints: false,
      events: false,
      nearbyPlaces: false,
      spots: false,
      metro: false,
      banquethalls: false,
      gardens:false,
      hospitals:false,
      hotels:false,
      malls:false,
      parkingbuildings:false,
      schools:false,
      diversions:false,
      constructions:false
    });
  };

  const fetchComplaints = async () => {
    try {
      const response = await apiRequest.get("/complaint/getComplaintData");
      const data = response.data;
  
      // Use Google Maps LatLng and computeDistanceBetween
      const filteredComplaints = data.filter(complaint => {
        const complaintLatLng = new window.google.maps.LatLng(
          parseFloat(complaint.latitude),
          parseFloat(complaint.longitude)
        );
  
        return routePoints.some(routePoint => {
          const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
          // Compute the distance between points in meters
          return window.google.maps.geometry.spherical.computeDistanceBetween(
            complaintLatLng,
            routeLatLng
          ) <= 100; 
        });
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
  
      // Use Google Maps LatLng and computeDistanceBetween
      const filteredPotholes = data.filter(pothole => {
        const potholeLatLng = new window.google.maps.LatLng(
          parseFloat(pothole.latitude),
          parseFloat(pothole.longitude)
        );
  
        return routePoints.some(routePoint => {
          const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
          // Compute the distance between points in meters
          return window.google.maps.geometry.spherical.computeDistanceBetween(
            potholeLatLng,
            routeLatLng
          ) <= 50;
        });
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
        const eventLatLng = new google.maps.LatLng(parseFloat(event.latitude), parseFloat(event.longitude));
        const isOnRoute = routePoints.some(routePoint => {
        const routeLatLng = new google.maps.LatLng(routePoint.lat, routePoint.lng);
        return google.maps.geometry.spherical.computeDistanceBetween(eventLatLng, routeLatLng) <= 50; // Distance in meters
        });


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

   const fetchBanquetHalls = async () => {
    try {
      const response = await apiRequest.get("/banquethall/getAllBanquetHallsByTime");
      const data = response.data;
      console.log("Banquethall: "+data);
      // Use Google Maps LatLng and computeDistanceBetween
      const filteredBanquetHalls = data.filter(banquethall => {
        const banquetHallLatLng = new window.google.maps.LatLng(
          parseFloat(banquethall.latitude),
          parseFloat(banquethall.longitude)
        );
  
        return routePoints.some(routePoint => {
          const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
          // Compute the distance between points in meters
          return window.google.maps.geometry.spherical.computeDistanceBetween(
            banquetHallLatLng,
            routeLatLng
          ) <= 100; 
        });
      });
  
      setBanquetHalls(filteredBanquetHalls);
    } catch (error) {
      console.error("Error fetching Banquethalls:", error);
    }
  };

  const fetchGardens = async () => {
    try {
        // Fetch the gardens data from the backend
        const response = await apiRequest.get("/garden/getAllGardens");
        const data = response.data;
        console.log("Gardens"+data);

        // Filter gardens near the route
        const filteredGardens = data.filter(garden => {
            const gardenLatLng = new window.google.maps.LatLng(
                parseFloat(garden.latitude),
                parseFloat(garden.longitude)
            );

            return routePoints.some(routePoint => {
                const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
                // Compute the distance between points in meters
                return window.google.maps.geometry.spherical.computeDistanceBetween(
                    gardenLatLng,
                    routeLatLng
                ) <= 100;
            });
        });

        setGardens(filteredGardens);
    } catch (error) {
        console.error("Error fetching gardens:", error);
    }
};


const fetchHospitals = async () => {
    try {
        // Fetch the hospitals data from the backend
        const response = await apiRequest.get("/hospital/getAllHospitals");
        const data = response.data;
        console.log("hospitals"+data);

        // Filter hospitals near the route
        const filteredHospitals = data.filter(hospital => {
            const hospitalLatLng = new window.google.maps.LatLng(
                parseFloat(hospital.latitude),
                parseFloat(hospital.longitude)
            );

            return routePoints.some(routePoint => {
                const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
                // Compute the distance between points in meters
                return window.google.maps.geometry.spherical.computeDistanceBetween(
                    hospitalLatLng,
                    routeLatLng
                ) <= 10000;
            });
        });
          console.log(filteredHospitals);
        // Set the filtered hospitals to state
        setHospitals(filteredHospitals);
    } catch (error) {
        console.error("Error fetching hospitals:", error);
    }
  };


const fetchHotels = async () => {
    try {
        // Fetch the hotels data from the backend
        const response = await apiRequest.get("/hotel/getAllHotels");
        const data = response.data;

        // Filter hotels near the route
        const filteredHotels = data.filter(hotel => {
            const hotelLatLng = new window.google.maps.LatLng(
                parseFloat(hotel.latitude),
                parseFloat(hotel.longitude)
            );

            return routePoints.some(routePoint => {
                const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
                // Compute the distance between points in meters
                return window.google.maps.geometry.spherical.computeDistanceBetween(
                    hotelLatLng,
                    routeLatLng
                ) <= 500;
            });
        });

        // Set the filtered hotels to state
        setHotels(filteredHotels);
    } catch (error) {
        console.error("Error fetching hotels:", error);
    }
};

const fetchMalls = async () => {
    try {
        // Fetch the malls data from the backend
        const response = await apiRequest.get("/mall/getAllMalls");
        const data = response.data;
        console.log("Malls"+malls);
        // Filter malls near the route
        const filteredMalls = data.filter(mall => {
            const mallLatLng = new window.google.maps.LatLng(
                parseFloat(mall.latitude),
                parseFloat(mall.longitude)
            );

            return routePoints.some(routePoint => {
                const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
                // Compute the distance between points in meters
                return window.google.maps.geometry.spherical.computeDistanceBetween(
                    mallLatLng,
                    routeLatLng
                ) <= 100;
            });
        });

        // Set the filtered malls to state
        setMalls(filteredMalls);
    } catch (error) {
        console.error("Error fetching malls:", error);
    }
};


const fetchParkingBuildings = async () => {
    try {
        // Fetch the parking buildings data from the backend
        const response = await apiRequest.get("/parkingbuilding/getAllParkingBuildings");
        const data = response.data;
        // Filter parking buildings near the route
        const filteredParkingBuildings = data.filter(parkingBuilding => {
            const parkingBuildingLatLng = new window.google.maps.LatLng(
                parseFloat(parkingBuilding.latitude),
                parseFloat(parkingBuilding.longitude)
            );

            return routePoints.some(routePoint => {
                const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
                // Compute the distance between points in meters
                return window.google.maps.geometry.spherical.computeDistanceBetween(
                    parkingBuildingLatLng,
                    routeLatLng
                ) <= 100;
            });
        });

        // Set the filtered parking buildings to state
        setParkingBuildings(filteredParkingBuildings);
    } catch (error) {
        console.error("Error fetching parking buildings:", error);
    }
};

const fetchSchools = async () => {
  try {
      // Fetch the gardens data from the backend
      const response = await apiRequest.get("/school/getAllSchoolsByTime");
      const data = response.data;
      console.log("Schools"+data);

      // Filter gardens near the route
      const filteredSchools = data.filter(school => {
          const schoolLatLng = new window.google.maps.LatLng(
              parseFloat(school.latitude),
              parseFloat(school.longitude)
          );

          return routePoints.some(routePoint => {
              const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
              // Compute the distance between points in meters
              return window.google.maps.geometry.spherical.computeDistanceBetween(
                  schoolLatLng,
                  routeLatLng
              ) <= 100;
          });
      });

      setSchools(filteredSchools);
  } catch (error) {
      console.error("Error fetching schools:", error);
  }
};

const fetchDiversions = async () => {
  try {
    const response = await apiRequest.get("/diversion/getAllDiversions"); 
    const data = response.data;

    console.log("Divsersions "+data);

    // Filter diversions that intersect with the route
    const filteredDiversions = data.filter(diversion => {
      return diversion.diversionPoints.some(divPoint => {
        const diversionLatLng = new window.google.maps.LatLng(
          parseFloat(divPoint.lat),
          parseFloat(divPoint.lng)
        );

        return routePoints.some(routePoint => {
          const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
          return window.google.maps.geometry.spherical.computeDistanceBetween(
            diversionLatLng,
            routeLatLng
          ) <= 100; // 100 meters threshold
        });
      });
    });

    setDiversions(filteredDiversions);
  } catch (error) {
    console.error("Error fetching diversions:", error);
  }
};

  
const fetchConstructions = async () => {
  try {
    const response = await apiRequest.get("/construction/getAllConstructionProjects"); 
    const data = response.data;

    console.log("Constructions "+data);

    // Filter diversions that intersect with the route
    const filteredConstructions = data.filter(construction => {
      return construction.constructionPoints.some(divPoint => {
        const constructionLatLng = new window.google.maps.LatLng(
          parseFloat(divPoint.lat),
          parseFloat(divPoint.lng)
        );

        return routePoints.some(routePoint => {
          const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
          return window.google.maps.geometry.spherical.computeDistanceBetween(
            constructionLatLng,
            routeLatLng
          ) <= 100; // 100 meters threshold
        });
      });
    });

    setConstructions(filteredConstructions);
  } catch (error) {
    console.error("Error fetching diversions:", error);
  }
  };

  useEffect(() => {
    if (isClicked && routePoints.length > 0) {
      (async () => {
        await Promise.all([
          fetchComplaints(),
          fetchPotholes(),
          fetchEvents(),
          fetchSpots(),
          // fetchNearbyPlace(),
          fetchBanquetHalls(),
          fetchGardens(),
          fetchHospitals(),
          fetchHotels(),
          fetchMalls(),
          fetchParkingBuildings(),
          fetchSchools(),
          fetchDiversions(),
          fetchConstructions()
        ]);
        setLoading(false);
      })();
    }
  }, [routePoints, isClicked]);

  // Score calculation effect
  useEffect(() => {
    if (routePoints.length > 0 && isClicked) {
      let score = 6 * potholes.length + 
                  10 * spots.length + 
                  7 * complaints.length + 
                  10 * events.length + 
                  8 * nearbyPlaces.length+
                  1000*banquethalls.length+
                  2000*gardens.length + 
                  2000*hospitals.length+
                  2000*hotels.length+
                  2000*malls.length+
                  2000*parkingbuildings.length+
                  2000*schools.length+
                  2000*diversions.length+
                  2000*constructions.length;

      if (festival) score += 4;
      if (checkMetroIntersection(routePoints)) score += 9;
      
      setTotalScore(score);
    }
  }, [potholes, spots, complaints, events, nearbyPlaces, festival, banquethalls, gardens,hospitals,hotels,malls,parkingbuildings,schools,diversions,constructions,routePoints, isClicked]);

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

  // Function to clear specific marker group
  const clearMarkerGroup = (groupName) => {
    markerGroups[groupName].forEach(marker => marker.setMap(null));
    setMarkerGroups(prev => ({
      ...prev,
      [groupName]: []
    }));
  };

  // Function to clear all markers
  const clearAllMarkers = () => {
    Object.keys(markerGroups).forEach(groupName => {
      clearMarkerGroup(groupName);
    });
    if (sourceMarkerRef.current) {
      sourceMarkerRef.current.setMap(null);
      sourceMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }
  };

  // Function to create custom marker icon
  const createMarkerIcon = (color, label) => ({
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 8,
    labelOrigin: new window.google.maps.Point(0, -3),
    label: {
      text: label,
      color: '#ffffff',
      fontSize: '12px'
    }
  });

  // Function to toggle marker visibility
  const toggleMarkerGroup = (groupName) => {
    // Clear existing markers for this group
    clearMarkerGroup(groupName);

    // Toggle visibility state
    setVisibility(prev => {
      const newState = { ...prev, [groupName]: !prev[groupName] };
      
      // If turning on visibility, create new markers
      if (newState[groupName]) {
        createMarkersForGroup(groupName);
      }
      
      return newState;
    });
  };

  // Function to create markers for a specific group
  const createMarkersForGroup = (groupName) => {
    const newMarkers = [];
    
    switch(groupName) {
      case 'potholes':
        potholes.forEach((pothole, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(pothole.latitude), lng: parseFloat(pothole.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#FF4444', 'P'),
            title: `Pothole ${index + 1}`
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>Pothole</strong><br>Location: ${pothole.latitude}, ${pothole.longitude}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

      case 'complaints':
        complaints.forEach((complaint, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(complaint.latitude), lng: parseFloat(complaint.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#FFA500', 'C'),
            title: `Complaint ${index + 1}`
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>Complaint</strong><br>${complaint.description || 'No description available'}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

      case 'events':
        events.forEach((event, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#9C27B0', 'E'),
            title: `Event ${index + 1}`
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>${event.name || 'Event'}</strong><br>Start: ${new Date(event.startTime).toLocaleString()}<br>End: ${new Date(event.endTime).toLocaleString()}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

      case 'nearbyPlaces':
        nearbyPlaces.forEach((place, index) => {
          const marker = new window.google.maps.Marker({
            position: place.location,
            map: googleMapRef.current,
            icon: createMarkerIcon('#4CAF50', 'S'),
            title: place.name
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>${place.name}</strong><br>Educational Institution</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

      case 'spots':
        spots.forEach((spot, index) => {
          const marker = new window.google.maps.Marker({
            position: spot.location,
            map: googleMapRef.current,
            icon: createMarkerIcon('#FF5722', 'T'),
            title: spot.name
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>Traffic Hotspot</strong><br>${spot.name}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

      case 'metro':
        if (checkMetroIntersection(routePoints)) {
          MetroLines.forEach((line, index) => {
            const path = new window.google.maps.Polyline({
              path: line.coordinates,
              geodesic: true,
              strokeColor: '#3F51B5',
              strokeOpacity: 1.0,
              strokeWeight: 3,
              map: googleMapRef.current
            });
            newMarkers.push(path);
          });
        }
        break;

      case 'banquethalls':
        spots.forEach((banquethall, index) => {
          const marker = new window.google.maps.Marker({
            position: banquethall.location,
            map: googleMapRef.current,
            icon: createMarkerIcon('#FF5722', 'T'),
            title: banquethall.name
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>Banquet Hall</strong><br>${banquethall.name}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;
    }

    setMarkerGroups(prev => ({
      ...prev,
      [groupName]: newMarkers
    }));
  };

  // Function to update source/destination markers
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
          scaledSize: new window.google.maps.Size(40, 40)
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
          scaledSize: new window.google.maps.Size(40, 40)
        },
        title: 'Destination'
      });
    }
  };


  useEffect(() => {
    if (googleMapRef.current) {
      updateEndpointMarkers();
    }
  }, [sourceCoords, destinationCoords]);

 
  const createDiversionPolylines = () => {
    clearMarkerGroup('diversions');
    
    if (!visibility.diversions || !googleMapRef.current) return;
  
    const newMarkers = diversions.map(diversion => {
      const path = diversion.diversionPoints.map(point => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng)
      }));
  
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        strokePattern: [10, 10], // Creates a dotted line pattern
        map: googleMapRef.current
      });
  
      // Add an info window for the diversion
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${diversion.projectName}</h3>
            <p>Type: ${diversion.type}</p>
            <p>Vendor: ${diversion.vendorName}</p>
            <p>Duration: ${new Date(diversion.startDate).toLocaleDateString()} - 
                        ${new Date(diversion.endDate).toLocaleDateString()}</p>
          </div>
        `
      });
  
      // Add click listener to show info window
      polyline.addListener('click', () => {
        infoWindow.setPosition(new window.google.maps.LatLng(
          diversion.diversionPoints[0].lat,
          diversion.diversionPoints[0].lng
        ));
        infoWindow.open(googleMapRef.current);
      });
  
      return polyline;
    });
  
    setMarkerGroups(prev => ({
      ...prev,
      diversions: newMarkers
    }));
  };

  const createConstructionPolylines = () => {
    clearMarkerGroup('constructions');
    
    if (!visibility.constructions || !googleMapRef.current) return;
  
    const newMarkers = constructions.map(construction => {
      const path = construction.constructionPoints.map(point => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng)
      }));
  
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        strokePattern: [10, 10], // Creates a dotted line pattern
        map: googleMapRef.current
      });
  
      // Add an info window for the diversion
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${construction.projectName}</h3>
            <p>Type: ${constructions.type}</p>
            <p>Vendor: ${constructions.vendorName}</p>
            <p>Duration: ${new Date(constructions.startDate).toLocaleDateString()} - 
                        ${new Date(constructions.endDate).toLocaleDateString()}</p>
          </div>
        `
      });
  
      // Add click listener to show info window
      polyline.addListener('click', () => {
        infoWindow.setPosition(new window.google.maps.LatLng(
          constructions.diversionPoints[0].lat,
          constructions.diversionPoints[0].lng
        ));
        infoWindow.open(googleMapRef.current);
      });
  
      return polyline;
    });
  
    setMarkerGroups(prev => ({
      ...prev,
      constructions: newMarkers
    }));
  };

  useEffect(() => {
    if (visibility.diversions) {
      createDiversionPolylines();
    }else if(visibility.constructions){
      createConstructionPolylines();
    }
  }, [visibility.diversions, diversions,visibility.constructions, constructions]);

  return (
    <div>
      <div className="address-inputs">
        <div>
          <label>Source </label>
          <input
            ref={sourceInputRef}
            className="styled-input"
            type="text"
            value={sourceAddress}
            onChange={(e) => {
              setSourceAddress(e.target.value);
              setIsClicked(false);
              setPotholes([]);
              setComplaints([]);
              setNearbyPlaces([]);
              setBanquetHalls([]);
            }}
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
            onChange={(e) => {
              setDestinationAddress(e.target.value);
              setIsClicked(false);
              setPotholes([]);
              setComplaints([]);
              setNearbyPlaces([]);
              setBanquetHalls([]);
            }}
            placeholder="Enter destination address"
          />
        </div>
        <button className="btn-map top1" id="get" onClick={handleGetRoute}>
          Get Route
        </button>
        <button className="btn-map" id="clear" onClick={handleClearRoute}>
          Clear Route
        </button>
      </div>

      {loading && <div className="loading">Fetching route...</div>}
      
      <div className='map'>
        <div className="buttonGroup">
          <button 
            className={`btn-map ${visibility.complaints ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('complaints')}
          >
            {visibility.complaints ? 'Hide Complaints' : 'Show Complaints'}
          </button>
          <button 
            className={`btn-map ${visibility.potholes ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('potholes')}
          >
            {visibility.potholes ? 'Hide Potholes' : 'Show Potholes'}
          </button>
          <button 
            className={`btn-map ${visibility.events ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('events')}
          >
            {visibility.events ? 'Hide Events' : 'Show Events'}
          </button>
          <button 
            className={`btn-map ${visibility.nearbyPlaces ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('nearbyPlaces')}
          >
            {visibility.nearbyPlaces ? 'Hide Schools/Colleges' : 'Show Schools/Colleges'}
          </button>
          <button 
            className={`btn-map ${visibility.spots ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('spots')}
          >
            {visibility.spots ? 'Hide Traffic Spots' : 'Show Traffic Spots'}
          </button>
          <button 
            className={`btn-map ${visibility.metro ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('metro')}
          >
            {visibility.metro ? 'Hide Metro Lines' : 'Show Metro Lines'}
          </button>
        </div>
        <button 
            className={`btn-map ${visibility.banquethalls ? 'active' : ''}`}
            onClick={() => toggleMarkerGroup('banquethalls')}
          >
            {visibility.banquethalls ? 'Hide Banquet Halls' : 'Show Banquet Halls'}
          </button>

          <button
            onClick={() => toggleMarkerGroup('diversions')}
            className={`map-toggle-button ${visibility.diversions ? 'active' : ''}`}
          >
            Show Diversions
          </button>

          <button
            onClick={() => toggleMarkerGroup('constructions')}
            className={`map-toggle-button ${visibility.constructions ? 'active' : ''}`}
          >
            Show Constructions
          </button>
        
        <div id="googleMap" style={{ height: '460px', width: '100%', border: '2.5px solid black'}}></div>
      </div>

      {routePoints.length > 0 && (
        <div className='message'>
          <button className="btn-map" id="analyze" onClick={() => setShowAnalysis(true)}>
            View Detailed Analysis
          </button>
          <p style={{
            color: totalScore <= 19 ? 'green' : totalScore <= 39 ? 'yellow' : 'red'
          }}>
            {totalScore <= 19 && "Traffic on the selected route seems to be LOW "}
            {totalScore >= 20 && totalScore <= 39 && "Traffic on the selected route seems to be MEDIUM "}
            {totalScore >= 40 && "Traffic on the selected route seems to be HIGH "}
            {totalScore}
          </p>
        </div>
      )}

      {analysis && (
        <div className="reason-container">
          <h2>Probable Traffic Reasons:</h2>
          {potholes.length > 0 && <p>Number of Potholes on the route: {potholes.length}</p>}
          {complaints.length > 0 && <p>Number of Complaints registered on the route: {complaints.length}</p>}
          {events.length > 0 && <p>Number of Events registered on the route: {events.length}</p>}
          {nearbyPlaces.length > 0 && <p>Number of Schools & College with opening & closing time soon: {nearbyPlaces.length}</p>}
          {spots.length > 0 && <p>Number of Traffic Hotspots according recent Data by PMC: {spots.length}</p>}
          {checkMetroIntersection(routePoints) && <p>Metro construction work is ongoing on this route</p>}
          {banquethalls.length > 0 && <p>Number of banquethall registered on the route: {banquethalls.length}</p>}
          {gardens.length > 0 && <p>Number of gardens registered on the route: {gardens.length}</p>}
          {hospitals.length > 0 && <p>Number of hospitals registered on the route: {hospitals.length}</p>}
          {hotels.length > 0 && <p>Number of hotels registered on the route: {hotels.length}</p>}
          {malls.length > 0 && <p>Number of malls registered on the route: {malls.length}</p>}
          {parkingbuildings.length > 0 && <p>Number of parkingBuilding on the route: {parkingbuildings.length}</p>}
          {schools.length > 0 && <p>Number of Schools/clg/uni on the route opening/closing soon: {schools.length}</p>}
          {diversions.length > 0 && <p>Number of Diversions on the route opening/closing soon: {diversions.length}</p>}
          {festival && <p>Festival today: {festival}</p>}
        </div>
      )}
    </div>
  );
};

export default MapRouting;