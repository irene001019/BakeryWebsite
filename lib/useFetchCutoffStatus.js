"use client";

import { useCallback } from "react";

// Fetches the current cutoff status fresh from the server (see
// app/api/cutoff-status/route.js) — always the SERVER's clock, never
// the browser's, per the project spec. Returns a function rather than
// auto-fetching on mount, so callers can decide when freshness matters
// (StatusBanner fetches once on load; the order form re-fetches right
// before submitting, to minimize the staleness window for someone who
// left the tab open for a while).
export function useFetchCutoffStatus() {
  return useCallback(async () => {
    const res = await fetch("/api/cutoff-status");
    if (!res.ok) throw new Error("Could not check the ordering cutoff. Please try again.");
    const data = await res.json();
    // Correct for any difference between the server's clock and this
    // device's clock (see StatusBanner for the same technique).
    const clockOffsetMs = new Date(data.serverNow).getTime() - Date.now();
    return {
      ...data,
      cutoffAtMs: new Date(data.cutoffAt).getTime(),
      clockOffsetMs,
      correctedNowMs: () => Date.now() + clockOffsetMs,
    };
  }, []);
}
