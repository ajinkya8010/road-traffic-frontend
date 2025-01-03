import axios from "axios";

const apiRequest = axios.create({
  baseURL: "https://road-traffic-backend.onrender.com/api",
  withCredentials: true,
});

export default apiRequest;