/* ── Design tokens ── */
export const colors = {
  navy900: "#0A1B45",
  navy800: "#101F52",
  navy700: "#16326F",
  navy600: "#204382",
  navy100: "#E7EAF5",
  navy50: "#F3F4FA",

  orange600: "#D9520A",
  orange500: "#EA6118",
  orange400: "#F0834A",
  orange100: "#FCE3CF",
  orange50: "#FDF0E6",

  paper: "#F4F5F9",
  ink: "#12173A",
  muted: "#5B6180",
  faint: "#8A8FB0",
  line: "#E2E4EF",
  white: "#FFFFFF",

  success: "#188A5E",
  successBg: "#E4F5EC",
  warn: "#B4790A",
  warnBg: "#FBF0DA",
  danger: "#C23B3B",
  dangerBg: "#FBE7E7",
  info: "#3454C8",
  infoBg: "#E8ECFB",
} as const;

export type UserRole = "admin" | "ceo" | "hr_manager" | "manager" | "employee" | "accountant";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  employeeId: string;
  designation?: string;
  gender?: string;
  phone?: string;
  personalEmail?: string;
  address?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  ceo: "CEO / Executive",
  hr_manager: "HR Manager",
  manager: "Team Manager",
  employee: "Employee",
  accountant: "Accountant",
};

export const formatRoleLabel = (role?: string): string => {
  if (!role) return "Employee";
  const normalized = role.toLowerCase().replace(/[- ]/g, "_");
  return (ROLE_LABELS as Record<string, string>)[normalized] || role;
};

