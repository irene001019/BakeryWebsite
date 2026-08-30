import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getOrderableWeekend } from "@/lib/cutoff";

// This route exists specifically so "now" is the SERVER's clock, per
// the project spec ("cutoff logic calculated server-side, not the
// customer's device clock"). Route Handlers like this one run on the
// server (a Vercel serverless function), so `new Date()` here is
// authoritative — a customer can't spoof it by changing their device's
// clock or timezone.
export async function GET() {
  const { data: settings, error } = await supabase
    .from("settings")
    .select("order_cutoff_day, order_cutoff_time")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const cutoffDay = settings?.order_cutoff_day || "Friday";
  const cutoffTime = settings?.order_cutoff_time || "20:00:00";

  const { cutoffAt, weekendStart } = getOrderableWeekend(now, cutoffDay, cutoffTime);

  return NextResponse.json({
    serverNow: now.toISOString(),
    cutoffAt: cutoffAt.toISOString(),
    weekendStart, // { year, month, day }
    cutoffDayLabel: cutoffDay,
    cutoffTimeLabel: formatTimeLabel(cutoffTime),
  });
}

function formatTimeLabel(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
