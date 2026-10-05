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

export type UserRole = "admin" | "ceo" | "md" | "gm" | "hr_manager" | "manager" | "employee" | "accountant";

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
  employeeCount?: number;
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
  md: "Managing Director (MD)",
  gm: "General Manager (GM)",
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

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  type: "NATIONAL" | "FESTIVAL" | "INSTITUTIONAL" | "GAZETTED";
  description?: string;
}

export const DEFAULT_PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { id: "h-1", name: "New Year's Day", date: "2026-01-01", dayOfWeek: "Thursday", type: "NATIONAL", description: "Global New Year Celebration" },
  { id: "h-2", name: "Pongal / Makar Sankranti", date: "2026-01-14", dayOfWeek: "Wednesday", type: "FESTIVAL", description: "Harvest Festival of Tamil Nadu" },
  { id: "h-3", name: "Thiruvalluvar Day", date: "2026-01-15", dayOfWeek: "Thursday", type: "FESTIVAL", description: "Honoring Saint Poet Thiruvalluvar" },
  { id: "h-4", name: "Uzhavar Thirunal", date: "2026-01-16", dayOfWeek: "Friday", type: "FESTIVAL", description: "Farmers Day Celebrations" },
  { id: "h-5", name: "Republic Day", date: "2026-01-26", dayOfWeek: "Monday", type: "NATIONAL", description: "Indian Republic Day Celebration" },
  { id: "h-6", name: "Maha Shivaratri", date: "2026-02-15", dayOfWeek: "Sunday", type: "FESTIVAL", description: "Great Night of Shiva" },
  { id: "h-7", name: "Holi", date: "2026-03-04", dayOfWeek: "Wednesday", type: "FESTIVAL", description: "Festival of Colors" },
  { id: "h-8", name: "Good Friday", date: "2026-04-03", dayOfWeek: "Friday", type: "GAZETTED", description: "Easter Weekend Observance" },
  { id: "h-9", name: "Tamil New Year / Puthandu", date: "2026-04-14", dayOfWeek: "Tuesday", type: "FESTIVAL", description: "Tamil Solar Calendar New Year" },
  { id: "h-10", name: "May Day / Labour Day", date: "2026-05-01", dayOfWeek: "Friday", type: "NATIONAL", description: "International Workers' Day" },
  { id: "h-11", name: "Bakrid / Eid al-Adha", date: "2026-05-27", dayOfWeek: "Wednesday", type: "FESTIVAL", description: "Feast of the Sacrifice" },
  { id: "h-12", name: "Muharram", date: "2026-06-26", dayOfWeek: "Friday", type: "GAZETTED", description: "Islamic New Year Observance" },
  { id: "h-13", name: "Independence Day", date: "2026-08-15", dayOfWeek: "Saturday", type: "NATIONAL", description: "Indian Independence Day (79th Year)" },
  { id: "h-14", name: "Milad-un-Nabi", date: "2026-08-25", dayOfWeek: "Tuesday", type: "FESTIVAL", description: "Prophet's Birthday" },
  { id: "h-15", name: "Vinayagar Chaturthi", date: "2026-09-14", dayOfWeek: "Monday", type: "FESTIVAL", description: "Lord Ganesha Festival" },
  { id: "h-16", name: "Gandhi Jayanti", date: "2026-10-02", dayOfWeek: "Friday", type: "NATIONAL", description: "Mahatma Gandhi's Birthday" },
  { id: "h-17", name: "Ayutha Pooja / Saraswathi Pooja", date: "2026-10-19", dayOfWeek: "Monday", type: "FESTIVAL", description: "Worship of Knowledge & Tools" },
  { id: "h-18", name: "Vijaya Dasami / Dussehra", date: "2026-10-20", dayOfWeek: "Tuesday", type: "FESTIVAL", description: "Victory of Good over Evil" },
  { id: "h-19", name: "Deepavali / Diwali", date: "2026-11-08", dayOfWeek: "Sunday", type: "FESTIVAL", description: "Festival of Lights" },
  { id: "h-20", name: "Christmas", date: "2026-12-25", dayOfWeek: "Friday", type: "NATIONAL", description: "Christmas Day Celebration" },
];


