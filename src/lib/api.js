const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token) {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.error || data.message || "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export const api = {
  register: (body) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me"),
  uploadDocument: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("/api/documents/upload", { method: "POST", body: fd });
  },
  listSessions: () => request("/api/sessions"),
  createSession: (body) =>
    request("/api/sessions", { method: "POST", body: JSON.stringify(body) }),
  getSession: (id) => request(`/api/sessions/${id}`),
  chat: (sessionId, message) =>
    request("/api/interview/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message }),
    }),
  endInterview: (sessionId) =>
    request("/api/interview/end", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),
};

export { genkitChat } from "./genkitClient";
