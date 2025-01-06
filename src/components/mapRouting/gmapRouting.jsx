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
  const [festival, setFestival] = useState(null);
  const [isClicked, setIsClicked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [analysis, setShowAnalysis] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  
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
    constructions:[]
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

   const predefinedRoutes = [
      { id: 'Katraj-Kondhwa', 
        points: [      
          {lat: 18.452930000000002, lng: 73.86523000000001},
          {lat: 18.453020000000002, lng: 73.86439}, 
          {lat: 18.453000000000003, lng: 73.86425000000001},
          {lat: 18.45297, lng: 73.86421},
          {lat: 18.45229, lng: 73.8639}, 
          {lat: 18.45174, lng: 73.86366000000001},
          {lat: 18.451220000000003, lng: 73.86348000000001},
          {lat: 18.451060000000002, lng: 73.86341},
          {lat: 18.45063, lng: 73.86317000000001},
          {lat: 18.45033, lng: 73.86303000000001},
          {lat: 18.45013, lng: 73.86299000000001},
          {lat: 18.44986, lng: 73.86297},
          {lat: 18.44976, lng: 73.86298000000001},
          {lat: 18.449460000000002, lng: 73.86303000000001},
          {lat: 18.44909, lng: 73.86328},
          {lat: 18.44885, lng: 73.86342},
          {lat: 18.448610000000002, lng: 73.86366000000001},
          {lat: 18.448590000000003, lng: 73.86409},
          {lat: 18.448620000000002, lng: 73.86447000000001},
          {lat: 18.448590000000003, lng: 73.8648},
          {lat: 18.44853, lng: 73.86505000000001},
          {lat: 18.448510000000002, lng: 73.86513000000001},
          {lat: 18.44848, lng: 73.86537000000001},
          {lat: 18.44846, lng: 73.86617000000001},
          {lat: 18.44835, lng: 73.86684000000001},
          {lat: 18.44827, lng: 73.86732},
          {lat: 18.44828, lng: 73.8675},
          {lat: 18.448300000000003, lng: 73.86767},
          {lat: 18.448320000000002, lng: 73.86784},
          {lat: 18.448400000000003, lng: 73.86828000000001},
          {lat: 18.448510000000002, lng: 73.86865},
          {lat: 18.448590000000003, lng: 73.86878}, 
          {lat: 18.448780000000003, lng: 73.86928},
          {lat: 18.44883, lng: 73.86941},
          {lat: 18.448970000000003, lng: 73.86971000000001},
          {lat: 18.44911, lng: 73.87006000000001},
          {lat: 18.449350000000003, lng: 73.87052},
          {lat: 18.44961, lng: 73.8712},
          {lat: 18.44969, lng: 73.87149000000001},
          {lat: 18.449730000000002, lng: 73.87168000000001},
          {lat: 18.449730000000002, lng: 73.87195000000001},
          {lat: 18.44969, lng: 73.87271000000001},
          {lat: 18.449620000000003, lng: 73.87334000000001},
          {lat: 18.449630000000003, lng: 73.87360000000001},
          {lat: 18.449650000000002, lng: 73.87382000000001},
          {lat: 18.449740000000002, lng: 73.87414000000001},
          {lat: 18.44977, lng: 73.87433},
          {lat: 18.44977, lng: 73.87442},
          {lat: 18.449820000000003, lng: 73.87480000000001},
          {lat: 18.44997, lng: 73.87568},
          {lat: 18.45017, lng: 73.87602000000001},
          {lat: 18.45031, lng: 73.87638000000001},
          {lat: 18.45043, lng: 73.87692000000001},
          {lat: 18.4506, lng: 73.87759000000001},
          {lat: 18.45069, lng: 73.87801},
          {lat: 18.45072, lng: 73.87822000000001},
          {lat: 18.4508, lng: 73.87895},
          {lat: 18.450850000000003, lng: 73.87935},
          {lat: 18.450850000000003, lng: 73.87955000000001},
          {lat: 18.45079, lng: 73.87968000000001},
          {lat: 18.45078, lng: 73.87977000000001},
          {lat: 18.451220000000003, lng: 73.88095000000001},
          {lat: 18.45153, lng: 73.88149},
          {lat: 18.45172, lng: 73.88183000000001},
          {lat: 18.45192, lng: 73.88225},
          {lat: 18.452180000000002, lng: 73.8828},
          {lat: 18.45231, lng: 73.88302},
          {lat: 18.45269, lng: 73.88344000000001},
          {lat: 18.452840000000002, lng: 73.88366},
          {lat: 18.45296, lng: 73.88386000000001},
          {lat: 18.453190000000003, lng: 73.88424},
          {lat: 18.453470000000003, lng: 73.88461000000001},
          {lat: 18.453770000000002, lng: 73.88504},
          {lat: 18.45383, lng: 73.88517},
          {lat: 18.453870000000002, lng: 73.88545},
          {lat: 18.453870000000002, lng: 73.8857},
          {lat: 18.4539, lng: 73.88614000000001},
          {lat: 18.453870000000002, lng: 73.88646},
          {lat: 18.45388, lng: 73.88679},
          {lat: 18.45389, lng: 73.88687},
          {lat: 18.45391, lng: 73.88717000000001},
          {lat: 18.45388, lng: 73.88733},
          {lat: 18.45371, lng: 73.88779000000001},
          {lat: 18.453580000000002, lng: 73.88822},
          {lat: 18.45342, lng: 73.88864000000001},
          {lat: 18.453020000000002, lng: 73.88913000000001},
          {lat: 18.452830000000002, lng: 73.88932000000001},
          {lat: 18.45278, lng: 73.88941000000001},
          {lat: 18.452720000000003, lng: 73.88952},
          {lat: 18.452650000000002, lng: 73.88972000000001},
          {lat: 18.452550000000002, lng: 73.89026000000001},
          {lat: 18.45242, lng: 73.89065000000001},
          {lat: 18.452370000000002, lng: 73.89077},
          {lat: 18.45238, lng: 73.89081},
          {lat: 18.45239, lng: 73.89088000000001},
          {lat: 18.452450000000002, lng: 73.891},
          {lat: 18.45252, lng: 73.89105},
          {lat: 18.452550000000002, lng: 73.89107},
          {lat: 18.452640000000002, lng: 73.89106000000001},
          {lat: 18.452910000000003, lng: 73.89101000000001},
          {lat: 18.453090000000003, lng: 73.89094},
          {lat: 18.45334, lng: 73.89087},
          {lat: 18.45372, lng: 73.89075000000001},
          {lat: 18.453950000000003, lng: 73.89069},
          {lat: 18.45407, lng: 73.89070000000001},
          {lat: 18.454240000000002, lng: 73.89070000000001},
          {lat: 18.45615, lng: 73.89073},
          {lat: 18.457, lng: 73.89079000000001},
          {lat: 18.457500000000003, lng: 73.89079000000001},
          {lat: 18.45829, lng: 73.89079000000001},
          {lat: 18.459400000000002, lng: 73.89082},
          {lat: 18.459670000000003, lng: 73.89080000000001},
          {lat: 18.460160000000002, lng: 73.89071000000001},
          {lat: 18.46113, lng: 73.89049},
          {lat: 18.46129, lng: 73.89045},
          {lat: 18.46151, lng: 73.89037},
          {lat: 18.461650000000002, lng: 73.89030000000001},
          {lat: 18.462010000000003, lng: 73.89014},
          {lat: 18.462220000000002, lng: 73.89009},
          {lat: 18.46235, lng: 73.89005},
          {lat: 18.46262, lng: 73.88988},
          {lat: 18.46312, lng: 73.88948},
          {lat: 18.463140000000003, lng: 73.88947},
          {lat: 18.463330000000003, lng: 73.88950000000001},
          {lat: 18.463820000000002, lng: 73.88962000000001},
          {lat: 18.46422, lng: 73.88975},
          {lat: 18.46443, lng: 73.88976000000001},
          {lat: 18.465880000000002, lng: 73.88943},
          {lat: 18.46669, lng: 73.88929}, 
          {lat: 18.46674, lng: 73.88931000000001},
          {lat: 18.46714, lng: 73.88923000000001},
          {lat: 18.46731, lng: 73.88918000000001},
          {lat: 18.467460000000003, lng: 73.88913000000001},
          {lat: 18.467670000000002, lng: 73.8891},
          {lat: 18.46778, lng: 73.88909000000001},
          {lat: 18.46796, lng: 73.88902},
          {lat: 18.46899, lng: 73.88895000000001},
          {lat: 18.46929, lng: 73.88897},
          {lat: 18.46947, lng: 73.88895000000001},
          {lat: 18.46947, lng: 73.88898}
        ] 
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
      { id: 'Kothrud-Shivajinagar', 
        points: [
          {lat: 18.53028, lng: 73.84988000000001}, 
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
          {lat: 18.527150000000002, lng: 73.85102},
          {lat: 18.52643, lng: 73.85052},
          {lat: 18.52501, lng: 73.84960000000001},
          {lat: 18.523850000000003, lng: 73.84883},
          {lat: 18.523390000000003, lng: 73.84854},
          {lat: 18.52276, lng: 73.84809},
          {lat: 18.52229, lng: 73.84771},
          {lat: 18.521160000000002, lng: 73.84675},
          {lat: 18.52014, lng: 73.84592}, 
          {lat: 18.519000000000002, lng: 73.84493},
          {lat: 18.51838, lng: 73.84442},
          {lat: 18.51706, lng: 73.84325000000001},
          {lat: 18.51622, lng: 73.8426},
          {lat: 18.51593, lng: 73.84240000000001}, 
          {lat: 18.515690000000003, lng: 73.84228}, 
          {lat: 18.51554, lng: 73.84223},
          {lat: 18.51549, lng: 73.84223},
          {lat: 18.514930000000003, lng: 73.84237},
          {lat: 18.51453, lng: 73.84247},
          {lat: 18.51441, lng: 73.84227},
          {lat: 18.514020000000002, lng: 73.84183},
          {lat: 18.513460000000002, lng: 73.84124},
          {lat: 18.51333, lng: 73.84104},
          {lat: 18.51319, lng: 73.84079000000001},
          {lat: 18.512880000000003, lng: 73.84004},
          {lat: 18.512600000000003, lng: 73.83934},
          {lat: 18.512310000000003, lng: 73.83873000000001},
          {lat: 18.512050000000002, lng: 73.83824},
          {lat: 18.51104, lng: 73.83619},
          {lat: 18.51068, lng: 73.83546000000001},
          {lat: 18.5104, lng: 73.83476},
          {lat: 18.51004, lng: 73.83412000000001},
          {lat: 18.509900000000002, lng: 73.83384000000001},
          {lat: 18.509890000000002, lng: 73.83378},
          {lat: 18.50985, lng: 73.83368},
          {lat: 18.50967, lng: 73.83332},
          {lat: 18.509410000000003, lng: 73.83282000000001},
          {lat: 18.50907, lng: 73.83218000000001},
          {lat: 18.508370000000003, lng: 73.83082},
          {lat: 18.50785, lng: 73.82983},
          {lat: 18.50748, lng: 73.82911},
          {lat: 18.50739, lng: 73.82893},
          {lat: 18.507330000000003, lng: 73.82887000000001},
          {lat: 18.50691, lng: 73.82802000000001},
          {lat: 18.506800000000002, lng: 73.8276},
          {lat: 18.506590000000003, lng: 73.82713000000001},
          {lat: 18.50628, lng: 73.82652},
          {lat: 18.506040000000002, lng: 73.82589},
          {lat: 18.505940000000002, lng: 73.82555},
          {lat: 18.505920000000003, lng: 73.82536},
          {lat: 18.505940000000002, lng: 73.82509},
          {lat: 18.50601, lng: 73.82481},
          {lat: 18.50608, lng: 73.82467000000001},
          {lat: 18.50618, lng: 73.8245},
          {lat: 18.50647, lng: 73.82418000000001},
          {lat: 18.506700000000002, lng: 73.82396},
          {lat: 18.50803, lng: 73.82281},
          {lat: 18.50898, lng: 73.82193000000001},
          {lat: 18.50966, lng: 73.82132},
          {lat: 18.510080000000002, lng: 73.82084},
          {lat: 18.510250000000003, lng: 73.82053},
          {lat: 18.51031, lng: 73.82035},
          {lat: 18.51039, lng: 73.82002},
          {lat: 18.510430000000003, lng: 73.81936},
          {lat: 18.51042, lng: 73.81896},
          {lat: 18.51038, lng: 73.81838},
          {lat: 18.51028, lng: 73.81753},
          {lat: 18.510080000000002, lng: 73.81674000000001},
          {lat: 18.50975, lng: 73.81528},
          {lat: 18.50956, lng: 73.8144},
          {lat: 18.50953, lng: 73.81424000000001},
          {lat: 18.50945, lng: 73.81339000000001},
          {lat: 18.509400000000003, lng: 73.81226000000001},
          {lat: 18.509300000000003, lng: 73.81184},
          {lat: 18.5092, lng: 73.81157},
          {lat: 18.50908, lng: 73.81135},
          {lat: 18.5087, lng: 73.81087000000001},
          {lat: 18.5085, lng: 73.81066000000001},
          {lat: 18.508370000000003, lng: 73.81045},
          {lat: 18.50831, lng: 73.81031},
          {lat: 18.508280000000003, lng: 73.81012000000001},
          {lat: 18.508210000000002, lng: 73.80968},
          {lat: 18.50815, lng: 73.80938},
          {lat: 18.508090000000003, lng: 73.8092},
          {lat: 18.50769, lng: 73.80843},
          {lat: 18.507440000000003, lng: 73.80791}, 
          {lat: 18.507360000000002, lng: 73.80765000000001}
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
              ) <= 100 // 100 meters threshold
          )
        );
  
        const percentageMatch = (matchedPoints.length / routePoints.length) * 100;
        if (percentageMatch >= 50) {
          console.log("Route matched");
          matchingRoute = route.id; // Capture the matching route ID
        }
      });
  
      return matchingRoute;
    };

    if (routePoints.length > 0 && isClicked) {
      let score = 5 * potholes.length + 
                  10 * spots.length + 
                  5 * complaints.length + 
                  10 * events.length +  
                  3 * nearbyPlaces.length+
                  10*banquethalls.length+ 
                  1*gardens.length + 
                  1*hospitals.length+
                  1*hotels.length+
                  2*malls.length+
                  1*parkingbuildings.length+
                  3*schools.length+
                  10*diversions.length+ -
                  10*constructions.length; 

      if (festival) {
        score += 5;
      }

      score+=checkBuses(schools);
      
    setTotalScore(score);
    if(!isSent){
      const matchingRouteId = findMatchingRoute();
      if (matchingRouteId) {
        const timeRange = determineTimeRange(new Date()); // Define this function based on your time range logic
        const level = score > 50 ? 'high' : score > 20 ? 'medium' : 'low'; // Example level calculation
        const pathInfo = {
          pathId: matchingRouteId,
          timeRange,
          date: new Date(),
          score,
          level,
        };
        sendPathInfoToBackend(pathInfo);
      }
      setIsSent(true);
    }

    let cat = ['potholes', 'spots', 'complaints', 'nearbyPlaces', 'festival', 'banquethalls', 'gardens','hospitals','hotels','malls','parkingbuildings','schools'];
    cat.map((curr)=>{
      createMarkersForGroup(curr);
    })

  }
}, [potholes, spots, complaints, events, nearbyPlaces, festival, banquethalls, gardens,hospitals,hotels,malls,parkingbuildings,schools,diversions,constructions,routePoints, isClicked]);

  const sendPathInfoToBackend = async (pathInfo) => {
    try {
      const response = await apiRequest.post('/path-info/', pathInfo);
      console.log('Path info stored successfully:', response.data);
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
      const festivalToday = festivalsData.find(festival => festival.date.iso === today);
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
            icon: createMarkerIcon('#FF0000', 'P'),
            title: `Pothole ${index + 1}`
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
            title: `Complaint ${index + 1}`
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
            title: `Garden ${index + 1}`
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
            title: `Hotel ${index + 1}`
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
            position: { lat: parseFloat(spot.latitude), lng: parseFloat(spot.longitude) },
            map: googleMapRef.current,
            icon: createMarkerIcon('#FD7E14', 'TH'),
            title: `Traffic Hotspot ${index + 1}`
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Traffic Hotspot</strong><br>
                  <p>Landmark: ${spot.landmark}</p>
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
            title: `Hospital ${index + 1}`
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
            title: `BanquetHall ${index + 1}`
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
            title: `Mall ${index + 1}`
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
            title: `ParkingBuilding ${index + 1}`
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
            title: `School/Clg ${index + 1}`
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
            title: `School ${index + 1}`
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
        strokeColor: '#2A004E',
        map: googleMapRef.current,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1', // This creates a dash
              strokeOpacity: 1,
              scale: 4 // Adjust the scale to change dash size
            },
            offset: '0',
            repeat: '13px' // Adjust to change dash spacing
          }
        ]
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
  
      // Add an info window for the construction
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${construction.projectName}</h3>
            <p>Type: ${construction.type}</p>
            <p>Vendor: ${construction.vendorName}</p>
            <p>Duration: ${new Date(construction.startDate).toLocaleDateString()} - 
                        ${new Date(construction.endDate).toLocaleDateString()}</p>
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
        strokeColor: '#FF0000',
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
          <label>Source </label>
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
          <label>Destination </label>
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
                <span className="marker-color" style={{ backgroundColor: '#FF0000' }}></span>
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
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#FF0000" strokeWidth="2"/>
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
        <div id="googleMap" style={{ height: '460px', width: '80%', border: '2.5px solid black'}}></div>
      </div>

      {routePoints.length > 0 && (
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
      )}

      {/* {analysis && (
        <div className="reason-container">
          <h2>Probable Traffic Reasons:</h2>
          {potholes.length > 0 && <p>Number of Potholes on the route: {potholes.length}</p>}
          {complaints.length > 0 && <p>Number of Complaints registered on the route: {complaints.length}</p>}
          {events.length > 0 && <p>Number of Events registered on the route: {events.length}</p>}
          {nearbyPlaces.length > 0 && <p>Number of Schools & College with opening & closing time soon: {nearbyPlaces.length}</p>}
          {spots.length > 0 && <p>Number of Traffic Hotspots according recent Data by PMC: {spots.length}</p>}
          {banquethalls.length > 0 && <p>Number of banquethall registered on the route: {banquethalls.length}</p>}
          {gardens.length > 0 && <p>Number of gardens registered on the route: {gardens.length}</p>}
          {hospitals.length > 0 && <p>Number of hospitals registered on the route: {hospitals.length}</p>}
          {hotels.length > 0 && <p>Number of hotels registered on the route: {hotels.length}</p>}
          {malls.length > 0 && <p>Number of malls registered on the route: {malls.length}</p>}
          {parkingbuildings.length > 0 && <p>Number of parkingBuilding on the route: {parkingbuildings.length}</p>}
          {schools.length > 0 && <p>Number of Schools/clg/uni on the route opening/closing soon: {schools.length}</p>}
          {diversions.length > 0 && <p>Number of Diversions on the route: {diversions.length}</p>}
          {constructions.length > 0 && <p>Number of contructions on the route: {constructions.length}</p>}
          {festival && <p>Festival today: {festival.name}</p>}
        </div>
      )} */}

      {analysis && (
        <div className="reason-container">
          <h2>Probable Traffic Reasons:</h2>
          <ul>
            {potholes.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#FF0000' }}></span>
                Potholes - {potholes.length}
              </p>
            )}
            {complaints.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#28A745' }}></span>
                Complaints - {complaints.length}
              </p>
            )}
            {events.length > 0 && (
              <p>
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#FF0000" strokeWidth="2"/>
                  </svg>
                </span>
                Events - {events.length}
              </p>
            )}
            {nearbyPlaces.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#17A2B8' }}></span>
                Schools/Colleges - {nearbyPlaces.length}
              </p>
            )}
            {spots.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#FD7E14' }}></span>
                Traffic Hotspots - {spots.length}
              </p>
            )}

            {banquethalls.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#20C997' }}></span>
                Banquet Halls - {banquethalls.length}
              </p>
            )}

            {gardens.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#17594A' }}></span>
                Gardens - {gardens.length}
              </p>
            )}

            {hospitals.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#6F42C1' }}></span>
                Hospitals - {hospitals.length}
              </p>
            )}

            {hotels.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#FFC107' }}></span>
                Hotels - {hotels.length}
              </p>
            )}

            {malls.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#E83E8C' }}></span>
                Malls - {malls.length}
              </p>
            )}

            {parkingbuildings.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#795548' }}></span>
                Parking Buildings - {parkingbuildings.length}
              </p>
            )}

            {schools.length > 0 && (
              <p>
                <span className="marker-color" style={{ backgroundColor: '#17A2B8' }}></span>
                Schools - {schools.length}
              </p>
            )}

            {diversions.length > 0 && (
              <p>
                <span className="marker-icon">
                  <svg width="20" height="20">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#2A004E" strokeWidth="2" strokeDasharray="6, 6" />
                  </svg>
                </span>
                Diversions - {diversions.length}
              </p>
            )}
            {constructions.length > 0 && (
              <p>
                <span className="marker-icon">
                  <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="10,2 15,10 10,18 12,10" fill="#FF0000" />
                  </svg>
                </span>
                Constructions - {constructions.length}
              </p>
            )}
          </ul>
        </div>
      )}

    </div>
  );
};

export default MapRouting;