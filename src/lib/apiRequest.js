import axios from "axios";

const apiRequest = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,
});

export default apiRequest;