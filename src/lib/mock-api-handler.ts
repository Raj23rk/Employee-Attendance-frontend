import { MOCK_USERS, MOCK_FULL_EMPLOYEE_LIST } from "./mock-data";
import { DEFAULT_BRANCHES, ATTENDANCE_POLICY_CONFIG } from "./constants";

export function getMockApiResponse(url: string, method: string = "GET", data?: any): any | null {
  const cleanUrl = url.replace(/^\/api\/v1/, "").replace(/\?.*$/, "");
  const storedUserJson = typeof window !== "undefined" ? localStorage.getItem("wg_user") : null;
  const currentUser = storedUserJson ? JSON.parse(storedUserJson) : MOCK_USERS["ceo@wegrow.edu.in"];

  // 1. Current User
  if (cleanUrl === "/users/me" || cleanUrl === "/auth/me") {
    return { statusCode: 200, success: true, data: currentUser };
  }

  // 2. Notifications
  if (cleanUrl === "/notifications") {
    return {
      statusCode: 200,
      success: true,
      data: [
        {
          id: "notif-1",
          title: "Biometric Punch Verified",
          message: "Your morning check-in at 09:35 AM was verified with Guindy Main Campus geofence.",
          createdAt: new Date().toISOString(),
          isRead: false,
          type: "ATTENDANCE",
        },
        {
          id: "notif-2",
          title: "Leave Policy Reminder",
          message: "Casual Leave quota for this month is 1 CL. Shift timings are 09:40 AM to 07:00 PM.",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          isRead: true,
          type: "POLICY",
        },
      ],
      unreadCount: 1,
    };
  }
  if (cleanUrl === "/notifications/read-all" || cleanUrl.startsWith("/notifications/") && cleanUrl.endsWith("/read")) {
    return { statusCode: 200, success: true, message: "Marked as read" };
  }
  if (cleanUrl === "/notifications/templates") {
    return {
      statusCode: 200,
      success: true,
      data: [
        { code: "LEAVE_APPLIED", name: "Leave Alert", subject: "Leave Application from {{employeeName}}" },
        { code: "LATE_CHECKIN_WARNING", name: "Late Arrival Warning", subject: "Attendance Alert: Late arrival logged" },
      ],
    };
  }

  // 3. Attendance Today & Punches
  if (cleanUrl === "/attendance/today") {
    return {
      statusCode: 200,
      success: true,
      data: {
        isCheckedIn: true,
        checkInTime: "09:35 AM",
        checkOutTime: "07:05 PM",
        status: "PRESENT",
        workMode: "office",
        shift: "09:40 AM - 07:00 PM (Grace: 09:45 AM)",
        location: {
          latitude: 13.0102,
          longitude: 80.2158,
          branchName: currentUser?.branch || "Chennai Main Campus",
          address: "Guindy Tech Zone, Chennai",
          isVerified: true,
        },
      },
    };
  }

  if (cleanUrl === "/attendance/check-in") {
    return {
      statusCode: 200,
      success: true,
      message: "Check-in successful at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      data: {
        checkInTime: new Date().toISOString(),
        status: "PRESENT",
        isWithinGrace: true,
      },
    };
  }

  if (cleanUrl === "/attendance/check-out") {
    return {
      statusCode: 200,
      success: true,
      message: "Check-out recorded successfully",
      data: {
        checkOutTime: new Date().toISOString(),
      },
    };
  }

  if (cleanUrl === "/attendance/permissions/my") {
    return {
      statusCode: 200,
      success: true,
      data: {
        monthlyLimitHours: 2.0,
        usedHours: 0.5,
        remainingHours: 1.5,
        exceedsLimit: false,
      },
    };
  }

  if (cleanUrl === "/attendance/permissions/apply" || cleanUrl === "/attendance/permissions") {
    return {
      statusCode: 200,
      success: true,
      message: "Monthly permission logged successfully.",
    };
  }

  if (cleanUrl === "/attendance/my-calendar") {
    return {
      statusCode: 200,
      success: true,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-09-${String(i + 1).padStart(2, "0")}`,
        status: i % 7 === 0 || i % 7 === 6 ? "WEEKEND" : i % 8 === 3 ? "LATE" : "PRESENT",
        checkIn: "09:35 AM",
        checkOut: "07:05 PM",
        hoursWorked: 8.5,
      })),
    };
  }

  if (cleanUrl === "/attendance/hr/policies") {
    return {
      statusCode: 200,
      success: true,
      data: ATTENDANCE_POLICY_CONFIG,
    };
  }

  // 4. Dashboard Overview & KPIs
  if (cleanUrl === "/dashboard/overview") {
    return {
      statusCode: 200,
      success: true,
      data: {
        totalEmployees: 156,
        presentCount: 148,
        onLeaveCount: 5,
        lateCount: 3,
        pendingApprovals: 4,
        attendanceRate: "94.8%",
        departmentHeadcount: [
          { department: "Technology", count: 42 },
          { department: "Human Resources", count: 12 },
          { department: "Management Studies", count: 38 },
          { department: "Computer Applications", count: 34 },
          { department: "Finance & Accounts", count: 18 },
          { department: "Executive Office", count: 12 },
        ],
      },
    };
  }

  if (cleanUrl === "/dashboard/celebrations") {
    return {
      statusCode: 200,
      success: true,
      data: [
        {
          id: "cel-1",
          name: "Dr. Arvind Varma",
          type: "ANNIVERSARY",
          date: "Sep 29",
          department: "Executive Office",
          avatar: "",
        },
        {
          id: "cel-2",
          name: "Ananya Deshmukh",
          type: "BIRTHDAY",
          date: "Oct 02",
          department: "Human Resources",
          avatar: "",
        },
      ],
    };
  }

  if (cleanUrl === "/dashboard/holidays-spotlight") {
    return {
      statusCode: 200,
      success: true,
      data: [
        { id: "hol-1", name: "Gandhi Jayanti", date: "2026-10-02", type: "National Holiday" },
        { id: "hol-2", name: "Ayudha Puja / Dussehra", date: "2026-10-19", type: "Gazetted Holiday" },
        { id: "hol-3", name: "Diwali Festival", date: "2026-11-08", type: "Gazetted Holiday" },
      ],
    };
  }

  if (cleanUrl === "/dashboard/on-leave-today") {
    return {
      statusCode: 200,
      success: true,
      data: [
        { id: "ol-1", name: "Priya Sharma", role: "Frontend Developer", department: "Technology", type: "Casual Leave" },
        { id: "ol-2", name: "Karthik Sundaram", role: "AI Researcher", department: "Artificial Intelligence", type: "Sick Leave" },
      ],
    };
  }

  if (cleanUrl === "/dashboard/hours-logged-chart") {
    return {
      statusCode: 200,
      success: true,
      data: [
        { day: "Mon", hours: 8.5, expected: 8.5 },
        { day: "Tue", hours: 8.6, expected: 8.5 },
        { day: "Wed", hours: 8.4, expected: 8.5 },
        { day: "Thu", hours: 8.5, expected: 8.5 },
        { day: "Fri", hours: 8.5, expected: 8.5 },
      ],
    };
  }

  // 5. HR/CEO Employees List & Popup
  if (cleanUrl === "/dashboard/hr-ceo/employees" || cleanUrl === "/users" || cleanUrl === "/directory") {
    return {
      statusCode: 200,
      success: true,
      data: MOCK_FULL_EMPLOYEE_LIST,
    };
  }

  if (cleanUrl.startsWith("/dashboard/hr-ceo/employees/") && cleanUrl.endsWith("/popup")) {
    const parts = cleanUrl.split("/");
    const empId = parts[parts.length - 2];
    const match = MOCK_FULL_EMPLOYEE_LIST.find((e) => e.id === empId || e.employeeId === empId) || MOCK_FULL_EMPLOYEE_LIST[0];
    return {
      statusCode: 200,
      success: true,
      data: match,
    };
  }

  // 6. Branches
  if (cleanUrl === "/branches") {
    return {
      statusCode: 200,
      success: true,
      data: DEFAULT_BRANCHES,
    };
  }

  // 7. Announcements / Engage
  if (cleanUrl === "/engage/announcements" || cleanUrl === "/announcements") {
    return {
      statusCode: 200,
      success: true,
      data: [
        {
          id: "anc-1",
          title: "Campus Shift Timing Alignment Notice",
          body: "All academic faculty and operations staff: Standard shift starts at 09:40 AM with grace period up to 09:45 AM. Checkout target is 07:00 PM.",
          category: "Policy Notice",
          createdAt: new Date().toISOString(),
          authorName: "Executive Office",
          likesCount: 24,
        },
      ],
    };
  }

  // 8. Leaves
  if (cleanUrl === "/leaves/balances") {
    return {
      statusCode: 200,
      success: true,
      data: {
        casual: 12,
        casualUsed: 0,
        sick: 10,
        sickUsed: 0,
        maternity: 180,
        paternity: 15,
        lopDays: 0,
      },
    };
  }

  if (cleanUrl === "/leaves/hr/list" || cleanUrl === "/leaves/hr/all" || cleanUrl === "/leaves/manager/team-requests") {
    return {
      statusCode: 200,
      success: true,
      data: [
        {
          id: "lv-101",
          employeeId: "WG-FAC-014",
          employeeName: "Priya Sharma",
          branch: "Chennai Main Campus",
          department: "Management Studies",
          leaveType: "CASUAL",
          fromDate: "2026-10-02",
          toDate: "2026-10-02",
          days: 1,
          reason: "Personal family engagement",
          status: "APPROVED",
          isLop: false,
          createdAt: "2026-09-28",
        },
        {
          id: "lv-102",
          employeeId: "WG-FAC-028",
          employeeName: "Vijay Kumaran",
          branch: "Bangalore Tech Hub",
          department: "Computer Applications",
          leaveType: "SICK",
          fromDate: "2026-09-22",
          toDate: "2026-09-24",
          days: 3,
          reason: "Severe viral fever & throat infection",
          medicalCertificateUrl: "/uploads/medical_cert_vijay.pdf",
          medicalCertificateName: "apollo_clinic_prescription.pdf",
          status: "APPROVED",
          isLop: false,
          createdAt: "2026-09-21",
        },
      ],
    };
  }

  // 9. Payroll
  if (cleanUrl === "/payroll/salary-structure") {
    return {
      statusCode: 200,
      success: true,
      data: {
        basic: 42500,
        hra: 21250,
        specialAllowance: 21250,
        pfDeduction: 3600,
        tdsDeduction: 3200,
        netSalary: 78200,
      },
    };
  }

  if (cleanUrl === "/payroll/my-payslips" || cleanUrl === "/payroll/all-payslips") {
    return {
      statusCode: 200,
      success: true,
      data: [
        { id: "ps-1", monthYear: "August 2026", netPay: 78200, status: "PAID", paymentDate: "2026-08-31" },
        { id: "ps-2", monthYear: "July 2026", netPay: 78200, status: "PAID", paymentDate: "2026-07-31" },
      ],
    };
  }

  // 10. Organization & Departments
  if (cleanUrl === "/organization/departments") {
    return {
      statusCode: 200,
      success: true,
      data: ["Technology", "Human Resources", "Management Studies", "Computer Applications", "Finance & Accounts", "Executive Office"],
    };
  }

  // Default fallback for any other GET request
  if (method === "GET") {
    return { statusCode: 200, success: true, data: [] };
  }

  // Default fallback for mutations
  return { statusCode: 200, success: true, message: "Action recorded successfully." };
}
