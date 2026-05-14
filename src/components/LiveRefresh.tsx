"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface LiveRefreshProps {
  startDate: string;
  endDate: string;
  timeZone: string;
}

const MORNING_INTERVAL_MS = 120_000;
const AFTERNOON_INTERVAL_MS = 60_000;
const IDLE_RECHECK_MS = 60_000;

function isActive(startDate: string, endDate: string, now: Date) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T23:59:59Z`).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

function getDelayMs(timeZone: string, now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .find((p) => p.type === "hour")?.value ?? "0",
  );

  if (hour >= 7 && hour < 12) {
    return MORNING_INTERVAL_MS;
  }

  if (hour >= 12 && hour < 21) {
    return AFTERNOON_INTERVAL_MS;
  }

  return IDLE_RECHECK_MS;
}

export default function LiveRefresh({ startDate, endDate, timeZone }: LiveRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: number | undefined;
    let isCancelled = false;

    const scheduleNextRefresh = () => {
      if (isCancelled) {
        return;
      }

      const now = new Date();
      const active = isActive(startDate, endDate, now);
      const delayMs = active ? getDelayMs(timeZone, now) : IDLE_RECHECK_MS;

      timeoutId = window.setTimeout(() => {
        if (isActive(startDate, endDate, new Date())) {
          router.refresh();
        }

        scheduleNextRefresh();
      }, delayMs);
    };

    scheduleNextRefresh();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [router, startDate, endDate, timeZone]);

  return null;
}
