"use client";

// An abstract "distance ring" diagram, not a real map — per the spec,
// the bakery's actual location stays hidden, and this is meant to be
// a static/illustrated selector, not a live geocoded map. Rings are
// sized proportionally to each zone's max_km, sorted innermost-first.
export default function DeliveryZoneMap({ zones, selectedZoneId, onSelect }) {
  if (zones.length === 0) return null;

  const sorted = [...zones].sort((a, b) => (a.max_km || 0) - (b.max_km || 0));
  const outerMaxKm = sorted[sorted.length - 1].max_km || 1;
  const viewSize = 220;
  const center = viewSize / 2;
  const maxRadius = center - 10;

  let previousKm = 0;
  const rings = sorted.map((zone) => {
    const outerRadius = (Math.max(zone.max_km || 0, previousKm) / outerMaxKm) * maxRadius;
    const innerRadius = (previousKm / outerMaxKm) * maxRadius;
    previousKm = zone.max_km || previousKm;
    return { zone, outerRadius, innerRadius };
  });

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      className="w-full max-w-[220px] mx-auto"
      role="img"
      aria-label="Illustrated delivery zones — select a zone below to see it highlighted here"
    >
      {rings.map(({ zone, outerRadius, innerRadius }) => {
        const isSelected = zone.id === selectedZoneId;
        return (
          <circle
            key={zone.id}
            cx={center}
            cy={center}
            r={Math.max(outerRadius - 1, innerRadius + 1)}
            fill="none"
            stroke={isSelected ? "#7A5738" : "#B4A390"}
            strokeOpacity={isSelected ? 1 : 0.35}
            strokeWidth={Math.max(outerRadius - innerRadius - 2, 4)}
            className="cursor-pointer transition"
            onClick={() => onSelect(zone.id)}
          >
            <title>
              {zone.name} — ${(zone.price_cents / 100).toFixed(2)}
            </title>
          </circle>
        );
      })}
      {/* Center point represents the pickup/dispatch point abstractly —
          intentionally unlabeled, no real address shown. */}
      <circle cx={center} cy={center} r="4" fill="#2B1D10" />
    </svg>
  );
}
