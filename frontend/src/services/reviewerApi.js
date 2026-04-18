function resolveDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000/api/v1";
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000/api/v1`;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || resolveDefaultApiBaseUrl();
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function formatHttpDetail(detail) {
  if (detail == null) {
    return "Request failed";
  }
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => {
        if (entry && typeof entry === "object" && typeof entry.msg === "string") {
          const loc = Array.isArray(entry.loc) ? entry.loc.join(".") : "";
          return loc ? `${loc}: ${entry.msg}` : entry.msg;
        }
        try {
          return JSON.stringify(entry);
        } catch {
          return String(entry);
        }
      })
      .join("; ");
  }
  if (typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
}

async function fetchJson(path, options = {}) {
  const {
    method = "GET",
    body,
    csrfToken = "",
    headers = {},
    rawBody = false,
  } = options;
  const normalizedMethod = method.toUpperCase();
  const requestBody = body ? (rawBody ? body : JSON.stringify(body)) : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: normalizedMethod,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body && !rawBody ? { "Content-Type": "application/json" } : {}),
      ...(!SAFE_METHODS.has(normalizedMethod) && csrfToken
        ? { "X-CSRF-Token": csrfToken }
        : {}),
      ...headers,
    },
    body: requestBody,
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const payload = await response.json();
      detail = formatHttpDetail(payload.detail ?? payload.message ?? detail);
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function toQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function createChallengeClient(basePath, csrfToken = "") {
  return {
    getMeta() {
      return fetchJson(`${basePath}/meta`);
    },
    getCategories() {
      return fetchJson(`${basePath}/categories`);
    },
    getFilters() {
      return fetchJson(`${basePath}/filters`);
    },
    getChallenges(filters = {}) {
      return fetchJson(`${basePath}/challenges${toQuery(filters)}`);
    },
    getChallenge(challengeId) {
      return fetchJson(`${basePath}/challenges/${challengeId}`);
    },
    getChallengeStats(challengeId) {
      return fetchJson(`${basePath}/challenges/${challengeId}/stats`);
    },
    submitChallenge(challengeId, selectedLines) {
      return fetchJson(`${basePath}/challenges/${challengeId}/submit`, {
        method: "POST",
        csrfToken,
        body: { selected_lines: selectedLines },
      });
    },
    getProgress() {
      return fetchJson(`${basePath}/progress`);
    },
    getSquadPulse() {
      return fetchJson(`${basePath}/squad-pulse`);
    },
    getLeaderboard(limit = 25) {
      return fetchJson(`${basePath}/leaderboard${toQuery({ limit })}`);
    },
  };
}

export function createDemoClient() {
  return createChallengeClient("/demo");
}

export function createTrainingClient(csrfToken) {
  return createChallengeClient("/training", csrfToken);
}

export function registerUser(payload) {
  return fetchJson("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function loginUser(payload) {
  return fetchJson("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentUser() {
  return fetchJson("/auth/me");
}

export function logoutUser(csrfToken) {
  return fetchJson("/auth/logout", {
    method: "POST",
    csrfToken,
  });
}

export function uploadChallenge(file, csrfToken) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchJson("/admin/challenges/upload", {
    method: "POST",
    body: formData,
    rawBody: true,
    csrfToken,
  });
}
