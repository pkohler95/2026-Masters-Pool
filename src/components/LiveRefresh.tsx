"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClientRefreshDelayMs, isTournamentActive } from "@/lib/scrapeSchedule";

export default function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: number | undefined;
    let isCancelled = false;

    const scheduleNextRefresh = () => {
      if (isCancelled) {
        return;
      }

      const delayMs = getClientRefreshDelayMs(new Date());
      timeoutId = window.setTimeout(() => {
        if (isTournamentActive(new Date())) {
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
  }, [router]);

  return null;
}
