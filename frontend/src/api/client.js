import axios from "axios";
import {jwtDecode} from "jwt-decode";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ─────────────────────────────
//  Auth token helpers
// ─────────────────────────────
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;  
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return true;
  }
};

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
if (savedToken && !isTokenExpired(savedToken)) {
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

export const getMovieInfo=(movieId)=>
  api.get(`/xTream/movie/info/${movieId}`);

export const getMovieStream = (streamId,ext) =>
 api.get(`/xTream/movie/video/${streamId}`,{
    params: {ext},
  });

// SERIES
export const getSeriesCategories=()=>
  api.get("/xTream/series/categories");

export const getSeriesByCategories=(categoryId)=>
  api.get(`/xTream/series/categories/${categoryId}`);

export const getSeriesInfo=(seriesId)=>
  api.get(`/xTream/series/info/${seriesId}`);

export const getSeriesStream = (streamId,ext) =>
  api.get(`/xTream/series/video/${streamId}`,{
    params: {ext},
  });

export default api;
