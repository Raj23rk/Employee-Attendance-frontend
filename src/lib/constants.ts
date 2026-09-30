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

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
}

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
  dateOfJoining?: string;
  branch?: string;
  isActive?: boolean;
  bankDetails?: BankDetails;
  todayAttendance?: {
    isCheckedIn: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    status?: "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "ON_LEAVE";
    location?: {
      latitude?: number;
      longitude?: number;
      branchName?: string;
      address?: string;
    };
  };
  monthlyStats?: {
    lateCount: number; // Max 3 allowed, 4th triggers half-day deduction
    permissionHoursUsed: number; // Max 2 hours / month
    casualLeavesUsed: number; // 1 CL per month standard
    medicalLeavesUsed: number;
    lopDays: number;
  };
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const DEFAULT_BRANCHES: Branch[] = [];

/* ── Company Attendance & Shift Policy Rules ── */
export const ATTENDANCE_POLICY_CONFIG = {
  standardCheckIn: "09:40 AM",
  graceCheckIn: "09:45 AM",
  standardCheckOut: "07:00 PM",
  maxLateAllowedPerMonth: 3,
  lateDeductionRule: "3 times late check-in allowed (up to 9:45 AM). 4th late check-in will deduct Half-Day salary.",
  monthlyPermissionHoursMax: 2,
  permissionDeductionRule: "1 month employee gets 2 hours total permission. Permission exceeding 2 hours triggers Half-Day salary deduction.",
  casualLeaveMonthlyAllowance: 1,
  casualLeaveRule: "1 Casual Leave (CL) credited per month. Excess leaves treated as Loss of Pay (LOP).",
  medicalLeaveRule: "Medical Certificate upload is mandatory for Medical Leave approval, otherwise marked as LOP.",
};

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
  let normalized = role.toLowerCase().replace(/[- ]/g, "_");
  if (normalized === "hr") normalized = "hr_manager";
  return (ROLE_LABELS as Record<string, string>)[normalized] || role;
};


