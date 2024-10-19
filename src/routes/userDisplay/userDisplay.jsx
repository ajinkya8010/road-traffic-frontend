import React, { useEffect, useState } from 'react';
import './userDisplay.css';
import apiRequest from "../../lib/apiRequest";

const UserDisplay = () => {
  const [users, setUsers] = useState([]);

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

  const handleMakeAdmin = (id) => {
    console.log(`User ${id} made admin`);

  };

  return (
    <div className="user-display">
      {users.length > 0 ? (
        <div className="user-grid">
          {users.map((user) => (
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
