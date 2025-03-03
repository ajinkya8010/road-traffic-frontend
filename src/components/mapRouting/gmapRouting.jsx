import React, { useState, useEffect, useRef } from 'react';
import apiRequest from "../../lib/apiRequest";
import fetchFestivals from '../../lib/fetchFestivals';
import './gmapRouting.css';

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
  const [festival, setFestival] = useState('');
  const [isClicked, setIsClicked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [analysis, setShowAnalysis] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [trafficStatus, setTrafficStatus] = useState([]);

  
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
    banquethalls:[],
    gardens:[],
    hospitals:[],
    hotels:[],
    malls:[],
    parkingbuildings: [],
    schools:[],
    diversions:[],
    constructions:[],
    trafficStatus:[]
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
  }, []); 

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
      setShowAnalysis(false);

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


   const handleClearRoute = () => {
    clearAllMarkers();
    setShowAnalysis(false);
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

      let allPlaces = [];
      let nextPageToken = null;

      do {
          const response = await apiRequest.post("/nearby/schools", {
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


const fetchEvents = async () => {
  try {
    const response = await apiRequest.get("/event/getEventData");
    const data = response.data;

    // Filter events based on location and timing
    const filteredEvents = data.filter(event => {
      // If the event is ongoing, check if it falls on the route
        return event.eventPoints.some(divPoint => {
          const eventLatLng = new window.google.maps.LatLng(
            parseFloat(divPoint.lat),
            parseFloat(divPoint.lng)
          );

          return routePoints.some(routePoint => {
            const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
            return window.google.maps.geometry.spherical.computeDistanceBetween(
              eventLatLng,
              routeLatLng
            ) <= 100; // 100 meters threshold
          });
        });
    });



    setEvents(filteredEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
  }
};



   const fetchBanquetHalls = async () => {
    try {
      const response = await apiRequest.get("/banquethall/getAllBanquetHallsByTime");
      const data = response.data;
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

      const capfilteredBanquetHalls = filteredBanquetHalls.filter(filteredBanquetHall =>{
        return filteredBanquetHall.numberOfVehiclesExpected > filteredBanquetHall.parkingLimit;
      })
  
      setBanquetHalls(capfilteredBanquetHalls);
    } catch (error) {
      console.error("Error fetching Banquethalls:", error);
    }
  };

  const fetchGardens = async () => {
    try {
        // Fetch the gardens data from the backend
        const response = await apiRequest.get("/garden/get");
        const data = response.data;

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
                ) <= 100;
            });
        });
        // Set the filtered hospitals to state
        setHospitals(filteredHospitals);
    } catch (error) {
        console.error("Error fetching hospitals:", error);
    }
  };


const fetchHotels = async () => {
    try {
        // Fetch the hotels data from the backend
        const response = await apiRequest.get("/hotel/get");
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
                ) <= 100;
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
        const response = await apiRequest.get("/mall/get");
        const data = response.data;
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

const fetchTrafficUpdates = async () => {
  try {
    // Fetch the traffic status data from the backend
    const response = await apiRequest.get("/traffic-status/getTrafficStatus");
    const data = response.data;
    console.log(data);

    // Get the current time for comparison
    const currentTime = new Date();

    // Filter traffic updates near the route and updated within the last 2 hours
    const filteredTrafficStatus = data.filter(ts => {
      const trafficStatusLatLng = new window.google.maps.LatLng(
        parseFloat(ts.latitude),
        parseFloat(ts.longitude)
      );

      // Calculate the time difference in hours
      const updatedAtTime = new Date(ts.updatedAt);
      const timeDifferenceInHours = (currentTime - updatedAtTime) / (1000 * 60 * 60);

      return (
        timeDifferenceInHours <= 2 && // Updated within the last 2 hours
        routePoints.some(routePoint => {
          const routeLatLng = new window.google.maps.LatLng(routePoint.lat, routePoint.lng);
          // Compute the distance between points in meters
          return window.google.maps.geometry.spherical.computeDistanceBetween(
            trafficStatusLatLng,
            routeLatLng
          ) <= 100;
        })
      );
    });
    
    

    // Set the filtered traffic status to state
    setTrafficStatus(filteredTrafficStatus);
  } catch (error) {
    console.error("Error fetching traffic updates:", error);
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
              ) <= 200;
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

  function checkBuses(schools){
    let total = schools.reduce((acc,curr)=>{
      return acc+curr.numberOfSchoolBuses;
    },0);
    if(total<=10) return 0;
    return Math.floor((total - 10) / 5);
  }

  useEffect(() => {
    if (isClicked && routePoints.length > 0) {
      (async () => {
        await Promise.all([
          fetchComplaints(),
          fetchPotholes(),
          fetchEvents(),
          fetchSpots(),
          //fetchNearbyPlace(),
          fetchBanquetHalls(),
          fetchGardens(),
          fetchHospitals(),
          fetchHotels(),
          fetchMalls(),
          fetchParkingBuildings(),
          fetchSchools(),
          fetchDiversions(),
          fetchConstructions(),
          fetchTrafficUpdates()
        ]);
        setLoading(false);
      })();
    }
  }, [routePoints, isClicked]);


  // Score calculation effect
  useEffect(() => {

    const predefinedRoutes = [
      { id: 'Kondhwa-Hinjewadi', 
        points: [      
          {lat: 18.46947, lng: 73.88898},
          {lat: 18.46947, lng: 73.88905000000001},
          {lat: 18.46856, lng: 73.88907},
          {lat: 18.46797, lng: 73.88909000000001},
          {lat: 18.46788, lng: 73.88907},
          {lat: 18.467760000000002, lng: 73.8891},
          {lat: 18.46758, lng: 73.8891},
          {lat: 18.467170000000003, lng: 73.88922000000001},
          {lat: 18.466900000000003, lng: 73.88928},
          {lat: 18.46674, lng: 73.88931000000001},
          {lat: 18.46669, lng: 73.88935000000001},
          {lat: 18.46665, lng: 73.88936000000001},
          {lat: 18.46571, lng: 73.88953000000001},
          {lat: 18.46467, lng: 73.88981000000001},
          {lat: 18.46433, lng: 73.88983},
          {lat: 18.464010000000002, lng: 73.88976000000001},
          {lat: 18.463800000000003, lng: 73.88967000000001},
          {lat: 18.463250000000002, lng: 73.88957},
          {lat: 18.463160000000002, lng: 73.88958000000001},
          {lat: 18.46292, lng: 73.88980000000001},
          {lat: 18.46246, lng: 73.8901},
          {lat: 18.462040000000002, lng: 73.89028},
          {lat: 18.46153, lng: 73.89045},
          {lat: 18.461370000000002, lng: 73.89048000000001},
          {lat: 18.46102, lng: 73.89058},
          {lat: 18.460130000000003, lng: 73.89078},
          {lat: 18.459500000000002, lng: 73.89087},
          {lat: 18.458720000000003, lng: 73.89089000000001},
          {lat: 18.45783, lng: 73.89086},
          {lat: 18.456850000000003, lng: 73.89085},
          {lat: 18.45644, lng: 73.89081},
          {lat: 18.454880000000003, lng: 73.89076},
          {lat: 18.454150000000002, lng: 73.89077},
          {lat: 18.453950000000003, lng: 73.89078},
          {lat: 18.453560000000003, lng: 73.8909},
          {lat: 18.45323, lng: 73.89101000000001},
          {lat: 18.45288, lng: 73.89108},
          {lat: 18.452450000000002, lng: 73.89118},
          {lat: 18.452260000000003, lng: 73.89125},
          {lat: 18.45204, lng: 73.89131},
          {lat: 18.45202, lng: 73.89122},
          {lat: 18.451960000000003, lng: 73.89105},
          {lat: 18.451800000000002, lng: 73.88999000000001},
          {lat: 18.451610000000002, lng: 73.8887},
          {lat: 18.45147, lng: 73.888},
          {lat: 18.45135, lng: 73.88748000000001},
          {lat: 18.45118, lng: 73.88648},
          {lat: 18.45092, lng: 73.8846},
          {lat: 18.450860000000002, lng: 73.88408000000001},
          {lat: 18.45088, lng: 73.88395000000001},
          {lat: 18.45089, lng: 73.88379},
          {lat: 18.450850000000003, lng: 73.88357},
          {lat: 18.450770000000002, lng: 73.88301000000001},
          {lat: 18.450650000000003, lng: 73.88220000000001},
          {lat: 18.450580000000002, lng: 73.88181},
          {lat: 18.45054, lng: 73.88138000000001},
          {lat: 18.450380000000003, lng: 73.88017},
          {lat: 18.450290000000003, lng: 73.87979},
          {lat: 18.450290000000003, lng: 73.87965000000001},
          {lat: 18.45033, lng: 73.87955000000001},
          {lat: 18.450400000000002, lng: 73.87943},
          {lat: 18.450270000000003, lng: 73.87919000000001},
          {lat: 18.45017, lng: 73.87898000000001},
          {lat: 18.45004, lng: 73.87751},
          {lat: 18.450000000000003, lng: 73.87672},
          {lat: 18.44994, lng: 73.87602000000001},
          {lat: 18.44987, lng: 73.87557000000001},
          {lat: 18.4497, lng: 73.87455},
          {lat: 18.44968, lng: 73.87446},
          {lat: 18.44957, lng: 73.87360000000001},
          {lat: 18.44957, lng: 73.87303},
          {lat: 18.449650000000002, lng: 73.87227},
          {lat: 18.44966, lng: 73.87198000000001},
          {lat: 18.449620000000003, lng: 73.87169},
          {lat: 18.449520000000003, lng: 73.87124},
          {lat: 18.44922, lng: 73.87049},
          {lat: 18.449050000000003, lng: 73.87010000000001},
          {lat: 18.44874, lng: 73.86944000000001},
          {lat: 18.44846, lng: 73.8687},
          {lat: 18.448320000000002, lng: 73.86819000000001},
          {lat: 18.44825, lng: 73.8678},
          {lat: 18.448210000000003, lng: 73.86737000000001},
          {lat: 18.44826, lng: 73.86685},
          {lat: 18.44837, lng: 73.86614},
          {lat: 18.448420000000002, lng: 73.86515},
          {lat: 18.44844, lng: 73.86508},
          {lat: 18.44847, lng: 73.8648},
          {lat: 18.44845, lng: 73.86447000000001},
          {lat: 18.44835, lng: 73.86423},
          {lat: 18.448240000000002, lng: 73.86409},
          {lat: 18.44819, lng: 73.86395},
          {lat: 18.448140000000002, lng: 73.86395},
          {lat: 18.4481, lng: 73.86393000000001},
          {lat: 18.448040000000002, lng: 73.86382},
          {lat: 18.447950000000002, lng: 73.86355},
          {lat: 18.447670000000002, lng: 73.86208},
          {lat: 18.44762, lng: 73.86176},
          {lat: 18.447460000000003, lng: 73.86053000000001},
          {lat: 18.44734, lng: 73.85989000000001},
          {lat: 18.447280000000003, lng: 73.85877},
          {lat: 18.44799, lng: 73.8585},
          {lat: 18.44807, lng: 73.85848},
          {lat: 18.44818, lng: 73.85779000000001},
          {lat: 18.44827, lng: 73.85739000000001},
          {lat: 18.44837, lng: 73.85709},
          {lat: 18.44847, lng: 73.8568},
          {lat: 18.44864, lng: 73.85627000000001},
          {lat: 18.44875, lng: 73.85595},
          {lat: 18.44892, lng: 73.85570000000001},
          {lat: 18.44901, lng: 73.85558},
          {lat: 18.44909, lng: 73.8554},
          {lat: 18.449270000000002, lng: 73.85483},
          {lat: 18.449530000000003, lng: 73.85386000000001},
          {lat: 18.450100000000003, lng: 73.85205},
          {lat: 18.45033, lng: 73.85121000000001},
          {lat: 18.45062, lng: 73.85024},
          {lat: 18.4509, lng: 73.84918},
          {lat: 18.451230000000002, lng: 73.84804000000001},
          {lat: 18.452150000000003, lng: 73.84490000000001},
          {lat: 18.45297, lng: 73.84205},
          {lat: 18.453560000000003, lng: 73.84009},
          {lat: 18.453960000000002, lng: 73.83877000000001},
          {lat: 18.45449, lng: 73.83714},
          {lat: 18.45466, lng: 73.83667000000001},
          {lat: 18.45502, lng: 73.83557},
          {lat: 18.45652, lng: 73.83112000000001},
          {lat: 18.457040000000003, lng: 73.8296},
          {lat: 18.457700000000003, lng: 73.82786},
          {lat: 18.45878, lng: 73.82542000000001},
          {lat: 18.459100000000003, lng: 73.82478},
          {lat: 18.459400000000002, lng: 73.82429},
          {lat: 18.459400000000002, lng: 73.82406},
          {lat: 18.459400000000002, lng: 73.82379},
          {lat: 18.45956, lng: 73.82365},
          {lat: 18.459780000000002, lng: 73.82343},
          {lat: 18.45998, lng: 73.8232},
          {lat: 18.46009, lng: 73.82309000000001},
          {lat: 18.46037, lng: 73.82264},
          {lat: 18.46083, lng: 73.82196},
          {lat: 18.461560000000002, lng: 73.82099000000001},
          {lat: 18.46199, lng: 73.82057},
          {lat: 18.462200000000003, lng: 73.8202},
          {lat: 18.46256, lng: 73.81985},
          {lat: 18.46301, lng: 73.81946},
          {lat: 18.463230000000003, lng: 73.81928},
          {lat: 18.46348, lng: 73.81924000000001},
          {lat: 18.46357, lng: 73.81924000000001},
          {lat: 18.463630000000002, lng: 73.81919},
          {lat: 18.46506, lng: 73.81794000000001},
          {lat: 18.46572, lng: 73.81736000000001},
          {lat: 18.466040000000003, lng: 73.81707},
          {lat: 18.466510000000003, lng: 73.81665000000001},
          {lat: 18.46837, lng: 73.81498},
          {lat: 18.47155, lng: 73.81212000000001},
          {lat: 18.47368, lng: 73.81021000000001},
          {lat: 18.47748, lng: 73.80683},
          {lat: 18.480040000000002, lng: 73.80454},
          {lat: 18.48065, lng: 73.80399000000001},
          {lat: 18.482300000000002, lng: 73.80247},
          {lat: 18.482570000000003, lng: 73.80219000000001},
          {lat: 18.48327, lng: 73.80142000000001},
          {lat: 18.48376, lng: 73.80081000000001},
          {lat: 18.4845, lng: 73.79974},
          {lat: 18.485210000000002, lng: 73.79872},
          {lat: 18.486130000000003, lng: 73.79738},
          {lat: 18.488470000000003, lng: 73.79398},
          {lat: 18.490250000000003, lng: 73.79141},
          {lat: 18.49106, lng: 73.79028000000001},
          {lat: 18.491470000000003, lng: 73.78985},
          {lat: 18.49173, lng: 73.78962},
          {lat: 18.49237, lng: 73.78915},
          {lat: 18.4934, lng: 73.78838},
          {lat: 18.493820000000003, lng: 73.78814000000001},
          {lat: 18.494220000000002, lng: 73.78799000000001},
          {lat: 18.494680000000002, lng: 73.78786000000001},
          {lat: 18.49503, lng: 73.78782000000001},
          {lat: 18.49529, lng: 73.7878},
          {lat: 18.49586, lng: 73.78784},
          {lat: 18.496460000000003, lng: 73.78793},
          {lat: 18.496940000000002, lng: 73.78812},
          {lat: 18.49727, lng: 73.78831000000001},
          {lat: 18.49753, lng: 73.78852},
          {lat: 18.498140000000003, lng: 73.78904},
          {lat: 18.499560000000002, lng: 73.79026},
          {lat: 18.500040000000002, lng: 73.7907},
          {lat: 18.501260000000002, lng: 73.79168},
          {lat: 18.501790000000003, lng: 73.79204},
          {lat: 18.502090000000003, lng: 73.79220000000001},
          {lat: 18.50249, lng: 73.79233},
          {lat: 18.503, lng: 73.79247000000001},
          {lat: 18.50325, lng: 73.79252000000001},
          {lat: 18.50362, lng: 73.79253},
          {lat: 18.504050000000003, lng: 73.79251000000001},
          {lat: 18.5044, lng: 73.79245},
          {lat: 18.504910000000002, lng: 73.79231},
          {lat: 18.50552, lng: 73.792},
          {lat: 18.50591, lng: 73.79173},
          {lat: 18.50626, lng: 73.79144000000001},
          {lat: 18.50647, lng: 73.7912},
          {lat: 18.506670000000003, lng: 73.79094},
          {lat: 18.506960000000003, lng: 73.79047},
          {lat: 18.507140000000003, lng: 73.79007},
          {lat: 18.507270000000002, lng: 73.78967},
          {lat: 18.507360000000002, lng: 73.78927},
          {lat: 18.50738, lng: 73.78899000000001},
          {lat: 18.50739, lng: 73.78828},
          {lat: 18.50742, lng: 73.78796000000001},
          {lat: 18.50721, lng: 73.78509000000001}, 
          {lat: 18.50719, lng: 73.78414000000001},
          {lat: 18.507260000000002, lng: 73.78348000000001},
          {lat: 18.50737, lng: 73.78278},
          {lat: 18.507460000000002, lng: 73.78240000000001},
          {lat: 18.508200000000002, lng: 73.77916},
          {lat: 18.508680000000002, lng: 73.77682},
          {lat: 18.508960000000002, lng: 73.77543},
          {lat: 18.50915, lng: 73.77482},
          {lat: 18.50934, lng: 73.77437},
          {lat: 18.50956, lng: 73.77395},
          {lat: 18.509790000000002, lng: 73.77357}, 
          {lat: 18.5101, lng: 73.77315},
          {lat: 18.51084, lng: 73.77218}, 
          {lat: 18.511390000000002, lng: 73.77149},
          {lat: 18.511940000000003, lng: 73.77091},
          {lat: 18.51248, lng: 73.77045000000001},
          {lat: 18.51332, lng: 73.76993},
          {lat: 18.51396, lng: 73.76958}, 
          {lat: 18.51442, lng: 73.76937000000001},
          {lat: 18.5149, lng: 73.76921},
          {lat: 18.51549, lng: 73.76908}, 
          {lat: 18.51623, lng: 73.76893000000001},
          {lat: 18.516910000000003, lng: 73.76884000000001},
          {lat: 18.5178, lng: 73.76881},
          {lat: 18.51819, lng: 73.76883000000001},
          {lat: 18.519540000000003, lng: 73.76899}, 
          {lat: 18.519910000000003, lng: 73.76907},
          {lat: 18.521050000000002, lng: 73.76935},
          {lat: 18.52166, lng: 73.76953},
          {lat: 18.52193, lng: 73.76966},
          {lat: 18.522180000000002, lng: 73.76981},
          {lat: 18.52267, lng: 73.7702},
          {lat: 18.52402, lng: 73.77120000000001},
          {lat: 18.52468, lng: 73.77170000000001},
          {lat: 18.52522, lng: 73.77214000000001},
          {lat: 18.525640000000003, lng: 73.77256000000001},
          {lat: 18.526, lng: 73.77301},
          {lat: 18.52635, lng: 73.77362000000001},
          {lat: 18.526590000000002, lng: 73.77422},
          {lat: 18.527330000000003, lng: 73.77623000000001},
          {lat: 18.52786, lng: 73.77717000000001},
          {lat: 18.52797, lng: 73.77731},
          {lat: 18.528450000000003, lng: 73.77786},
          {lat: 18.52877, lng: 73.77813},
          {lat: 18.529210000000003, lng: 73.77844},
          {lat: 18.52954, lng: 73.77863},
          {lat: 18.531560000000002, lng: 73.77951},
          {lat: 18.532010000000003, lng: 73.7797},
          {lat: 18.532700000000002, lng: 73.77995},
          {lat: 18.53384, lng: 73.78020000000001},
          {lat: 18.535, lng: 73.78046},
          {lat: 18.53674, lng: 73.781},
          {lat: 18.53722, lng: 73.78113},
          {lat: 18.537850000000002, lng: 73.78119000000001},
          {lat: 18.53848, lng: 73.78114000000001},
          {lat: 18.53891, lng: 73.78102000000001},
          {lat: 18.53937, lng: 73.78081},
          {lat: 18.539720000000003, lng: 73.78058},
          {lat: 18.540110000000002, lng: 73.78025000000001},
          {lat: 18.54045, lng: 73.77983},
          {lat: 18.540960000000002, lng: 73.77913000000001},
          {lat: 18.54145, lng: 73.77838000000001},
          {lat: 18.54222, lng: 73.77733},
          {lat: 18.54352, lng: 73.77583},
          {lat: 18.54379, lng: 73.77553},
          {lat: 18.54438, lng: 73.7749},
          {lat: 18.54475, lng: 73.77461000000001},
          {lat: 18.54503, lng: 73.77443000000001},
          {lat: 18.54549, lng: 73.77422},
          {lat: 18.546470000000003, lng: 73.77384},
          {lat: 18.548540000000003, lng: 73.77311},
          {lat: 18.55002, lng: 73.77257},
          {lat: 18.553900000000002, lng: 73.77123},
          {lat: 18.557460000000003, lng: 73.76996000000001},
          {lat: 18.560100000000002, lng: 73.76904},
          {lat: 18.56109, lng: 73.76869}, 
          {lat: 18.56231, lng: 73.76827},
          {lat: 18.56324, lng: 73.76789000000001},
          {lat: 18.56493, lng: 73.76728},
          {lat: 18.56706, lng: 73.76647000000001},
          {lat: 18.569110000000002, lng: 73.76573},
          {lat: 18.56989, lng: 73.76545}, 
          {lat: 18.571540000000002, lng: 73.76479},
          {lat: 18.572190000000003, lng: 73.76456},
          {lat: 18.57591, lng: 73.76318},
          {lat: 18.582610000000003, lng: 73.76067},
          {lat: 18.585610000000003, lng: 73.75955},
          {lat: 18.58578, lng: 73.75949},
          {lat: 18.58774, lng: 73.75876000000001},
          {lat: 18.590660000000003, lng: 73.75766},
          {lat: 18.591610000000003, lng: 73.75729000000001},
          {lat: 18.591710000000003, lng: 73.75725},
          {lat: 18.59187, lng: 73.75706000000001},
          {lat: 18.59185, lng: 73.75634000000001},
          {lat: 18.59185, lng: 73.75566},
          {lat: 18.59185, lng: 73.75523000000001},
          {lat: 18.591810000000002, lng: 73.75479},
          {lat: 18.59174, lng: 73.7544},
          {lat: 18.591620000000002, lng: 73.754},
          {lat: 18.59159, lng: 73.7539},
          {lat: 18.591600000000003, lng: 73.75383000000001},
          {lat: 18.59112, lng: 73.75274},
          {lat: 18.590870000000002, lng: 73.75216},
          {lat: 18.5908, lng: 73.75192000000001}, 
          {lat: 18.59075, lng: 73.75138000000001},
          {lat: 18.59075, lng: 73.75051},
          {lat: 18.590870000000002, lng: 73.74944},
          {lat: 18.59089, lng: 73.74888},
          {lat: 18.590760000000003, lng: 73.74795},
          {lat: 18.59071, lng: 73.74743000000001},
          {lat: 18.59075, lng: 73.74713000000001},
          {lat: 18.590980000000002, lng: 73.7455},
          {lat: 18.591050000000003, lng: 73.74478}, 
          {lat: 18.591150000000003, lng: 73.74369},
          {lat: 18.590950000000003, lng: 73.74233000000001},
          {lat: 18.590880000000002, lng: 73.74173},
          {lat: 18.59091, lng: 73.74142},
          {lat: 18.59092, lng: 73.7411},
          {lat: 18.590970000000002, lng: 73.74071},
          {lat: 18.59117, lng: 73.73913},
          {lat: 18.59118, lng: 73.73898000000001},
          {lat: 18.59121, lng: 73.73888000000001}, 
          {lat: 18.59127, lng: 73.73891}]
      }, 
      { id: 'Swargate-Katraj', 
        points: [          
          {lat: 18.50185, lng: 73.86362000000001}, 
          {lat: 18.501810000000003, lng: 73.86364},
          {lat: 18.501640000000002, lng: 73.86341},
          {lat: 18.501350000000002, lng: 73.86304000000001},
          {lat: 18.5011, lng: 73.86272000000001},
          {lat: 18.500210000000003, lng: 73.86329},
          {lat: 18.500040000000002, lng: 73.86334000000001},
          {lat: 18.4999, lng: 73.86328},
          {lat: 18.49996, lng: 73.86286000000001},
          {lat: 18.500040000000002, lng: 73.86172},
          {lat: 18.500320000000002, lng: 73.86044000000001},
          {lat: 18.50045, lng: 73.85939},
          {lat: 18.500480000000003, lng: 73.85902},
          {lat: 18.50043, lng: 73.85891000000001},
          {lat: 18.50034, lng: 73.85873000000001},
          {lat: 18.500200000000003, lng: 73.85857},
          {lat: 18.499390000000002, lng: 73.85846000000001},
          {lat: 18.498610000000003, lng: 73.85835},
          {lat: 18.497400000000003, lng: 73.85816000000001},
          {lat: 18.496930000000003, lng: 73.85808},
          {lat: 18.49668, lng: 73.85809},
          {lat: 18.496070000000003, lng: 73.85813},
          {lat: 18.495430000000002, lng: 73.85808},
          {lat: 18.494570000000003, lng: 73.85802000000001},
          {lat: 18.493820000000003, lng: 73.85795},
          {lat: 18.493190000000002, lng: 73.85791},
          {lat: 18.49246, lng: 73.85783},
          {lat: 18.492240000000002, lng: 73.85782},
          {lat: 18.4909, lng: 73.85778},
          {lat: 18.49041, lng: 73.85770000000001},
          {lat: 18.489980000000003, lng: 73.85766000000001},
          {lat: 18.489420000000003, lng: 73.85755},
          {lat: 18.48918, lng: 73.85752000000001},
          {lat: 18.488960000000002, lng: 73.8575},
          {lat: 18.488580000000002, lng: 73.8575},
          {lat: 18.487940000000002, lng: 73.85758000000001},
          {lat: 18.48769, lng: 73.85759},
          {lat: 18.4871, lng: 73.85763},
          {lat: 18.48696, lng: 73.85759},
          {lat: 18.485840000000003, lng: 73.85773},
          {lat: 18.485590000000002, lng: 73.85773},
          {lat: 18.484830000000002, lng: 73.85776},
          {lat: 18.484250000000003, lng: 73.85770000000001},
          {lat: 18.48393, lng: 73.85764},
          {lat: 18.48367, lng: 73.85756},
          {lat: 18.48281, lng: 73.85740000000001},
          {lat: 18.482660000000003, lng: 73.85738},
          {lat: 18.48241, lng: 73.85736},
          {lat: 18.48129, lng: 73.85733},
          {lat: 18.481170000000002, lng: 73.85732},
          {lat: 18.48034, lng: 73.85731000000001},
          {lat: 18.47992, lng: 73.85731000000001},
          {lat: 18.479550000000003, lng: 73.85733},
          {lat: 18.47884, lng: 73.85733},
          {lat: 18.478440000000003, lng: 73.85732},
          {lat: 18.477580000000003, lng: 73.85728},
          {lat: 18.47728, lng: 73.85722000000001},
          {lat: 18.47707, lng: 73.8571},
          {lat: 18.476460000000003, lng: 73.85663000000001},
          {lat: 18.47623, lng: 73.85650000000001},
          {lat: 18.47607, lng: 73.85644},
          {lat: 18.475900000000003, lng: 73.85641000000001},
          {lat: 18.47547, lng: 73.85637000000001},
          {lat: 18.47485, lng: 73.85639},
          {lat: 18.47448, lng: 73.85645000000001},
          {lat: 18.474050000000002, lng: 73.85650000000001},
          {lat: 18.474020000000003, lng: 73.85646000000001},
          {lat: 18.47399, lng: 73.85645000000001},
          {lat: 18.47396, lng: 73.85645000000001},
          {lat: 18.473460000000003, lng: 73.85649000000001},
          {lat: 18.47241, lng: 73.85674},
          {lat: 18.471780000000003, lng: 73.85692},
          {lat: 18.47117, lng: 73.8571},
          {lat: 18.47058, lng: 73.85723},
          {lat: 18.46956, lng: 73.85754},
          {lat: 18.46903, lng: 73.85766000000001},
          {lat: 18.468420000000002, lng: 73.85777},
          {lat: 18.46769, lng: 73.85787},
          {lat: 18.465960000000003, lng: 73.85806000000001},
          {lat: 18.46423, lng: 73.85822},
          {lat: 18.46317, lng: 73.85829000000001},
          {lat: 18.462670000000003, lng: 73.85828000000001},
          {lat: 18.46197, lng: 73.85823},
          {lat: 18.46153, lng: 73.85817},
          {lat: 18.460800000000003, lng: 73.85811000000001},
          {lat: 18.46031, lng: 73.85817},
          {lat: 18.459400000000002, lng: 73.85811000000001},
          {lat: 18.4589, lng: 73.85811000000001},
          {lat: 18.458630000000003, lng: 73.85816000000001},
          {lat: 18.458170000000003, lng: 73.85827},
          {lat: 18.457530000000002, lng: 73.85841},
          {lat: 18.4574, lng: 73.85845},
          {lat: 18.457440000000002, lng: 73.85857},
          {lat: 18.457970000000003, lng: 73.85849},
          {lat: 18.457970000000003, lng: 73.85901000000001},
          {lat: 18.457970000000003, lng: 73.85917},
          {lat: 18.457970000000003, lng: 73.85929},
          {lat: 18.457970000000003, lng: 73.85978},
          {lat: 18.45802, lng: 73.85978},
          {lat: 18.458530000000003, lng: 73.85988},
          {lat: 18.45871, lng: 73.85991},
          {lat: 18.458920000000003, lng: 73.85997},
          {lat: 18.45897, lng: 73.86002},
          {lat: 18.459030000000002, lng: 73.86019},
          {lat: 18.459120000000002, lng: 73.86063},
          {lat: 18.45926, lng: 73.86133000000001},
          {lat: 18.45927, lng: 73.86143000000001},
          {lat: 18.459280000000003, lng: 73.86151000000001},
          {lat: 18.45936, lng: 73.86161000000001},
          {lat: 18.45952, lng: 73.86172},
          {lat: 18.45956, lng: 73.86181},
          {lat: 18.45952, lng: 73.86238},
          {lat: 18.45952, lng: 73.86252},
          {lat: 18.45951, lng: 73.86262},
          {lat: 18.45946, lng: 73.86278},
          {lat: 18.459310000000002, lng: 73.86298000000001},
          {lat: 18.45925, lng: 73.86309},
          {lat: 18.45924, lng: 73.86315},
          {lat: 18.45943, lng: 73.86337},
          {lat: 18.45927, lng: 73.86347},
          {lat: 18.459210000000002, lng: 73.86361000000001},
          {lat: 18.459110000000003, lng: 73.86404},
          {lat: 18.459020000000002, lng: 73.86429000000001},
          {lat: 18.45897, lng: 73.86439},
          {lat: 18.45888, lng: 73.86445},
          {lat: 18.458440000000003, lng: 73.86462},
          {lat: 18.45822, lng: 73.86466},
          {lat: 18.45792, lng: 73.86467},
          {lat: 18.457600000000003, lng: 73.86475},
          {lat: 18.45721, lng: 73.86492000000001},
          {lat: 18.45707, lng: 73.86501000000001},
          {lat: 18.45701, lng: 73.86507},
          {lat: 18.45683, lng: 73.8653},
          {lat: 18.45665, lng: 73.86546000000001},
          {lat: 18.456190000000003, lng: 73.86563000000001},
          {lat: 18.455940000000002, lng: 73.86579},
          {lat: 18.45585, lng: 73.86587},
          {lat: 18.455820000000003, lng: 73.86594000000001},
          {lat: 18.4558, lng: 73.86613000000001},
          {lat: 18.455640000000002, lng: 73.86611},
          {lat: 18.455340000000003, lng: 73.86604000000001},
          {lat: 18.45513, lng: 73.86596},
          {lat: 18.45485, lng: 73.86578},
          {lat: 18.454410000000003, lng: 73.86546000000001},
          {lat: 18.45428, lng: 73.86540000000001},
          {lat: 18.454120000000003, lng: 73.86525},
          {lat: 18.45382, lng: 73.86504000000001},
          {lat: 18.453750000000003, lng: 73.86505000000001},
          {lat: 18.45335, lng: 73.86516},
          {lat: 18.453180000000003, lng: 73.86522000000001},
          {lat: 18.453090000000003, lng: 73.86524},
          {lat: 18.452930000000002, lng: 73.86523000000001}
        ] 
      }, 
      { id: 'Hinjewadi-Swargate', 
        points: [
          {lat: 18.59127, lng: 73.73891},
          {lat: 18.591340000000002, lng: 73.73894},
          {lat: 18.591320000000003, lng: 73.73902000000001},
          {lat: 18.59122, lng: 73.73947000000001},
          {lat: 18.591140000000003, lng: 73.74021},
          {lat: 18.591040000000003, lng: 73.74137},
          {lat: 18.59102, lng: 73.74161000000001},
          {lat: 18.591040000000003, lng: 73.74185},
          {lat: 18.59111, lng: 73.74235},
          {lat: 18.59118, lng: 73.74283000000001},
          {lat: 18.5912, lng: 73.74296000000001},
          {lat: 18.591250000000002, lng: 73.74342},
          {lat: 18.59128, lng: 73.74372000000001},
          {lat: 18.59127, lng: 73.74398000000001},
          {lat: 18.59122, lng: 73.74463},
          {lat: 18.591160000000002, lng: 73.74522},
          {lat: 18.591060000000002, lng: 73.74600000000001},
          {lat: 18.59099, lng: 73.74647},
          {lat: 18.590860000000003, lng: 73.74726000000001},
          {lat: 18.59081, lng: 73.74773},
          {lat: 18.590850000000003, lng: 73.7479},
          {lat: 18.59099, lng: 73.74869000000001},
          {lat: 18.59102, lng: 73.74905000000001},
          {lat: 18.591, lng: 73.74944},
          {lat: 18.5909, lng: 73.75087},
          {lat: 18.59092, lng: 73.75157},
          {lat: 18.59099, lng: 73.75191000000001},
          {lat: 18.591060000000002, lng: 73.75213000000001},
          {lat: 18.59174, lng: 73.75367},
          {lat: 18.59186, lng: 73.75397000000001},
          {lat: 18.59195, lng: 73.75428000000001},
          {lat: 18.592000000000002, lng: 73.75471},
          {lat: 18.59204, lng: 73.75565},
          {lat: 18.59203, lng: 73.75693000000001},
          {lat: 18.59213, lng: 73.75827000000001},
          {lat: 18.592550000000003, lng: 73.76116},
          {lat: 18.592540000000003, lng: 73.76156},
          {lat: 18.59244, lng: 73.76228},
          {lat: 18.592280000000002, lng: 73.76325},
          {lat: 18.592190000000002, lng: 73.76429},
          {lat: 18.59211, lng: 73.76496},
          {lat: 18.59203, lng: 73.76535000000001},
          {lat: 18.591880000000003, lng: 73.76568},
          {lat: 18.59175, lng: 73.76592000000001},
          {lat: 18.5913, lng: 73.76654},
          {lat: 18.59117, lng: 73.76684},
          {lat: 18.590950000000003, lng: 73.76726000000001},
          {lat: 18.590590000000002, lng: 73.76803000000001},
          {lat: 18.590300000000003, lng: 73.76865000000001},
          {lat: 18.59019, lng: 73.76893000000001},
          {lat: 18.59017, lng: 73.76921},
          {lat: 18.59015, lng: 73.7711},
          {lat: 18.59016, lng: 73.77205000000001},
          {lat: 18.590200000000003, lng: 73.77284},
          {lat: 18.59018, lng: 73.77326000000001},
          {lat: 18.58999, lng: 73.77392},
          {lat: 18.589460000000003, lng: 73.7753},
          {lat: 18.5893, lng: 73.77577000000001},
          {lat: 18.589180000000002, lng: 73.77625},
          {lat: 18.589170000000003, lng: 73.77677},
          {lat: 18.589190000000002, lng: 73.77698000000001},
          {lat: 18.58921, lng: 73.77707000000001},
          {lat: 18.58903, lng: 73.77721000000001},
          {lat: 18.588820000000002, lng: 73.77778},
          {lat: 18.588710000000003, lng: 73.77820000000001},
          {lat: 18.58864, lng: 73.77853},
          {lat: 18.588630000000002, lng: 73.77909000000001},
          {lat: 18.58865, lng: 73.7796},
          {lat: 18.58866, lng: 73.77999000000001},
          {lat: 18.588600000000003, lng: 73.78106000000001},
          {lat: 18.588520000000003, lng: 73.78191000000001},
          {lat: 18.58845, lng: 73.78274},
          {lat: 18.5884, lng: 73.78317000000001},
          {lat: 18.588330000000003, lng: 73.78371},
          {lat: 18.588240000000003, lng: 73.78457},
          {lat: 18.588160000000002, lng: 73.78497},
          {lat: 18.58753, lng: 73.78822000000001},
          {lat: 18.58723, lng: 73.78932},
          {lat: 18.587010000000003, lng: 73.79008},
          {lat: 18.5868, lng: 73.79074},
          {lat: 18.58669, lng: 73.79100000000001},
          {lat: 18.5866, lng: 73.79116},
          {lat: 18.58622, lng: 73.79183},
          {lat: 18.585610000000003, lng: 73.79299},
          {lat: 18.58556, lng: 73.79303},
          {lat: 18.585510000000003, lng: 73.79305000000001},
          {lat: 18.5852, lng: 73.79358},
          {lat: 18.58456, lng: 73.79471000000001},
          {lat: 18.58427, lng: 73.79516000000001},
          {lat: 18.583640000000003, lng: 73.79605000000001},
          {lat: 18.583180000000002, lng: 73.79659000000001},
          {lat: 18.582310000000003, lng: 73.79756},
          {lat: 18.58069, lng: 73.79928000000001},
          {lat: 18.578930000000003, lng: 73.80113},
          {lat: 18.57779, lng: 73.80235},
          {lat: 18.5773, lng: 73.80291000000001},
          {lat: 18.576710000000002, lng: 73.8035},
          {lat: 18.576, lng: 73.80422},
          {lat: 18.575200000000002, lng: 73.80508},
          {lat: 18.57448, lng: 73.80574},
          {lat: 18.574050000000003, lng: 73.80614},
          {lat: 18.573420000000002, lng: 73.80671000000001},
          {lat: 18.572490000000002, lng: 73.80751000000001},
          {lat: 18.57217, lng: 73.80769000000001},
          {lat: 18.571830000000002, lng: 73.80795},
          {lat: 18.571460000000002, lng: 73.80819000000001},
          {lat: 18.570410000000003, lng: 73.80888},
          {lat: 18.56989, lng: 73.80922000000001},
          {lat: 18.56979, lng: 73.80933},
          {lat: 18.56971, lng: 73.80945000000001},
          {lat: 18.569640000000003, lng: 73.80963000000001},
          {lat: 18.56931, lng: 73.81087000000001},
          {lat: 18.56923, lng: 73.81112},
          {lat: 18.569170000000003, lng: 73.81123000000001},
          {lat: 18.569110000000002, lng: 73.8113},
          {lat: 18.568890000000003, lng: 73.81146000000001},
          {lat: 18.56876, lng: 73.81152},
          {lat: 18.56837, lng: 73.81156},
          {lat: 18.56746, lng: 73.81161},
          {lat: 18.567310000000003, lng: 73.81164000000001},
          {lat: 18.56698, lng: 73.81176},
          {lat: 18.566660000000002, lng: 73.81191000000001},
          {lat: 18.56597, lng: 73.81215},
          {lat: 18.5655, lng: 73.81233},
          {lat: 18.56482, lng: 73.81263000000001},
          {lat: 18.563480000000002, lng: 73.81321000000001},
          {lat: 18.5624, lng: 73.81370000000001},
          {lat: 18.56155, lng: 73.81410000000001},
          {lat: 18.560730000000003, lng: 73.81471},
          {lat: 18.560370000000002, lng: 73.81498},
          {lat: 18.55947, lng: 73.81568},
          {lat: 18.55799, lng: 73.8168},
          {lat: 18.5575, lng: 73.81715000000001},
          {lat: 18.556220000000003, lng: 73.81813000000001},
          {lat: 18.555780000000002, lng: 73.81842},
          {lat: 18.55451, lng: 73.81932},
          {lat: 18.55442, lng: 73.81939000000001},
          {lat: 18.55243, lng: 73.82086000000001},
          {lat: 18.55111, lng: 73.82178},
          {lat: 18.549860000000002, lng: 73.82271},
          {lat: 18.54868, lng: 73.82356},
          {lat: 18.54744, lng: 73.82445000000001},
          {lat: 18.54514, lng: 73.82617},
          {lat: 18.54448, lng: 73.82665},
          {lat: 18.544020000000003, lng: 73.82697},
          {lat: 18.5439, lng: 73.82711},
          {lat: 18.54335, lng: 73.82752},
          {lat: 18.54307, lng: 73.82775000000001},
          {lat: 18.54286, lng: 73.82802000000001},
          {lat: 18.54239, lng: 73.82872},
          {lat: 18.542150000000003, lng: 73.82904},
          {lat: 18.54202, lng: 73.82914000000001},
          {lat: 18.541970000000003, lng: 73.82922},
          {lat: 18.54147, lng: 73.83001},
          {lat: 18.541120000000003, lng: 73.83048000000001},
          {lat: 18.54097, lng: 73.83072},
          {lat: 18.54088, lng: 73.83082},
          {lat: 18.54043, lng: 73.83151000000001},
          {lat: 18.53995, lng: 73.83223000000001},
          {lat: 18.53975, lng: 73.83256},
          {lat: 18.53904, lng: 73.83354},
          {lat: 18.538680000000003, lng: 73.83404},
          {lat: 18.53866, lng: 73.83407000000001},
          {lat: 18.53919, lng: 73.83448},
          {lat: 18.53965, lng: 73.83498},
          {lat: 18.539910000000003, lng: 73.83527000000001},
          {lat: 18.54108, lng: 73.83659},
          {lat: 18.54137, lng: 73.83696},
          {lat: 18.54185, lng: 73.83747000000001},
          {lat: 18.542160000000003, lng: 73.83779000000001},
          {lat: 18.542630000000003, lng: 73.8382},
          {lat: 18.54343, lng: 73.83861},
          {lat: 18.543840000000003, lng: 73.83874},
          {lat: 18.54426, lng: 73.83883},
          {lat: 18.544410000000003, lng: 73.83883},
          {lat: 18.54494, lng: 73.83884},
          {lat: 18.544970000000003, lng: 73.84034000000001},
          {lat: 18.544980000000002, lng: 73.84141000000001},
          {lat: 18.54503, lng: 73.84312},
          {lat: 18.54501, lng: 73.8433},
          {lat: 18.54503, lng: 73.8433},
          {lat: 18.54505, lng: 73.84331},
          {lat: 18.545080000000002, lng: 73.84335},
          {lat: 18.545090000000002, lng: 73.8434},
          {lat: 18.545060000000003, lng: 73.84345},
          {lat: 18.54502, lng: 73.84347000000001},
          {lat: 18.54503, lng: 73.84456},
          {lat: 18.54503, lng: 73.84553000000001},
          {lat: 18.54483, lng: 73.84554},
          {lat: 18.54457, lng: 73.84561000000001},
          {lat: 18.54444, lng: 73.84565},
          {lat: 18.544430000000002, lng: 73.84567000000001},
          {lat: 18.54439, lng: 73.84576000000001},
          {lat: 18.54438, lng: 73.84595},
          {lat: 18.54435, lng: 73.8464},
          {lat: 18.544310000000003, lng: 73.84715},
          {lat: 18.54428, lng: 73.84726},
          {lat: 18.54416, lng: 73.84734},
          {lat: 18.54409, lng: 73.84735},
          {lat: 18.543760000000002, lng: 73.84738},
          {lat: 18.54232, lng: 73.84746000000001}, 
          {lat: 18.539330000000003, lng: 73.8476},
          {lat: 18.539270000000002, lng: 73.84762},
          {lat: 18.53835, lng: 73.84765},
          {lat: 18.53816, lng: 73.84764000000001},
          {lat: 18.53788, lng: 73.84767000000001},
          {lat: 18.53769, lng: 73.84777000000001},
          {lat: 18.537550000000003, lng: 73.84783},
          {lat: 18.53743, lng: 73.84784},
          {lat: 18.537190000000002, lng: 73.84783},
          {lat: 18.53698, lng: 73.84784},
          {lat: 18.53685, lng: 73.84787},
          {lat: 18.536710000000003, lng: 73.84789},
          {lat: 18.53667, lng: 73.84786000000001},
          {lat: 18.53657, lng: 73.84785000000001},
          {lat: 18.53619, lng: 73.84789},
          {lat: 18.535970000000002, lng: 73.84794000000001},
          {lat: 18.535890000000002, lng: 73.84799000000001},
          {lat: 18.535770000000003, lng: 73.84816000000001},
          {lat: 18.535700000000002, lng: 73.8485},
          {lat: 18.535600000000002, lng: 73.84858000000001},
          {lat: 18.535490000000003, lng: 73.84866000000001},
          {lat: 18.535300000000003, lng: 73.84873},
          {lat: 18.53499, lng: 73.84876000000001},
          {lat: 18.53477, lng: 73.84886},
          {lat: 18.53366, lng: 73.84904},
          {lat: 18.53293, lng: 73.84921},
          {lat: 18.532860000000003, lng: 73.84924000000001},
          {lat: 18.5328, lng: 73.84929000000001},
          {lat: 18.53161, lng: 73.84976},
          {lat: 18.531460000000003, lng: 73.84988000000001},
          {lat: 18.531450000000003, lng: 73.84993},
          {lat: 18.53143, lng: 73.84996000000001},
          {lat: 18.531390000000002, lng: 73.84999},
          {lat: 18.53134, lng: 73.85000000000001},
          {lat: 18.531270000000003, lng: 73.84996000000001},
          {lat: 18.53116, lng: 73.84986},
          {lat: 18.530640000000002, lng: 73.84986},
          {lat: 18.530520000000003, lng: 73.84984},
          {lat: 18.530320000000003, lng: 73.84984},
          {lat: 18.530240000000003, lng: 73.84993},
          {lat: 18.530170000000002, lng: 73.85014000000001},
          {lat: 18.52999, lng: 73.85065},
          {lat: 18.52993, lng: 73.85088},
          {lat: 18.52984, lng: 73.85129},
          {lat: 18.529870000000003, lng: 73.85144000000001},
          {lat: 18.529510000000002, lng: 73.85282000000001},
          {lat: 18.529500000000002, lng: 73.85285},
          {lat: 18.529420000000002, lng: 73.85284},
          {lat: 18.52936, lng: 73.85278000000001},
          {lat: 18.52933, lng: 73.85272},
          {lat: 18.52935, lng: 73.85256000000001},
          {lat: 18.52926, lng: 73.85256000000001},
          {lat: 18.529020000000003, lng: 73.8525},
          {lat: 18.527820000000002, lng: 73.85164},
          {lat: 18.527540000000002, lng: 73.85142},
          {lat: 18.527410000000003, lng: 73.85145},
          {lat: 18.527340000000002, lng: 73.85151},
          {lat: 18.5273, lng: 73.85157000000001},
          {lat: 18.52684, lng: 73.85236},
          {lat: 18.526040000000002, lng: 73.85316},
          {lat: 18.525630000000003, lng: 73.85339},
          {lat: 18.523660000000003, lng: 73.85427},
          {lat: 18.52233, lng: 73.85483},
          {lat: 18.52167, lng: 73.85512},
          {lat: 18.521430000000002, lng: 73.85529000000001},
          {lat: 18.52117, lng: 73.85537000000001},
          {lat: 18.52093, lng: 73.85547000000001},
          {lat: 18.52071, lng: 73.85568},
          {lat: 18.520210000000002, lng: 73.85609000000001},
          {lat: 18.52007, lng: 73.85617},
          {lat: 18.51986, lng: 73.85617},
          {lat: 18.51923, lng: 73.85622000000001},
          {lat: 18.518620000000002, lng: 73.85626},
          {lat: 18.518240000000002, lng: 73.85626},
          {lat: 18.51742, lng: 73.85626},
          {lat: 18.51688, lng: 73.85624},
          {lat: 18.516340000000003, lng: 73.85625},
          {lat: 18.51566, lng: 73.85629},
          {lat: 18.51517, lng: 73.85635},
          {lat: 18.51479, lng: 73.85663000000001},
          {lat: 18.51474, lng: 73.8567},
          {lat: 18.51436, lng: 73.85696},
          {lat: 18.514190000000003, lng: 73.85705},
          {lat: 18.51407, lng: 73.85708000000001},
          {lat: 18.5138, lng: 73.85722000000001},
          {lat: 18.512710000000002, lng: 73.85761000000001},
          {lat: 18.512030000000003, lng: 73.85784000000001},
          {lat: 18.511680000000002, lng: 73.8579},
          {lat: 18.511380000000003, lng: 73.85791},
          {lat: 18.51077, lng: 73.85793000000001},
          {lat: 18.510450000000002, lng: 73.85795},
          {lat: 18.509580000000003, lng: 73.85798000000001},
          {lat: 18.509140000000002, lng: 73.85802000000001},
          {lat: 18.508680000000002, lng: 73.85806000000001},
          {lat: 18.508390000000002, lng: 73.85806000000001},
          {lat: 18.507530000000003, lng: 73.85807000000001},
          {lat: 18.506770000000003, lng: 73.85808},
          {lat: 18.50666, lng: 73.85808},
          {lat: 18.50655, lng: 73.85812},
          {lat: 18.506320000000002, lng: 73.85826},
          {lat: 18.50615, lng: 73.85839},
          {lat: 18.50598, lng: 73.85853},
          {lat: 18.50589, lng: 73.85859},
          {lat: 18.50552, lng: 73.85872},
          {lat: 18.504890000000003, lng: 73.85889},
          {lat: 18.50427, lng: 73.85908},
          {lat: 18.50411, lng: 73.85908},
          {lat: 18.503960000000003, lng: 73.85908},
          {lat: 18.50391, lng: 73.85959000000001},
          {lat: 18.50385, lng: 73.8602},
          {lat: 18.503780000000003, lng: 73.86091},
          {lat: 18.503770000000003, lng: 73.86126},
          {lat: 18.503690000000002, lng: 73.8613},
          {lat: 18.50364, lng: 73.86134000000001},
          {lat: 18.503600000000002, lng: 73.86141},
          {lat: 18.50357, lng: 73.86144}, 
          {lat: 18.503600000000002, lng: 73.86185},
          {lat: 18.503580000000003, lng: 73.86201000000001},
          {lat: 18.503500000000003, lng: 73.86234},
          {lat: 18.503420000000002, lng: 73.86271},
          {lat: 18.503400000000003, lng: 73.86294000000001},
          {lat: 18.50343, lng: 73.86305},
          {lat: 18.50347, lng: 73.86313000000001},
          {lat: 18.503330000000002, lng: 73.86315},
          {lat: 18.50324, lng: 73.86316000000001},
          {lat: 18.502950000000002, lng: 73.86313000000001},
          {lat: 18.5027, lng: 73.86318},
          {lat: 18.502470000000002, lng: 73.86326000000001},
          {lat: 18.502170000000003, lng: 73.86341},
          {lat: 18.50185, lng: 73.86362000000001}
        ] 
      }, 
    ];
  
    const findMatchingRoute = () => {
      let matchingRoute = null;
  
      predefinedRoutes.forEach((route) => {
        const matchedPoints = routePoints.filter((point) =>
          route.points.some(
            (routePoint) =>
              window.google.maps.geometry.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(point.lat, point.lng),
                new window.google.maps.LatLng(routePoint.lat, routePoint.lng)
              ) <= 100
          )
        );
  
        const percentageMatch = (matchedPoints.length / routePoints.length) * 100;
        if (percentageMatch >= 50) {
          matchingRoute = route.id;
        }
      });
  
      return matchingRoute;
    };

    if (routePoints.length > 0 && isClicked) {
      let customScore = 5 * potholes.length + 
                      10 * spots.length + 
                      5 * complaints.length + 
                      10 * events.length +  
                      3 * nearbyPlaces.length +
                      10 * banquethalls.length + 
                      1 * gardens.length + 
                      1 * hospitals.length +
                      1 * hotels.length +
                      2 * malls.length +
                      1 * parkingbuildings.length +
                      3 * schools.length +
                      10 * diversions.length +
                      10 * constructions.length +
                      9 * trafficStatus.length;

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    if (currentHour >= 22 || currentHour < 8) {
        customScore -= (10 * diversions.length + 10 * constructions.length); 
    }

    if (currentHour >= 0 && currentHour < 8) {
        customScore -= (10 * spots.length +
                        5 * complaints.length +
                        1 * gardens.length +
                        1 * hospitals.length +
                        1 * hotels.length +
                        2 * malls.length +
                        1 * parkingbuildings.length);
              
        if (festival) {
            customScore -= 5; 
        }
    } else if (festival) {
        customScore += 5; 
    }

    let busScore = checkBuses(schools);
    customScore += busScore;

    if (currentDay === 0 || currentDay === 6) { // 0: Sunday, 6: Saturday
        customScore -= 3 * schools.length; 
        customScore -= busScore; 
    }

    // Normalize custom score to a scale of 0 to 100 using logarithmic scaling
    const maxExpectedScore = 300; // Adjust this based on your expected maximum score
    const normalizedCustomScore = (Math.log(customScore + 1) / Math.log(maxExpectedScore + 1)) * 100;

    // Function to get traffic status using Google Maps API
    async function getTrafficStatusUsingJsApi(origin, destination) {
        const directionsService = new google.maps.DirectionsService();
  
        return new Promise((resolve, reject) => {
            directionsService.route(
                {
                    origin: origin,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING,
                    drivingOptions: {
                        departureTime: new Date(), // Use current time for real-time traffic
                        trafficModel: "bestguess",
                    },
                },
                (response, status) => {
                    if (status === "OK") {
                        const leg = response.routes[0].legs[0]; // Get the first route's leg
                        const durationInTraffic = leg.duration_in_traffic.value; // Time in seconds with traffic
                        const normalDuration = leg.duration.value; // Time in seconds without traffic
  
                        // Calculate traffic factor
                        const trafficFactor = durationInTraffic / normalDuration;
  
                        // Determine traffic status
                        if (trafficFactor > 1.9) {
                            resolve("One");
                        } else if (trafficFactor > 1.8) {
                            resolve("Two");
                        }else if (trafficFactor > 1.8) {
                            resolve("Three");
                        } else if (trafficFactor > 1.7) {
                          resolve("Four");
                        } else if (trafficFactor > 1.6) {
                          resolve("Five");
                        } else if (trafficFactor > 1.5) {
                          resolve("Six");
                        }  else if (trafficFactor > 1.4) {
                          resolve("Seven");
                        } else if (trafficFactor > 1.3) {
                          resolve("Eight");
                        } else if (trafficFactor > 1.2) {
                          resolve("Nine");
                        }  
                        else {
                          resolve("Ten");
                        }
                    } else {
                        console.error("Error fetching directions:", status);
                        reject("Traffic data not available");
                    }
                }
            );
        });
    }

    // Usage Example
    (async function () {
        const origin = sourceAddress;
        const destination = destinationAddress; 
  
        try {
            const trafficStatus = await getTrafficStatusUsingJsApi(origin, destination);
            console.log(`Traffic status between ${origin} and ${destination}: ${trafficStatus}`);

            // Assign weights to Google's traffic status
            let googleScore;
            if (trafficStatus === "One") {
                googleScore = 100;
            } else if (trafficStatus === "Two") {
                googleScore = 90;
            } else if (trafficStatus === "Three") {
                googleScore = 80;
            }else if (trafficStatus === "Four") {
                googleScore = 70;
            }else if (trafficStatus === "Five") {
                googleScore = 60;
            }else if (trafficStatus === "Six") {
                googleScore = 50;
            }else if (trafficStatus === "Seven") {
                googleScore = 40;
            }else if (trafficStatus === "Eight") {
                googleScore = 30;
            }else if (trafficStatus === "Nine") {
              googleScore = 20;
            }else {
                googleScore = 10;
            }
            console.log("google score is "+googleScore+" "+"and normalizedCustomScore is "+ normalizedCustomScore);
            
            // Calculate final score with 70% weight for Google's traffic status and 30% for normalized custom score
            const finalScore = (0.7 * googleScore) + (0.3 * normalizedCustomScore);

            // Set the final score
            setTotalScore(finalScore);
        } catch (error) {
            console.error("Error determining traffic status:", error);
        }
    })();
  
  
    
    if(!isSent){
      const matchingRouteId = findMatchingRoute();
      if (matchingRouteId) {
        const timeRange = determineTimeRange(new Date()); 
        const level = totalScore >= 80 ? 'very hard' :
              totalScore >= 60 ? 'hard' :
              totalScore >= 30 ? 'medium' :
              totalScore >= 15 ? 'low' : 'very low';
        const pathInfo = {
            pathId: matchingRouteId,
            timeRange,
            date: new Date(),
            totalScore,
            level,
          };
          // sendPathInfoToBackend(pathInfo);
        }
        setIsSent(true);
      }

      let cat = ['potholes', 'spots', 'complaints', 'nearbyPlaces', 'banquethalls', 'gardens','hospitals','hotels','malls','parkingbuildings','schools','trafficStatus'];
      cat.map((curr)=>{
      createMarkersForGroup(curr);  
    })
  }
}, [potholes, spots, complaints, events, nearbyPlaces, festival, banquethalls, gardens,hospitals,hotels,malls,parkingbuildings,schools,diversions,constructions,routePoints, isClicked]);

  const sendPathInfoToBackend = async (pathInfo) => {
    try {
      const response = await apiRequest.post('/path-info/', pathInfo);
    } catch (error) {
      console.error('Error storing path info:', error);
    }
  };
  
  const determineTimeRange = (currentDate) => {
    const hours = currentDate.getHours();
    const ranges = [
      '00-02',
      '02-04',
      '04-06',
      '06-08',
      '08-10',
      '10-12',
      '12-14',
      '14-16',
      '16-18',
      '18-20',
      '20-22',
      '22-24',
    ];
    return ranges[Math.floor(hours / 2)];
  };

  useEffect(() => {
    const checkForFestivals = async () => {
      const year = new Date().getFullYear();
      const country = 'IN';
      const festivalsData = await fetchFestivals(year, country);
      const today = new Date().toISOString().split('T')[0];
      const festivalToday = await festivalsData.find(festival => festival.date.iso === today);
      setFestival(festivalToday); 
    };
    checkForFestivals();
  }, []);


  const clearMarkerGroup = (groupName) => {

    if (markerGroups[groupName]) {          

      markerGroups[groupName].forEach(marker => {
        if (marker instanceof window.google.maps.Marker) {
          marker.setMap(null);
        } else if (marker instanceof window.google.maps.Polyline) {   
          marker.setMap(null);
        }
      });
      
      // Clear the array
      setMarkerGroups(prev => ({
        ...prev,
        [groupName]: []
      }));
    }
  };


  // Function to clear all markers
  const clearAllMarkers = () => {
    Object.keys(markerGroups).forEach(groupName => {      
      clearMarkerGroup(groupName);
    });
    /*if (sourceMarkerRef.current) {
      sourceMarkerRef.current.setMap(null);
      sourceMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }*/
  };

  const createMarkerIcon = (color, label) => ({
    path: "M12 2C8.134 2 5 5.134 5 9c0 5.525 7 11 7 11s7-5.475 7-11c0-3.866-3.134-7-7-7zm0 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z", // Shield/pin-like shape
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    scale: 1.2, // Adjust size as needed
    anchor: new window.google.maps.Point(12, 22), // Anchor at the tip of the pin
    label: {
      text: label,
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
    }
  });
  


  // Function to create markers for a specific group
  const createMarkersForGroup = (groupName) => {
    const newMarkers = [];
    clearMarkerGroup(groupName);
    
    switch(groupName) {
      case 'potholes':
        potholes.forEach((pothole, index) => {          
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(pothole.latitude), lng: parseFloat(pothole.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#6a0306', 'P'),
            title: `Pothole ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Pothole</strong><br>
                <img src="${pothole.src}" alt="Pothole Image" style="width: 100px; height: auto; margin-top: 5px;">
              </div>`
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
            icon: createMarkerIcon('#007BFF', 'C'),
            title: `Complaint ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Complaint</strong><br>
                <img src="${complaint.src}" alt="Complaint Image" style="width: 100px; height: auto; margin-top: 5px;">
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

        case 'gardens':
        gardens.forEach((garden, index) => {          
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(garden.latitude), lng: parseFloat(garden.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#28A745', 'G'),
            title: `Garden ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Garden</strong><br>
                <p>Name: ${garden.name}</p>
                <p>Capacity: ${garden.capacity}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

        case 'hotels':
        
        hotels.forEach((hotel, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(hotel.latitude), lng: parseFloat(hotel.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#FFC107', 'HO'),
            title: `Hotel ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Hotel</strong><br>
                <p>Name: ${hotel.name}</p>
                <p>Parking Capacity: ${hotel.parkingCapacity}</p>
                <p>Crowd Capacity: ${hotel.crowdCapacity}</p>
              </div>`
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
            position: { lat: spot.location.lat, lng: spot.location.lng },
            map: googleMapRef.current,
            icon: createMarkerIcon('#FD7E14', 'TH'),
            title: `Traffic Hotspot ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Traffic Hotspot</strong><br>
                  <p>Landmark: ${spot.name}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        
        
        break;

        case 'hospitals':
        hospitals.forEach((hospital, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(hospital.latitude), lng: parseFloat(hospital.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#6F42C1', 'HP'),
            title: `Hospital ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Hospital</strong><br>
                <p>Name: ${hospital.name}</p>
                <p>Capacity: ${hospital.capacity}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;


        case 'banquethalls':
        banquethalls.forEach((banquethall, index) => {          
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(banquethall.latitude), lng: parseFloat(banquethall.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#20C997', 'BH'),
            title: `BanquetHall ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Banquet Hall</strong><br>
                <p>Name: ${banquethall.name}</p>
                <p>Event Name: ${banquethall.eventName}</p>
                <p>Parking Limit: ${banquethall.parkingLimit}</p>
                <p>Number Of Vehicles Expected: ${banquethall.numberOfVehiclesExpected}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

        case 'malls':
        malls.forEach((mall, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(mall.latitude), lng: parseFloat(mall.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#E83E8C', 'M'),
            title: `Mall ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Mall</strong><br>
                <p>Name: ${mall.name}</p>
                <p>Parking Capacity: ${mall.parkingCapacity}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

        case 'parkingbuildings':
          parkingbuildings.forEach((parkingbuilding, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(parkingbuilding.latitude), lng: parseFloat(parkingbuilding.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#795548', 'PB'),
            title: `ParkingBuilding ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Parking Building</strong><br>
                <p>Name: ${parkingbuilding.name}</p>
                <p>Capacity: ${parkingbuilding.capacity}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;
        
        case 'nearbyPlaces':
          nearbyPlaces.forEach((nearbyPlace, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(nearbyPlace.latitude), lng: parseFloat(nearbyPlace.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#17A2B8', 'S'),
            title: `School/Clg ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>School/Clg</strong><br>
                <p>Name: ${nearbyPlace.name}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

        case 'schools':
          schools.forEach((school, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(school.latitude), lng: parseFloat(school.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#17A2B8', 'S'),
            title: `School ${index + 1}`,
            animation: google.maps.Animation.BOUNCE
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>School</strong><br>
                <p>Name: ${school.schoolName}</p>
                <p>Number of Buses: ${school.numberOfSchoolBuses}</p>
              </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          newMarkers.push(marker);
        });
        break;

        case 'trafficStatus':
          trafficStatus.forEach((trafficstatus, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(trafficstatus.latitude), lng: parseFloat(trafficstatus.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#FF0000', 'S'),
            title: `Latest Update`,
            animation: google.maps.Animation.BOUNCE
          });
          
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <p>Name: ${trafficstatus.category}</p>
              </div>`
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
          scaledSize: new window.google.maps.Size(35, 35)
        },
        animation:google.maps.Animation.DROP,
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
        animation:google.maps.Animation.DROP,
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
  
    const newMarkers = diversions.map(diversion => {
      const path = diversion.diversionPoints.map(point => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng)
      }));
  
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeOpacity: 0, // Set to 0 to use the dashed pattern
        strokeColor: '#1F509A',
        map: googleMapRef.current,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1', // This creates a dash
              strokeOpacity: 1,
              scale: 5 // Adjust the scale to change dash size
            },
            offset: '0',
            repeat: '18px' // Adjust to change dash spacing
          }
        ]
      });
      let count = 0;
      setInterval(() => {
      count = (count + 1) % 200;

      const icons = polyline.get("icons");
      icons[0].offset = `${count / 2}%`;
      polyline.set("icons", icons);
      }, 20); // Adjust speed as needed
  
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
  
    const newMarkers = constructions.map(construction => {
      const path = construction.constructionPoints.map(point => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng),
      }));
  
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeOpacity: 0, // Set to 0 to use the custom pattern
        strokeColor: '#FF0000',
        map: googleMapRef.current,
        icons: [
          {
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, // Triangle shape
              strokeOpacity: 1,
              scale: 3, // Adjust to set the size of the triangle
              fillColor: '#FF0000', // Triangle fill color
              fillOpacity: 1,
            },
            offset: '0',
            repeat: '15px', // Adjust for spacing between triangles
          },
        ],
      });
      let count = 0;
      setInterval(() => {
      count = (count + 1) % 100;
      const icons = polyline.get("icons");
      icons[0].offset = `${count}%`;
      polyline.set("icons", icons);
      }, 50); // Adjust speed for pulse movement
      // Add an info window for the construction
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${construction.projectName}</h3>
            <p>Type: ${construction.type}</p>
            <p>Vendor: ${construction.vendorName}</p>
            <p>Duration: ${new Date(construction.startDate).toLocaleDateString()} - 
                        ${new Date(construction.expectedEndDate).toLocaleDateString()}</p>
          </div>
        `,
      });
  
      // Add click listener to show info window
      polyline.addListener('click', () => {
        infoWindow.setPosition(new window.google.maps.LatLng(
          construction.constructionPoints[0].lat,
          construction.constructionPoints[0].lng
        ));
        infoWindow.open(googleMapRef.current);
      });
  
      return polyline;
    });
  
    setMarkerGroups(prev => ({
      ...prev,
      constructions: newMarkers,
    }));
  };
  
  const createEventPolylines = () => {
    clearMarkerGroup('events');
  
    const newMarkers = events.map(event => {
      const path = event.eventPoints.map(point => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng)
      }));
  
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#8D0B41',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        strokePattern: [10, 10], 
        map: googleMapRef.current
      });
  
      // Add an info window for the diversion
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${events.category}</h3>
            <p>Crowd: ${events.crowd}</p>
            <p>Vehicle Count: ${events.vehicleCount}</p>
            <p>Duration: ${new Date(events.startTime).toLocaleDateString()} - 
                        ${new Date(events.endTime).toLocaleDateString()}</p>
          </div>
        `
      });
  
      // Add click listener to show info window
      polyline.addListener('click', () => {
        infoWindow.setPosition(new window.google.maps.LatLng(
          event.eventPoints[0].lat,
          event.eventPoints[0].lng
        ));
        infoWindow.open(googleMapRef.current);
      });
  
      return polyline;
    });
  
    setMarkerGroups(prev => ({
      ...prev,
      events: newMarkers
    }));
  };


  useEffect(() => {
      createDiversionPolylines();

      createConstructionPolylines();

      createEventPolylines();

  }, [ diversions, constructions,events]);

  return (
    <div>
      <div className="address-inputs">
        <div>
          <input
            ref={sourceInputRef}
            className="styled-input"
            type="text"
            value={sourceAddress}
            onChange={(e) => {
              setSourceAddress(e.target.value);
              setIsClicked(false);
              setIsSent(false);
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
              setIsClicked(false);
              setIsSent(false);
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
          <div className="legend">
            <h3>Legend</h3>
            <ul>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#6a0306' }}></span>
                Potholes
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#28A745' }}></span>
                Complaints
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#FFC107' }}></span>
                Hotels
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#FD7E14' }}></span>
                Traffic Hotspots
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#6F42C1' }}></span>
                Hospitals
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#20C997' }}></span>
                Banquet Halls
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#E83E8C' }}></span>
                  Malls
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#795548' }}></span>
                  Parking Buildings
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#17A2B8' }}></span>
                  Schools/Clgs
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#17594A' }}></span>
                  Gardens
              </li>
              <li>
                <span className="marker-color" style={{ backgroundColor: '#FF0000' }}></span>
                  Real-time update
              </li>
              <li>
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#8D0B41" strokeWidth="2"/>
                  </svg>
                </span>
                  Events
              </li>
              <li>
                <span className="marker-icon">
                  <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="10,2 15,10 10,18 12,10" fill="#FF0000" />
                  </svg>
                </span>
                  Constructions
              </li>
              <li>
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#2A004E" strokeWidth="2" strokeDasharray="6, 6" />
                  </svg>
                </span>
                  Diversions
              </li>
            </ul>
          </div>
        <div id="googleMap" style={{ height: '495px', width: '80%', border: '2.5px solid black'}}></div>
      </div>

      {/* {routePoints.length > 0 && (
        <div className='message'>
          <button className="btn-map" id="analyze" onClick={() => setShowAnalysis(true)}>
            View Detailed Analysis
          </button>
          <p style={{
            color: totalScore <= 15 
              ? 'green' 
              : totalScore <= 29 
                ? 'lightgreen' 
                : totalScore <= 59 
                  ? 'orange' 
                  : totalScore <= 79 
                    ? 'red' 
                    : 'darkred'
          }}>
            {totalScore <= 15 && "Traffic on the selected route seems to be VERY LOW "}
            {totalScore >= 16 && totalScore <= 29 && "Traffic on the selected route seems to be LOW "}
            {totalScore >= 30 && totalScore <= 59 && "Traffic on the selected route seems to be MEDIUM "}
            {totalScore >= 60 && totalScore <= 79 && "Traffic on the selected route seems to be HIGH "}
            {totalScore >= 80 && "Traffic on the selected route seems to be VERY HIGH "}
            {totalScore}
          </p>
        </div>
      )} */}
      {routePoints.length>0 && 
      (<div className='message'>
          <button className="btn-map" id="analyze" onClick={() => setShowAnalysis(true)}>
            View Detailed Analysis
          </button>
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
              {totalScore <= 15 && "🚦 Traffic on the selected route seems to be VERY LOW "}
              {totalScore >= 16 && totalScore <= 29 && "🟢 Traffic on the selected route seems to be LOW "}
              {totalScore >= 30 && totalScore <= 59 && "🟠 Traffic on the selected route seems to be MEDIUM "}
              {totalScore >= 60 && totalScore <= 79 && "🔴 Traffic on the selected route seems to be HIGH "}
              {totalScore >= 80 && "🚨 Traffic on the selected route seems to be VERY HIGH "}
            </span>


            <span style={{
              fontSize: '16px',
              color: '#555',
              animation: 'fadeIn 1s',
            }}>
              Traffic Score: {Math.ceil(totalScore)}
            </span>
          </p>
    </div>)}

      <div className='detailed'>
        
      {analysis && (
        <>
        <div className="reason-container">
          <h2>Probable Traffic Reasons:</h2>
          {diversions.length > 0 && (
              <p id="feature">
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#2A004E" strokeWidth="2" strokeDasharray="6, 6" />
                  </svg>
                </span>
                Diversions - {diversions.length}
              </p>
            )}
            {constructions.length > 0 && (
              <p id="feature">
                <span className="marker-icon">
                  <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="10,2 15,10 10,18 12,10" fill="#FF0000" />
                  </svg>
                </span>
                Constructions - {constructions.length}
              </p>
            )}   
            {potholes.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#6a0306' }}></span>
                Potholes - {potholes.length}
              </p>
            )}
            {complaints.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#28A745' }}></span>
                Complaints - {complaints.length}
              </p>
            )}
            {events.length > 0 && (
              <p id="feature">
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#FF0000" strokeWidth="2"/>
                  </svg>
                </span>
                Events - {events.length}
              </p>
            )}
            {trafficStatus.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#FF0000' }}></span>
                Real-time updates - {trafficStatus.length}
              </p>
            )} 
            {nearbyPlaces.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#17A2B8' }}></span>
                Schools/Colleges - {nearbyPlaces.length}
              </p>
            )}
            {spots.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#FD7E14' }}></span>
                Traffic Hotspots - {spots.length}
              </p>
            )}

            {banquethalls.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#20C997' }}></span>
                Banquet Halls - {banquethalls.length}
              </p>
            )}

            {gardens.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#17594A' }}></span>
                Gardens - {gardens.length}
              </p>
            )}

            {hospitals.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#6F42C1' }}></span>
                Hospitals - {hospitals.length}
              </p>
            )}

            {hotels.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#FFC107' }}></span>
                Hotels - {hotels.length}
              </p>
            )}

            {malls.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#E83E8C' }}></span>
                Malls - {malls.length}
              </p>
            )}

            {parkingbuildings.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#795548' }}></span>
                Parking Buildings - {parkingbuildings.length}
              </p>
            )}

            {schools.length > 0 && (
              <p id="feature">
                <span className="marker-color" style={{ backgroundColor: '#17A2B8' }}></span>
                Schools - {schools.length}
              </p>
            )}
        </div>
        </>
      )}
      </div>
    </div>
  );
};

export default MapRouting;