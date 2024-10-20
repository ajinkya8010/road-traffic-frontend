import React, { useEffect, useState } from 'react';
import './complaintDisplay.css';
import ComplaintCard from '../../components/complaintCard/complaintCard';
import apiRequest from "../../lib/apiRequest";

const ComplaintDisplay = () => {
  const [complaints, setComplaints] = useState([]);

  const fetchComplaints = async () => {
    try {
      const response = await apiRequest.get("/complaint/getComplaintData");
      const data = response.data;

        // Fetch the place names for each complaint
      const complaintsWithPlaceNames = await Promise.all(
        data.map(async (complaint) => {
          const placeName = await getPlaceName(complaint.latitude, complaint.longitude);
          return { ...complaint, placeName };
        })
      );
      setComplaints(complaintsWithPlaceNames);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const getPlaceName = async (latitude, longitude) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
        console.log(data);
      const { neighbourhood, village,road, city, postcode } = data.address;
      let placeDetails = '';
  
      // Create a string with the relevant place details if they exist
      if (neighbourhood) placeDetails += `${neighbourhood}, `;
      if (village) placeDetails += `${village}, `;
      if (road) placeDetails+=`${road}, `;
      if (city) placeDetails += `${city}, `;
      if (postcode) placeDetails += `${postcode}`;
  
      // Remove the trailing comma and space if present
      placeDetails = placeDetails.trim().replace(/,\s*$/, '');
      return placeDetails || 'Unknown location';
    } catch (error) {
      console.error('Error fetching place name:', error);
      return 'Unknown location';
    }
  };


  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolved = (id) => {
    console.log(`Complaint ${id} resolved`);
  };

  return (
    <div className="complaint-display">
      {complaints.length > 0 ? (
        <div className="complaint-grid">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              imageSrc={complaint.src}
              longitude={complaint.longitude}
              latitude={complaint.latitude}
              placeName={complaint.placeName}
              category={complaint.category}
              onResolved={() => handleResolved(complaint._id)}
            />
          ))}
        </div>
      ) : (
        <p>No complaints found.</p>
      )}
    </div>
  );
};

export default ComplaintDisplay;
