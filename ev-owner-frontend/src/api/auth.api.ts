import api from "./axiosInstance";

export const AuthAPI = {
  // Đăng ký
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/user/register", data),

  // Đăng nhập
  login: (email: string, password: string) =>
    api.post("/user/login", { email, password }),

  // Lấy thông tin profile
  profile: () => api.get("/user/profile"),
};
