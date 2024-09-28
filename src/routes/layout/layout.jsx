import "./layout.scss";
import Navbar from "../../components/navbar/navbar";
import { Outlet } from "react-router-dom";


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

export { Layout };