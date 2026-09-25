import type { User } from "./constants";

/* ── Mock & Seed demo users matching backend credentials (Password for all: Password@123) ── */
export const MOCK_USERS: Record<string, User & { password: string }> = {
  "ceo@wegrow.edu.in": {
    id: "u_ceo",
    name: "Dr. Arvind Varma",
    email: "ceo@wegrow.edu.in",
    role: "ceo",
    department: "Executive Office",
    designation: "Chief Executive Officer & Director",
    employeeId: "WG-CEO-01",
    gender: "male",
    password: "Password@123",
  },
  "hr@wegrow.edu.in": {
    id: "u_hr",
    name: "Ananya Deshmukh",
    email: "hr@wegrow.edu.in",
    role: "hr_manager",
    department: "Human Resources",
    designation: "Head of People & Culture",
    employeeId: "WG-HR-001",
    gender: "female",
    password: "Password@123",
  },
  "manager@wegrow.edu.in": {
    id: "u_mgr",
    name: "Rajesh Kumar",
    email: "manager@wegrow.edu.in",
    role: "manager",
    department: "Academics & Operations",
    designation: "General Administration Lead",
    employeeId: "WG-MGR-001",
    gender: "male",
    password: "Password@123",
  },
  "priya.sharma@wegrow.edu.in": {
    id: "u_emp_f",
    name: "Priya Sharma",
    email: "priya.sharma@wegrow.edu.in",
    role: "employee",
    department: "Management Studies",
    designation: "Associate Professor",
    employeeId: "WG-FAC-014",
    gender: "female",
    password: "Password@123",
  },
  "vijay.kumaran@wegrow.edu.in": {
    id: "u_emp_m",
    name: "Vijay Kumaran",
    email: "vijay.kumaran@wegrow.edu.in",
    role: "employee",
    department: "Computer Applications",
    designation: "Lead Technical Trainer",
    employeeId: "WG-FAC-028",
    gender: "male",
    password: "Password@123",
  },
  "admin@wegrow.edu.in": {
    id: "u_admin",
    name: "System Administrator",
    email: "admin@wegrow.edu.in",
    role: "admin",
    department: "IT Infrastructure",
    designation: "Principal Admin",
    employeeId: "WG-SYS-001",
    gender: "male",
    password: "Password@123",
  },
};

/* ── Dashboard Stats ── */
export const DASHBOARD_STATS = {
  admin: [
    { label: "Total Employees", value: 156, icon: "Users", trend: "+4 this month", color: "info" },
    { label: "Present Today", value: 142, icon: "CircleCheck", trend: "91% attendance", color: "success" },
    { label: "On Leave", value: 8, icon: "CalendarDays", trend: "5.1% of staff", color: "warn" },
    { label: "Pending Approvals", value: 12, icon: "Clock", trend: "3 urgent", color: "danger" },
  ],
  ceo: [
    { label: "Total Campus Staff", value: 156, icon: "Users", trend: "4 Campus Wings", color: "info" },
    { label: "Overall Attendance", value: "94.2%", icon: "CircleCheck", trend: "142 Present Today", color: "success" },
    { label: "Monthly Payroll Run", value: "₹42.5L", icon: "Wallet", trend: "100% on schedule", color: "orange" },
    { label: "Executive Approvals", value: 4, icon: "Shield", trend: "2 Capex / 2 Leave", color: "warn" },
  ],
  hr_manager: [
    { label: "Total Employees", value: 156, icon: "Users", trend: "+4 this month", color: "info" },
    { label: "Present Today", value: 142, icon: "CircleCheck", trend: "91% attendance", color: "success" },
    { label: "Leave Requests", value: 6, icon: "Inbox", trend: "2 new today", color: "warn" },
    { label: "Pending Approvals", value: 12, icon: "Clock", trend: "3 urgent", color: "danger" },
  ],
  manager: [
    { label: "Team Members", value: 18, icon: "Users", trend: "Academics & Ops", color: "info" },
    { label: "Present Today", value: 17, icon: "CircleCheck", trend: "94.4% in shift", color: "success" },
    { label: "Team Leave Requests", value: 2, icon: "Inbox", trend: "Awaiting review", color: "warn" },
    { label: "Correction Requests", value: 3, icon: "Clock", trend: "Punch adjustments", color: "danger" },
  ],
  employee: [
    { label: "Days Present", value: 22, icon: "CircleCheck", trend: "This month", color: "success" },
    { label: "Leave Balance", value: 14, icon: "CalendarDays", trend: "Days remaining", color: "info" },
    { label: "Pending Requests", value: 1, icon: "Clock", trend: "Leave approval", color: "warn" },
    { label: "Next Payslip", value: "Sep 30", icon: "Wallet", trend: "In 7 days", color: "orange" },
  ],
  accountant: [
    { label: "Payroll Budget", value: "₹42.5L", icon: "Wallet", trend: "This month", color: "info" },
    { label: "Processed", value: 148, icon: "CircleCheck", trend: "Salaries cleared", color: "success" },
    { label: "Pending", value: 8, icon: "Clock", trend: "Awaiting approval", color: "warn" },
    { label: "Reimbursements", value: 15, icon: "FileText", trend: "To process", color: "danger" },
  ],
};

/* ── Recent Activity ── */
export const RECENT_ACTIVITIES = [
  { id: "a1", text: "Vijay Kumaran punched in via Mobile", time: "9:02 AM", type: "attendance" },
  { id: "a2", text: "Priya Sharma submitted Maternity leave application", time: "9:15 AM", type: "leave" },
  { id: "a3", text: "September payroll muster generated", time: "Yesterday", type: "payroll" },
  { id: "a4", text: "New staff member onboarded in Management Studies", time: "Yesterday", type: "employee" },
  { id: "a5", text: "Ananya approved 3 casual leave requests", time: "2 days ago", type: "leave" },
];

/* ── Announcements ── */
export const ANNOUNCEMENTS = [
  {
    id: "ann1",
    title: "Annual Campus Conclave & Convocation 2026",
    content: "All faculty and staff are invited to the grand annual convocation ceremony. Keynote by Executive Leadership.",
    date: "2026-09-20",
    priority: "info" as const,
    author: "Executive Secretariat",
  },
  {
    id: "ann2",
    title: "Revised Maternity & 3-Day Paternity Benefit Policy",
    content: "WeGrow announces enhanced leave benefits for parents effective this quarter. Check the HR handbook.",
    date: "2026-09-18",
    priority: "success" as const,
    author: "HR Directorate",
  },
  {
    id: "ann3",
    title: "Biometric Terminal Maintenance Schedule",
    content: "Main Gate terminals will undergo automated firmware updates at 10:00 PM tonight.",
    date: "2026-09-15",
    priority: "warn" as const,
    author: "Admin IT",
  },
];

/* ── Quick Actions per role ── */
export const QUICK_ACTIONS = {
  admin: [
    { label: "Add Employee", icon: "UserPlus", href: "/employees" },
    { label: "Salary Breakdown", icon: "Wallet", href: "/payroll" },
    { label: "Daily Office Bills", icon: "Receipt", href: "/expenses" },
    { label: "System Settings", icon: "Shield", href: "/settings" },
  ],
  ceo: [
    { label: "Executive Analytics", icon: "BarChart3", href: "/reports" },
    { label: "Staff Roster", icon: "Users", href: "/employees" },
    { label: "Confidential Feedback", icon: "Shield", href: "/feedback" },
    { label: "Strategic Circulars", icon: "Megaphone", href: "/announcements" },
  ],
  hr_manager: [
    { label: "Daily Master Sheet", icon: "ClipboardCheck", href: "/attendance" },
    { label: "Leave Approvals", icon: "CalendarDays", href: "/leave" },
    { label: "Onboard Employee", icon: "UserPlus", href: "/employees" },
    { label: "Generate Payslip", icon: "Wallet", href: "/payroll" },
  ],
  manager: [
    { label: "Team Attendance", icon: "UserCheck", href: "/attendance" },
    { label: "Leave Requests", icon: "ClipboardCheck", href: "/leave" },
    { label: "Kanban Tasks", icon: "Target", href: "/tasks" },
    { label: "Claim Reviews", icon: "Receipt", href: "/expenses" },
  ],
  employee: [
    { label: "Clock In / Out", icon: "Clock", href: "/attendance" },
    { label: "Apply Leave", icon: "CalendarDays", href: "/leave" },
    { label: "My Payslips", icon: "Wallet", href: "/payroll" },
    { label: "Kanban Tasks", icon: "Target", href: "/tasks" },
  ],
  accountant: [
    { label: "Process Payroll", icon: "Wallet", href: "/payroll" },
    { label: "Office Expenses", icon: "Receipt", href: "/expenses" },
    { label: "Financial Reports", icon: "BarChart3", href: "/reports" },
    { label: "Tax Statements", icon: "FileText", href: "/payroll" },
  ],
};
