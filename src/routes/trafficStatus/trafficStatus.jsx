import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrafficStatus.css';
import apiRequest from '../../lib/apiRequest';

const TrafficStatus = () => {
  const [categories, setCategories] = useState(['Garden', 'Hotel', 'Mall']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [names, setNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [status, setStatus] = useState('low');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch names based on selected category
  useEffect(() => {
    if (selectedCategory) {
      let smallCategory = selectedCategory.toLowerCase();
      setIsLoading(true);
      apiRequest
        .get(`/${smallCategory}/get`)  // Adjusted to pass category
        .then((response) => {
          // Assuming the response contains an array of objects with a 'name' property
          const namesList = response.data.map(item => item.name);  // Extracting names from the objects
          setNames(namesList); // Set the names for the dropdown
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching traffic status:', error);
          setIsLoading(false);
        });
    }
  }, [selectedCategory]);
  

  const handleUpdate = () => {
    if (!selectedName) {
      alert('Please select a name.');
      return;
    }

    apiRequest
      .post('/traffic-status/', { name: selectedName, status })
      .then((response) => {
        alert('Traffic status updated successfully!');
      })
      .catch((error) => {
        console.error('Error updating traffic status:', error);
      });
  };

  return (
    <div className="traffic-status-container">
      <h2>Traffic Status Update</h2>
      
      {/* Category Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="category">Select Category:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">--Select--</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Names Dropdown */}
      {selectedCategory && (
  <div className="dropdown-container">
    <label htmlFor="name">Select Name:</label>
    <select
      id="name"
      value={selectedName}
      onChange={(e) => setSelectedName(e.target.value)}
    >
      <option value="">--Select--</option>
      {isLoading ? (
        <option>Loading...</option>
      ) : (
        names.map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))
      )}
    </select>
  </div>
)}


      {/* Status Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="status">Select Status:</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* Update Button */}
      <button className="update-button" onClick={handleUpdate}>
        Update
      </button>
    </div>
  );
};

export default TrafficStatus;
