import React, { useEffect, useState } from 'react';
import './userDisplay.css';
import apiRequest from "../../lib/apiRequest";

const UserDisplay = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await apiRequest.get("/user/");
      const data = response.data;
      const filteredUsers = data.filter(user => user.role !== 'admin');
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleMakeAdmin = async (id) => {
    const confirmAdmin = window.confirm("Are you sure you want to make this user an admin?");
    
    if (confirmAdmin) {
        try {
            const response = await apiRequest.put(`/user/${id}/make-admin`);
            alert(response.data.message);
            fetchUsers(); // Refresh the user list after making the change
        } catch (error) {
            console.error("Error making user admin:", error);
            alert("Failed to make user admin.");
        }
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-display">
      <input
        type="text"
        placeholder="Search users by username or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
      {filteredUsers.length > 0 ? (
        <div className="user-grid">
          {filteredUsers.map((user) => (
            <div key={user._id} className="user-card">
              <h3>{user.username}</h3>
              <p>Email: {user.email}</p>
              <button className="make-admin-button" onClick={() => handleMakeAdmin(user._id)}>Make Admin</button>
            </div>
          ))}
        </div>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
};

export default UserDisplay;
