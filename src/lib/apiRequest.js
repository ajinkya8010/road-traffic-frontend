import axios from "axios";

const apiRequest = axios.create({
  baseURL: "",
  withCredentials: true,
});

export default apiRequest;