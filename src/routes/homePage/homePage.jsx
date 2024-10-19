import "./homePage.css";
import MapComponent from "../../components/mapComponent/mapComponent";

function HomePage() {
  return (
    <div className="homePage">
      <div className="left">
        <a href="/pothole" className="btn">Report a Pothole</a>
        <br />
        <a href="/complaint" className="btn">Register a Complaint</a>
        <br />
        <a href="/event" className="btn">Register an Event</a>
        <br />
        <a href="/analysis" className="btn">Analyze</a>
      </div>
      <div className="right">
        <MapComponent />
      </div>
    </div>
  );
}

export default HomePage;
