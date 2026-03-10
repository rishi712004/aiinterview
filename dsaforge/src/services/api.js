import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const register = (data) => api.post("/auth/register", data);
export const login    = (data) => api.post("/auth/login", data);
export const getMe    = ()     => api.get("/auth/me");
export const getQuestions      = (params) => api.get("/questions", { params });
export const getCompanyPattern = (name)   => api.get(`/questions/company/${name}`);
export const getOverview    = () => api.get("/analytics/overview");
export const getWeaknesses  = () => api.get("/analytics/weaknesses");
export const getHeatmap     = () => api.get("/analytics/heatmap");
export const getLeaderboard = () => api.get("/analytics/leaderboard");
export const getMockUpcoming = ()     => api.get("/mock/upcoming");
export const getMockStats    = ()     => api.get("/mock/stats");
export const scheduleMock    = (data) => api.post("/mock/schedule", data);
export const cancelMock      = (id)   => api.put(`/mock/${id}/cancel`);
export const analyzeResume    = (file) => {
  const form = new FormData();
  form.append("resume", file);
  return api.post("/resume/analyze", form);
};
export const getResumeHistory = () => api.get("/resume/history");

export default api;
