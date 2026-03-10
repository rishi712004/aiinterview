import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({ baseURL: BASE_URL });

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
export const getQuestion       = (slug)   => api.get(`/questions/${slug}`);
export const getCompanyPattern = (name)   => api.get(`/questions/company/${name}`);
export const submitAttempt     = (data)   => api.post("/sessions", data);
export const getAttempt        = (id)     => api.get(`/sessions/attempt/${id}`);
export const getOverview       = ()       => api.get("/analytics/overview");
export const getWeaknesses     = ()       => api.get("/analytics/weaknesses");
export const getHeatmap        = ()       => api.get("/analytics/heatmap");
export const getLeaderboard    = ()       => api.get("/analytics/leaderboard");
export const getStreak         = ()       => api.get("/analytics/streak");
export const getMockUpcoming   = ()       => api.get("/mock/upcoming");
export const getMockStats      = ()       => api.get("/mock/stats");
export const scheduleMock      = (data)   => api.post("/mock/schedule", data);
export const cancelMock        = (id)     => api.put(`/mock/${id}/cancel`);
export const analyzeResume     = (file)   => {
  const form = new FormData();
  form.append("resume", file);
  return api.post("/resume/analyze", form);
};
export const getResumeHistory  = ()       => api.get("/resume/history");
export const getDaily          = ()       => api.get("/daily");
export const getHistory        = ()       => api.get("/sessions/history");
export const getDiscussions    = (qId)    => api.get(`/discussions/${qId}`);
export const postDiscussion    = (qId, data) => api.post(`/discussions/${qId}`, data);
export const likeDiscussion    = (id)     => api.post(`/discussions/${id}/like`);
export const deleteDiscussion  = (id)     => api.delete(`/discussions/${id}`);
export const startInterview    = (data)   => api.post("/interview/start", data);
export const answerInterview   = (data)   => api.post("/interview/answer", data);
export const finishInterview   = (data)   => api.post("/interview/finish", data);
export const updateProfile     = (data)   => api.put("/auth/profile", data);

export default api;
