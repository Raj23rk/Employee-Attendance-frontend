/** Merge class names, filtering falsy values */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/** Safely parse JSON strings without throwing */
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value || value === "undefined" || value === "null" || value.trim() === "") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Format a number as Indian Rupees (₹) safely with decimal precision */
export function formatCurrency(amount?: number | null): string {
  const n = Number(amount);
  if (isNaN(n)) return "₹0";
  const hasDecimals = n % 1 !== 0;
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}

/** Get initials from a full name (max 2 chars) */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Format a date to a readable string */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format time to HH:MM AM/PM in IST */
export function formatTime(date: Date | string | number | null | undefined): string {
  if (!date) return "--:--";
  try {
    if (typeof date === "number") {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
      }
    }

    if (typeof date === "string") {
      const str = date.trim();
      if (str === "-" || str === "--:--" || !str) return "--:--";

      // If it's an ISO timestamp or date-containing string (e.g. 2026-10-01T03:53:00.000Z)
      if (str.includes("T") || str.endsWith("Z") || /^\d{4}-\d{2}-\d{2}/.test(str)) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          });
        }
      }

      // If already formatted like "09:41 AM"
      if (str.includes("AM") || str.includes("PM")) {
        return str;
      }

      // Try general Date parse
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
      }

      return str;
    }

    if (date instanceof Date) {
      if (isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    }

    return String(date);
  } catch {
    return String(date);
  }
}

/** Convert "HH:mm" 24h format (e.g. "10:00", "17:00", "09:40") to 12h "hh:mm A" */
export function formatTimeTo12Hour(timeStr?: string): string {
  if (!timeStr) return "";
  const str = String(timeStr).trim();
  if (str.includes("AM") || str.includes("PM")) return str;
  const parts = str.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    if (!isNaN(h)) {
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    }
  }
  return formatTime(timeStr);
}

/** Calculate grace time string (e.g. "09:40" + 5m -> "09:45 AM", "10:00" + 5m -> "10:05 AM") */
export function calculateGraceTime(startTimeStr?: string, graceMinutes: number = 5): string {
  if (!startTimeStr) return "09:45 AM";
  const str = String(startTimeStr).trim();
  let h = 9;
  let m = 40;
  if (str.includes("AM") || str.includes("PM")) {
    const [time, period] = str.split(" ");
    const [hS, mS] = time.split(":").map(Number);
    h = period === "PM" && hS !== 12 ? hS + 12 : period === "AM" && hS === 12 ? 0 : hS;
    m = mS || 0;
  } else {
    const parts = str.split(":").map(Number);
    h = parts[0] || 0;
    m = parts[1] || 0;
  }
  const totalMins = h * 60 + m + graceMinutes;
  const graceH = Math.floor(totalMins / 60) % 24;
  const graceM = totalMins % 60;
  const period = graceH >= 12 ? "PM" : "AM";
  const hour12 = graceH % 12 === 0 ? 12 : graceH % 12;
  return `${String(hour12).padStart(2, "0")}:${String(graceM).padStart(2, "0")} ${period}`;
}


