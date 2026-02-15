import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_PROJECTS_BACKEND_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:4000" : "https://api.qeemasupport.site");

export const api = axios.create({
  baseURL: baseURL ? `${baseURL.replace(/\/$/, "")}` : window.location.origin,
  headers: { "Content-Type": "application/json" },
  withCredentials: baseURL ? false : true,
});

let onUnauthorized = () => {
  window.location.href = "/login";
};

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token =
    window.__authToken ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      const isLoginPage = path === "/login";
      const isLoginRequest = err.config?.url?.includes("/auth/login");
      if (!isLoginPage && !isLoginRequest) {
        onUnauthorized();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
