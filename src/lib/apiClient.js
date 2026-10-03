// src/lib/apiClient.js
//
// Central fetch wrapper for every authenticated API call.
// Handles the access-token refresh flow automatically so individual
// pages never have to think about expiry — they just call authFetch()
// exactly like they'd call fetch().

const BASE_URL = "https://weforeverdrip.fly.dev";

// Prevents multiple simultaneous 401s (e.g. a page firing two fetches
// at once) from triggering two separate refresh calls. Everyone who
// hits a 401 at the same moment shares this one in-flight promise.
let refreshPromise = null;

function getStoredToken(key) {
  // Guards against this ever running during server-side rendering,
  // where `localStorage` doesn't exist.
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("wfd_access");
  localStorage.removeItem("wfd_refresh");
}

function clearTokensAndRedirect() {
  if (typeof window === "undefined") return;
  clearTokens();
  window.location.href = "/auth";
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredToken("wfd_refresh");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh token is invalid or expired");
    }

    const data = await response.json();
    localStorage.setItem("wfd_access", data.access);

    // IMPORTANT: your backend has ROTATE_REFRESH_TOKENS = True and
    // BLACKLIST_AFTER_ROTATION = True. That means every refresh call
    // issues a BRAND NEW refresh token and immediately blacklists the
    // old one. If we don't save the new one here, the *next* refresh
    // attempt will use the now-dead old token and fail — forcing a
    // logout that didn't need to happen.
    if (data.refresh) {
      localStorage.setItem("wfd_refresh", data.refresh);
    }

    return data.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null; // clear so future 401s can trigger a fresh refresh
  }
}

/**
 * Drop-in replacement for fetch() on authenticated endpoints.
 *
 * @param {string} path - API path starting with "/", e.g. "/api/v1/orders/cart/"
 * @param {RequestInit} options - same options object you'd pass to fetch()
 * @param {{ redirectOnFail?: boolean }} behaviour - optional. By default
 *    (redirectOnFail: true) a dead session sends the user to /auth, which
 *    is right for pages that need a login (cart, checkout). Pass
 *    { redirectOnFail: false } for background calls on PUBLIC pages (like
 *    the navbar cart count): the tokens are still cleared and an error is
 *    thrown, but the visitor is NOT bounced away from the page.
 * @returns {Promise<Response>} - a normal Response, same as fetch() returns.
 *    Call .json() / check .ok on it exactly like you already do.
 */
export async function authFetch(
  path,
  options = {},
  { redirectOnFail = true } = {},
) {
  const buildHeaders = (token) => ({
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const accessToken = getStoredToken("wfd_access");

  let response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(accessToken),
  });

  if (response.status === 401) {
    let body = null;
    try {
      // .clone() so we can inspect the body without consuming the
      // original response, in case we end up returning it unchanged.
      body = await response.clone().json();
    } catch {
      // Response wasn't JSON — treat as a hard auth failure below.
    }

    const isExpiredToken = body?.code === "token_not_valid";

    if (isExpiredToken) {
      try {
        const newAccessToken = await refreshAccessToken();
        response = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: buildHeaders(newAccessToken),
        });
      } catch {
        // Refresh token is also dead (7-day window expired) — this is
        // the ONLY case that should actually log someone out.
        if (redirectOnFail) clearTokensAndRedirect();
        else clearTokens();
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // 401 for some other reason (e.g. never logged in at all).
      if (redirectOnFail) clearTokensAndRedirect();
      else clearTokens();
      throw new Error("Not authenticated. Please log in again.");
    }
  }

  return response;
}