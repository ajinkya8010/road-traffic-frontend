import "./layout.css";
import Navbar from "../../components/navbar/navbar";
import {Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

function Layout() {
  return (
    <div className="layout">
      <div className="navbar">
        <Navbar />
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

// function RequireAuth() {
//   const { currentUser } = useContext(AuthContext);
//   console.log(currentUser)
//   if (!currentUser) return <Navigate to="/login" />;
//   else {
//     return (
//       <div className="layout">
//         <div className="navbar">
//           <Navbar />
//         </div>
//         <div className="content">
//           <Outlet />
//         </div>
//       </div>
//     );
//   }
// }



function RequireAuth({ requiredRole }) {
  const { currentUser } = useContext(AuthContext);
  console.log(currentUser.role)
  if (!currentUser) {
    return <Navigate to="/login" />;
  } else if (requiredRole && currentUser.role !== requiredRole) {
    window.alert("You are not authorized to access this page.");
    return <Navigate to="/" />;
  } else {
    return (
      <div className="layout">
        <div className="navbar">
          <Navbar />
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    );
  }
}



export { Layout, RequireAuth };