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
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
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
