
import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';

const metroConstructionRoutes = [
  {
    // Purple Line (Line 1) - PCMC to Swargate
    name: "Purple Line - Under Construction Sections",
    sections: [
      {
        id: "purple_1",
        status: "under_construction",
        coordinates: [
          { lat: 18.5089, lng: 73.8556 }, // Civil Court
          { lat: 18.5016, lng: 73.8594 }, // Budhwar Peth 
          { lat: 18.4957, lng: 73.8647 }, // Mandai
          { lat: 18.4850, lng: 73.8552 }  // Swargate
        ],
        details: {
          length: "3.2 km",
          stations: ["Civil Court", "Budhwar Peth", "Mandai", "Swargate"],
          expectedCompletion: "March 2025"
        }
      }
    ]
  },
  {
    // Aqua Line (Line 2) - Vanaz to Ramwadi
    name: "Aqua Line - Under Construction Sections",
    sections: [
      {
        id: "aqua_1",
        status: "under_construction",
        coordinates: [
          { lat: 18.5182, lng: 73.8977 }, // Bund Garden
          { lat: 18.5196, lng: 73.9073 }, // Yerawada
          { lat: 18.5230, lng: 73.9154 }, // Kalyaninagar
          { lat: 18.5248, lng: 73.9276 }  // Ramwadi
        ],
        details: {
          length: "2.8 km",
          stations: ["Bund Garden", "Yerawada", "Kalyaninagar", "Ramwadi"],
          expectedCompletion: "February 2025"
        }
      }
    ]
  },
  {
    // Line 3 - Hinjewadi to Shivajinagar
    name: "Line 3 - Under Construction",
    sections: [
      {
        id: "line3_1",
        status: "under_construction",
        coordinates: [
          { lat: 18.5947, lng: 73.7372 }, // Hinjewadi Phase 3
          { lat: 18.5892, lng: 73.7420 }, // Hinjewadi Phase 2
          { lat: 18.5836, lng: 73.7515 }, // Hinjewadi Phase 1
          { lat: 18.5774, lng: 73.7691 }, // Mann
          { lat: 18.5712, lng: 73.7810 }, // Balewadi Stadium
          { lat: 18.5534, lng: 73.8107 }, // Wakad
          { lat: 18.5397, lng: 73.8274 }, // Baner
          { lat: 18.5312, lng: 73.8382 }  // Shivajinagar
        ],
        details: {
          length: "23.3 km",
          stations: [
            "Hinjewadi Phase 3",
            "Hinjewadi Phase 2",
            "Hinjewadi Phase 1",
            "Mann",
            "Balewadi Stadium",
            "Wakad",
            "Baner",
            "Shivajinagar"
          ],
          expectedCompletion: "June 2025"
        }
      }
    ]
  }
];


// Helper function to check if a specific metro section intersects with the route
const doesSectionIntersectRoute = (section, routePoints) => {
  if (!routePoints || routePoints.length === 0) return false;
  
  const BUFFER_DISTANCE = 100; // meters

  for (let i = 0; i < section.coordinates.length - 1; i++) {
    const metroSegmentStart = L.latLng(section.coordinates[i]);
    const metroSegmentEnd = L.latLng(section.coordinates[i + 1]);

    // Check each route point against this metro segment
    for (const routePoint of routePoints) {
      const bounds = L.latLngBounds([metroSegmentStart, metroSegmentEnd]).pad(0.001);
      if (bounds.contains(routePoint)) {
        return true;
      }
    }
  }
  return false;
};

// Component to render intersecting metro lines only
const MetroLines = ({ showMetro, routePoints }) => {
  if (!showMetro || !routePoints || routePoints.length === 0) return null;

  return (
    <>
      {metroConstructionRoutes.map((line) => (
        line.sections.map((section) => {
          // Only render if this section intersects with the route
          if (doesSectionIntersectRoute(section, routePoints)) {
            return (
              <Polyline
                key={section.id}
                positions={section.coordinates}
                pathOptions={{
                  color: line.name.includes('Purple') ? '#800080' : 
                         line.name.includes('Aqua') ? '#00FFFF' : '#FF4500',
                  weight: 4,
                  opacity: 0.7,
                  dashArray: '10, 10'
                }}
              >
                <Tooltip permanent>
                  {line.name}<br/>
                  Expected Completion: {section.details.expectedCompletion}
                </Tooltip>
              </Polyline>
            );
          }
          return null;
        })
      ))}
    </>
  );
};

// Function to check if any metro line intersects with the route
const checkMetroIntersection = (routePoints) => {
  if (!routePoints || routePoints.length === 0) return false;

  for (const metroLine of metroConstructionRoutes) {
    for (const section of metroLine.sections) {
      if (doesSectionIntersectRoute(section, routePoints)) {
        return true;
      }
    }
  }
  return false;
};

export { MetroLines, checkMetroIntersection };