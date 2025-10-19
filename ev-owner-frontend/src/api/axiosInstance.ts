import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // backend NestJS API
  headers: {
    "Content-Type": "application/json",
  },
});

// 🪪 Tự động gắn token JWT vào header (nếu có)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
