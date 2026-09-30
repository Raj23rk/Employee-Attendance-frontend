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

/** Format a number as Indian Rupees (₹) */
export function formatCurrency(amount: number): string {
  return "₹" + Number(amount).toLocaleString("en-IN");
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

/** Format time to HH:MM AM/PM */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
