
import axios from "axios";

VITE_API_BASE_URL= "http://localhost:8000"
const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
});

export default apiClient;
