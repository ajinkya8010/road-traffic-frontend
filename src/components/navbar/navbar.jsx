import { useState, useContext } from "react";
import "./navbar.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import apiRequest from "../../lib/apiRequest";

function Navbar() {
  const { currentUser,updateUser } = useContext(AuthContext); // Assuming you have a logout function in your context
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <nav>
      <div className="left">
        <a href="/" className="logo">
          <img src="/logo.png" alt="" />
          <span>Traffic-Analysis</span>
        </a>
        <a href="/">Home</a>
        <a href="/redeem">Redeem</a>
        <a href="/admin">Admin</a>
        <a href="/route-history">Route-History</a>
      </div>
      <div className="right">
        {currentUser ? (
          <>
          <span>{currentUser.username}</span>
          <button className="logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <a href="/login">Login</a>
            <a href="/register" className="register">
              Register
            </a>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

