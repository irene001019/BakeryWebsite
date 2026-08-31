"use client";

import { useEffect, useState } from "react";

function formatCountdown(ms) {
  if (ms <= 0) return "closing…";
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days === 0 && hours === 0) return "closing soon";
  const parts = [];
  if (days) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  return parts.join(" ");
}

function formatWeekendLabel({ year, month, day }) {
  // weekendStart is the Saturday; the weekend runs through Sunday.
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(Date.UTC(year, month - 1, day + 1));
  const startLabel = start.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const endLabel = end.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
  return `${startLabel}–${endLabel}`;
}

export default function StatusBanner() {
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/cutoff-status")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load ordering status");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        // Correct for any difference between the server's clock and
        // this device's clock, so the countdown stays accurate to the
        // SERVER'S time even if the customer's device clock is wrong
        // — without needing to re-fetch every second to get there.
        const clockOffsetMs = new Date(data.serverNow).getTime() - Date.now();
        setStatus({
          cutoffAtMs: new Date(data.cutoffAt).getTime(),
          weekendStart: data.weekendStart,
          cutoffDayLabel: data.cutoffDayLabel,
          cutoffTimeLabel: data.cutoffTimeLabel,
          clockOffsetMs,
        });
      })
      .catch((err) => mounted && setError(err.message));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <p className="text-center text-sm text-red-600 mb-10">{error}</p>;
  }
  if (!status) {
    return (
      <p className="text-center text-sm text-brand-ink/40 mb-10">
        Checking this weekend&apos;s cutoff…
      </p>
    );
  }

  const correctedNow = now + status.clockOffsetMs;
  const msRemaining = status.cutoffAtMs - correctedNow;

  return (
    <div className="max-w-md mx-auto text-center mb-10 bg-brand-paper rounded-2xl px-6 py-4">
      <p className="text-sm text-brand-ink/70">
        Now taking orders for the weekend of{" "}
        <span className="font-medium text-brand-ink">
          {formatWeekendLabel(status.weekendStart)}
        </span>
      </p>
      <p className="text-xs text-brand-ink/50 mt-1">
        {msRemaining > 0 ? (
          <>
            Ordering closes in{" "}
            <span className="font-medium text-brand-ink">{formatCountdown(msRemaining)}</span>{" "}
            ({status.cutoffDayLabel} {status.cutoffTimeLabel})
          </>
        ) : (
          "Ordering is closing now — the menu will roll to next weekend shortly."
        )}
      </p>
    </div>
  );
}
