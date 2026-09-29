const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, options = {}) {
  const { body, auth = true, headers = {}, ...requestOptions } = options;
  const requestHeaders = { ...headers };

  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  const token = auth ? localStorage.getItem("sessionToken") : null;
  if (auth && token) requestHeaders.Authorization = "Bearer " + token;

  let response;
  try {
    response = await fetch(API_ROOT + "/" + String(path).replace(/^\//, ""), {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Unable to connect to the server. Check that the API is running.", 0, null);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : "The request could not be completed.";
    throw new ApiError(message, response.status, data);
  }
  return data;
}
