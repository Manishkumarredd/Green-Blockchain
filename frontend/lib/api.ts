const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000/api/v1";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1";
};

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const base = getApiBase();
  const url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("greenledger_auth_token") || localStorage.getItem("greenledger_jwt"))
    : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}
