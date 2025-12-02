import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ─────────────────────────────
//  Auth token helpers
// ─────────────────────────────
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("xtream_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("xtream_token");
  }
};

// לטעינה ראשונית אם יש טוקן שמור
const savedToken = localStorage.getItem("xtream_token");
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

// ─────────────────────────────
//  API calls
// ─────────────────────────────

export const connectToServer = (payload) =>
  api.post("/auth/connect", payload);
// payload = { baseUrl, username, password }

// LIVE
export const getLiveCategories = () =>
  api.get("/xTream/live/categories");

export const getLiveByCategory = (categoryId) =>
  api.get(`/xTream/live/categories/${categoryId}`);

export const getLiveStream = (streamId) =>
  api.get(`/xTream/live/video/${streamId}`);

// VOD
export const getMoviesCategories = () =>
  api.get("/xTream/movies/categories");

export const getMoviesByCategory = (categoryId) =>
  api.get(`/xTream/movies/categories/${categoryId}`);

export const getVodStream = (streamId, ext) =>
  api.get(`/xTream/movies/stream/${streamId}`, {
    params: ext ? { ext } : {},
  });

export default api;
