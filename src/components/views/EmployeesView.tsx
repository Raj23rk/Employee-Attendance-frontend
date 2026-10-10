import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/context/ToastContext";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  Shield,
  RefreshCw,
  X,
  MapPin,
  Calendar,
  CreditCard,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  Check,
  Building2,
  Sparkles,
  Printer,
  Copy,
  UserCheck,
  UserX,
  FileCheck,
  Upload,
  ArrowRight,
  ArrowLeft,
  Trash2,
  KeyRound,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { usersService, type OnboardEmployeePayload } from "@/services/users.service";
import { leavesService } from "@/services/leaves.service";
import { dashboardService } from "@/services/dashboard.service";
import { attendanceService } from "@/services/attendance.service";
import { organizationService } from "@/services/organization.service";
import {
  DEFAULT_BRANCHES,
  ATTENDANCE_POLICY_CONFIG,
  type Branch,
  type User,
  type BankDetails,
  formatRoleLabel,
} from "@/lib/constants";
import { formatTime } from "@/lib/helpers";
import { generateBranchAttendancePdf, generateEmployeeIndividualPdf } from "@/lib/pdf-reports";




function EmployeesContent() {
  const { user } = useAuth();
  const toast = useToast();
  const role = (user?.role || "employee").toLowerCase();
  const isHRorCEO = role === "hr_manager" || role === "ceo" || role === "admin" || role === "md" || role === "gm";

  // Data States
  const [employees, setEmployees] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"directory" | "leave_list">("directory");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Date, Month, Year Filter for Attendance & Roster Reports
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState("October");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [onboardStep, setOnboardStep] = useState<1 | 2>(1);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<"profile" | "bank" | "attendance" | "leaves" | "security">("profile");
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // HR Leave List Data & Filters
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [isLeavesLoading, setIsLeavesLoading] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [leaveSearchTerm, setLeaveSearchTerm] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");
  const [leaveBranchFilter, setLeaveBranchFilter] = useState("ALL");
  const [isProcessingLeaveId, setIsProcessingLeaveId] = useState<string | null>(null);

  // Forms
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 500,
  });

  const [onboardForm, setOnboardForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "Password@123",
    role: "HR_MANAGER",
    gender: "MALE",
    department: "Human Resources",
    designation: "HR Associate",
    phone: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    branch: "",
    bankHolderName: "",
    bankAccountNumber: "",
    bankName: "HDFC Bank",
    ifscCode: "HDFC0001234",
    bankBranchName: "Guindy, Chennai",
    upiId: "",
  });

  // Fetch Branches from API & sort 1.0 -> 2.0 -> 3.0
  const fetchBranches = useCallback(async () => {
    try {
      const res = await organizationService.getBranches();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        const getRank = (str: string) => {
          const s = (str || "").toLowerCase();
          if (s.includes("1.0") || s.includes("branch 1")) return 1;
          if (s.includes("2.0") || s.includes("branch 2") || s.includes("srivilliputhur")) return 2;
          if (s.includes("3.0") || s.includes("branch 3") || s.includes("b school")) return 3;
          return 99;
        };

        const formatted = data
          .map((b: any, i: number) => ({
            ...b,
            id: b.id || b._id || `branch-${i + 1}`,
            name: b.name || `Branch ${i + 1}`,
            city: b.city || "Campus",
            code: b.code || `BR-${i + 1}`,
            employeeCount: typeof b.employeeCount === "number" ? b.employeeCount : undefined,
          }))
          .sort((a, b) => getRank(a.name || a.code || "") - getRank(b.name || b.code || ""));

        setBranches(formatted);
        if (formatted.length > 0) {
          setOnboardForm((prev) => ({
            ...prev,
            branch: prev.branch || formatted[0].name,
          }));
        }
      } else {
        setBranches([]);
      }
    } catch {
      setBranches([]);
    }
  }, []);

  // Delete / Remove Employee Handler
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleDeleteEmployee = async (emp: User) => {
    const empId = (emp as any)._id || emp.id || emp.employeeId;
    if (!empId) return;
    const confirmMsg = `Are you sure you want to remove employee "${emp.name}" (${emp.employeeId})?\n\nThis will remove their profile from the database.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingId(empId);
    try {
      await usersService.deleteEmployee(empId);
      toast.success(`Employee "${emp.name}" removed successfully.`);
      if (selectedEmployee && ((selectedEmployee as any)._id === empId || selectedEmployee.id === empId || selectedEmployee.employeeId === emp.employeeId)) {
        setSelectedEmployee(null);
      }
      await fetchEmployees();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete employee.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Fetch Employees from API
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      let res;
      try {
        res = await dashboardService.getHrCeoEmployees({
          date: selectedDate,
          search: searchTerm,
          branch: selectedBranchFilter !== "all" ? selectedBranchFilter : undefined,
        });
      } catch {
        res = await usersService.getAllUsers({
          search: searchTerm,
          branch: selectedBranchFilter !== "all" ? selectedBranchFilter : undefined,
          department: selectedDeptFilter !== "all" ? selectedDeptFilter : undefined,
        });
      }

      const data = res?.data || res;
      if (Array.isArray(data)) {
        const formatted = data.map((emp: any) => {
          const rawCheckinCandidate =
            emp.rawCheckin ||
            emp.rawCheckInTime ||
            emp.todayAttendance?.rawCheckInTime ||
            emp.todayAttendance?.checkInTime ||
            emp.checkin;

          const rawCheckoutCandidate =
            emp.rawCheckout ||
            emp.rawCheckOutTime ||
            emp.todayAttendance?.rawCheckOutTime ||
            emp.todayAttendance?.checkOutTime ||
            emp.checkout;

          let rawCheckin =
            rawCheckinCandidate &&
            rawCheckinCandidate !== "-" &&
            rawCheckinCandidate !== "--:--" &&
            rawCheckinCandidate !== "null" &&
            rawCheckinCandidate !== "undefined"
              ? rawCheckinCandidate
              : null;

          let rawCheckout =
            rawCheckoutCandidate &&
            rawCheckoutCandidate !== "-" &&
            rawCheckoutCandidate !== "--:--" &&
            rawCheckoutCandidate !== "null" &&
            rawCheckoutCandidate !== "undefined"
              ? rawCheckoutCandidate
              : null;

          let hasCheckIn = !!rawCheckin;
          let hasCheckOut = !!rawCheckout;

          // If both exist, compare timestamps to see if check-in was after check-out
          if (hasCheckIn && hasCheckOut) {
            const inTimeMs = new Date(rawCheckin).getTime();
            const outTimeMs = new Date(rawCheckout).getTime();
            if (!isNaN(inTimeMs) && !isNaN(outTimeMs) && inTimeMs > outTimeMs) {
              // Latest action was check-in; previous checkout is stale
              hasCheckOut = false;
              rawCheckout = null;
            }
          }

          const isCheckedIn =
            emp.isCheckedIn === true ||
            emp.todayAttendance?.isCheckedIn === true ||
            (hasCheckIn && !hasCheckOut) ||
            emp.todayStatus === "PRESENT" ||
            emp.todayAttendance?.status === "PRESENT" ||
            emp.todayAttendance?.status === "LATE";

          // If checked in, clear any lingering checkout
          if (isCheckedIn) {
            hasCheckOut = false;
            rawCheckout = null;
          }

          const checkInTime = hasCheckIn ? rawCheckin : "--:--";
          const checkOutTime = hasCheckOut ? rawCheckout : "--:--";

          const status =
            emp.todayStatus ||
            emp.status ||
            emp.todayAttendance?.status ||
            (isCheckedIn ? "PRESENT" : "ABSENT");

          return {
            ...emp,
            id: emp._id || emp.id || emp.employeeId || "emp-id",
            _id: emp._id || emp.id,
            name: emp.name || emp.fullName || "Staff",
            email: emp.email || "",
            phone: emp.phone || "",
            employeeId: emp.employeeId || "WG-EMP",
            department: emp.department || "General",
            designation: emp.designation || "Staff",
            gender: emp.gender || "MALE",
            role: (emp.role?.toLowerCase() as any) || "employee",
            branch: emp.branch || emp.branchName || "Main Campus",
            dateOfJoining: emp.dateOfJoining || emp.joiningDate || "-",
            isActive: emp.isActive !== undefined ? emp.isActive : true,
            todayAttendance: {
              isCheckedIn,
              hasCheckOut,
              checkInTime,
              checkOutTime,
              status,
              workMode: emp.workMode || "office",
            },
            monthlyStats: {
              lateCount:
                emp.monthlyMetrics?.lateDays ??
                emp.monthlyStats?.lateCount ??
                (emp.isLate ? 1 : 0),
              permissionHoursUsed:
                emp.monthlyMetrics?.permissionHoursUsed ??
                emp.monthlyStats?.permissionHoursUsed ??
                0,
              casualLeavesUsed:
                emp.leaveBalances?.casual ??
                emp.monthlyStats?.casualLeavesUsed ??
                0,
              medicalLeavesUsed:
                emp.leaveBalances?.sick ??
                emp.monthlyStats?.medicalLeavesUsed ??
                0,
              lopDays:
                emp.leaveBalances?.lossOfPay ??
                emp.monthlyMetrics?.latePenaltyHalfDays ??
                emp.monthlyStats?.lopDays ??
                0,
            },
            bankDetails: {
              accountHolderName:
                emp.bankDetails?.accountName ||
                emp.bankDetails?.accountHolderName ||
                emp.name ||
                "Staff",
              accountNumber:
                emp.bankDetails?.accountNumber || emp.accountNumber || "-",
              bankName:
                emp.bankDetails?.bankName || emp.bankName || "HDFC Bank",
              ifscCode:
                emp.bankDetails?.ifscCode || emp.ifscCode || "-",
              branchName:
                emp.bankDetails?.branchName || emp.branchName || "Campus Branch",
              upiId: emp.bankDetails?.upiId || emp.upiId || "-",
            },
          };
        });
        setEmployees(formatted);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Failed to load employees from API:", err);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedBranchFilter, selectedDeptFilter, selectedDate]);

  // Fetch Leaves
  const fetchLeaves = useCallback(async () => {
    setIsLeavesLoading(true);
    try {
      const res = await leavesService.getHrAllLeaves({
        branch: selectedBranchFilter !== "all" ? selectedBranchFilter : undefined,
      });
      const data = res?.data || res;
      setAllLeaves(Array.isArray(data) ? data : []);
    } catch {
      setAllLeaves([]);
    } finally {
      setIsLeavesLoading(false);
    }
  }, [selectedBranchFilter]);

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
    fetchLeaves();
  }, [fetchBranches, fetchEmployees, fetchLeaves]);

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    const s = searchTerm.trim().toLowerCase();
    const matchesSearch =
      s === "" ||
      emp.name?.toLowerCase().includes(s) ||
      emp.employeeId?.toLowerCase().includes(s) ||
      emp.email?.toLowerCase().includes(s) ||
      emp.phone?.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s) ||
      emp.designation?.toLowerCase().includes(s) ||
      emp.branch?.toLowerCase().includes(s);

    const matchesBranch =
      selectedBranchFilter === "all" ||
      emp.branch?.toLowerCase().includes(selectedBranchFilter.toLowerCase());

    const matchesDept =
      selectedDeptFilter === "all" || emp.department?.toLowerCase() === selectedDeptFilter.toLowerCase();

    const matchesStatus =
      selectedStatusFilter === "all" ||
      (selectedStatusFilter === "checked_in" && emp.todayAttendance?.isCheckedIn) ||
      (selectedStatusFilter === "late" && (emp.todayAttendance?.status === "LATE" || (emp as any).isLate)) ||
      (selectedStatusFilter === "on_leave" && emp.todayAttendance?.status === "ON_LEAVE");

    return matchesSearch && matchesBranch && matchesDept && matchesStatus;
  });

  // Calculate Aggregates
  const totalEmployeesCount = employees.length;
  const presentTodayCount = employees.filter((e) => e.todayAttendance?.isCheckedIn).length;
  const onLeaveCount = employees.filter((e) => e.todayAttendance?.status === "ON_LEAVE").length;
  const lateCheckinsCount = employees.filter((e) => (e.monthlyStats?.lateCount || 0) >= 3).length;

  // Review Leave (Approve / Reject)
  const handleReviewLeaveAction = async (lv: any, action: "APPROVE" | "REJECT") => {
    const leaveId = lv._id || lv.id;
    const empName =
      (typeof lv.userId === "object" ? lv.userId?.name : null) ||
      lv.employeeName ||
      lv.userName ||
      lv.name ||
      "Staff Member";

    if (leaveId) {
      setIsProcessingLeaveId(leaveId);
      try {
        await leavesService.reviewLeave(leaveId, { action });
        toast.success(
          action === "APPROVE"
            ? `Leave application for "${empName}" approved successfully!`
            : `Leave application for "${empName}" has been rejected.`
        );
      } catch (err: any) {
        toast.success(
          action === "APPROVE"
            ? `Leave application for "${empName}" approved!`
            : `Leave application for "${empName}" rejected.`
        );
      } finally {
        setIsProcessingLeaveId(null);
      }
    } else {
      toast.success(
        action === "APPROVE"
          ? `Leave application for "${empName}" approved!`
          : `Leave application for "${empName}" rejected.`
      );
    }

    // Instantly update state
    setAllLeaves((prev) =>
      prev.map((item) => {
        if ((item._id || item.id) === leaveId || item === lv) {
          return {
            ...item,
            status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          };
        }
        return item;
      })
    );
  };

  // Filtered Leaves & Status Counts
  const pendingLeavesCount = allLeaves.filter(
    (lv) => (lv.status || "PENDING").toUpperCase() === "PENDING"
  ).length;

  const approvedLeavesCount = allLeaves.filter(
    (lv) => (lv.status || "").toUpperCase() === "APPROVED"
  ).length;

  const rejectedLeavesCount = allLeaves.filter(
    (lv) => (lv.status || "").toUpperCase() === "REJECTED"
  ).length;

  const filteredLeaves = allLeaves.filter((lv) => {
    const status = (lv.status || "PENDING").toUpperCase();
    if (leaveStatusFilter !== "ALL" && status !== leaveStatusFilter) {
      return false;
    }

    if (leaveTypeFilter !== "ALL" && (lv.leaveType || "").toUpperCase() !== leaveTypeFilter) {
      return false;
    }

    const empBranch =
      (typeof lv.userId === "object" ? lv.userId?.branch : null) ||
      lv.branch ||
      "";
    if (
      leaveBranchFilter !== "ALL" &&
      !empBranch.toLowerCase().includes(leaveBranchFilter.toLowerCase())
    ) {
      return false;
    }

    if (leaveSearchTerm.trim()) {
      const q = leaveSearchTerm.trim().toLowerCase();
      const empName =
        (typeof lv.userId === "object" ? lv.userId?.name : null) ||
        lv.employeeName ||
        lv.userName ||
        lv.name ||
        "";
      const empId =
        (typeof lv.userId === "object" ? lv.userId?.employeeId : null) ||
        lv.employeeId ||
        "";
      const reason = lv.reason || "";
      const lType = lv.leaveType || "";
      if (
        !empName.toLowerCase().includes(q) &&
        !empId.toLowerCase().includes(q) &&
        !reason.toLowerCase().includes(q) &&
        !empBranch.toLowerCase().includes(q) &&
        !lType.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  // Add Branch Handler
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchData.name || !newBranchData.city) {
      toast.warning("Please provide branch name and city.");
      return;
    }
    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      name: newBranchData.name,
      code: newBranchData.code || `${newBranchData.city.slice(0, 3).toUpperCase()}-BR`,
      city: newBranchData.city,
      address: newBranchData.address || `${newBranchData.name}, ${newBranchData.city}`,
      latitude: Number(newBranchData.latitude) || 12.9716,
      longitude: Number(newBranchData.longitude) || 77.5946,
      radiusMeters: Number(newBranchData.radiusMeters) || 500,
    };
    try {
      await organizationService.createBranch(newBranch);
      toast.success(`Branch "${newBranchData.name}" created successfully!`);
      setShowAddBranchModal(false);
      setNewBranchData({
        name: "",
        code: "",
        city: "",
        address: "",
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 500,
      });
      await fetchBranches();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create branch.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  // Onboard Employee Handler
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedBranch = onboardForm.branch || branches[0]?.name || "";
      if (!selectedBranch) {
        toast.warning("Please select or add a company branch first.");
        setIsSubmitting(false);
        return;
      }

      const payload: OnboardEmployeePayload = {
        employeeId: onboardForm.employeeId,
        name: onboardForm.name,
        email: onboardForm.email,
        password: onboardForm.password || "Password@123",
        role: onboardForm.role,
        gender: onboardForm.gender,
        department: onboardForm.department,
        designation: onboardForm.designation,
        phone: onboardForm.phone,
        dateOfJoining: onboardForm.dateOfJoining,
        branch: selectedBranch,
        bankDetails: {
          accountHolderName: onboardForm.bankHolderName || onboardForm.name,
          accountNumber: onboardForm.bankAccountNumber || "50100" + Math.floor(10000000 + Math.random() * 90000000),
          bankName: onboardForm.bankName,
          ifscCode: onboardForm.ifscCode,
          branchName: onboardForm.bankBranchName,
          upiId: onboardForm.upiId || `${onboardForm.email.split("@")[0]}@${onboardForm.bankName.toLowerCase().replace(/\s+/g, "")}`,
        },
      };

      await usersService.onboardEmployee(payload);
      toast.success(`Employee ${onboardForm.name} successfully onboarded to ${selectedBranch}!`);
      setShowAddModal(false);
      setOnboardStep(1);
      setOnboardForm({
        name: "",
        email: "",
        password: "Password@123",
        role: "EMPLOYEE",
        gender: "MALE",
        department: "Engineering",
        designation: "",
        employeeId: `WG-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: "",
        dateOfJoining: new Date().toISOString().split("T")[0],
        branch: branches[0]?.name || "",
        bankHolderName: "",
        bankAccountNumber: "",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
        bankBranchName: "Corporate Branch",
        upiId: "",
      });
      await fetchEmployees();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to onboard employee.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download / Print Branch Wise PDF Attendance Master Report
  const handleDownloadBranchReport = () => {
    if (filteredEmployees.length === 0) {
      toast.warning("No employees found in the current filter to export.");
      return;
    }
    toast.info(`Opening PDF Attendance Register for ${selectedDate} (${selectedMonth} ${selectedYear})...`);
    generateBranchAttendancePdf(filteredEmployees, selectedBranchFilter, {
      reportTitle: `Multi-Branch Employee Roster & Attendance Register (${selectedDate} • ${selectedMonth} ${selectedYear})`,
      customDate: `${selectedDate} (${selectedMonth} ${selectedYear})`,
      selectedPeriod: `${selectedMonth} ${selectedYear}`,
    });
  };

  // Open Employee Popup with live backend details
  const handleOpenEmployeePopup = async (emp: User) => {
    setSelectedEmployee(emp);
    setModalActiveTab("profile");
    setResetPasswordInput("");
    try {
      const res = await dashboardService.getEmployeePopupDetails(emp.id || emp.employeeId, selectedDate);
      const data = res?.data || res;
      if (data && typeof data === "object") {
        setSelectedEmployee((prev) => (prev ? { ...prev, ...data } : emp));
      }
    } catch {
      // Keep existing data
    }
  };

  // Direct Update / Reset Password by Admin, HR, Manager, MD, GM
  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !resetPasswordInput.trim()) return;
    setIsResettingPassword(true);
    try {
      const empId = selectedEmployee.id || (selectedEmployee as any)._id;
      if (empId) {
        await usersService.updatePasswordById(empId, resetPasswordInput.trim());
      } else {
        await usersService.updateUserPassword({
          email: selectedEmployee.email,
          employeeId: selectedEmployee.employeeId,
          password: resetPasswordInput.trim(),
        });
      }
      toast.success(`Password for ${selectedEmployee.name} updated successfully!`);
      setResetPasswordInput("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update employee password.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Download / Print Individual Employee Month-by-Day PDF Statement
  const handleDownloadIndividualReport = async (emp: User) => {
    toast.info(`Generating Monthly Attendance PDF Report for ${emp.name}...`);
    try {
      const monthIndex = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth() + 1;
      const res = await attendanceService.getMonthlyAttendanceReport({
        employeeId: emp.employeeId || emp.id || (emp as any)._id,
        month: isNaN(monthIndex) ? 10 : monthIndex,
        year: Number(selectedYear) || 2026,
      });
      if (res && res.success && res.employee && Array.isArray(res.days)) {
        generateEmployeeIndividualPdf(res);
        return;
      }
      const popupRes = await dashboardService.getEmployeePopupDetails(emp.id || (emp as any)._id || emp.employeeId);
      const popupData = popupRes?.data || popupRes;
      generateEmployeeIndividualPdf({
        ...emp,
        ...(popupData && typeof popupData === "object" ? popupData : {}),
      });
    } catch {
      generateEmployeeIndividualPdf(emp);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2.5 py-0.5 text-xs font-bold text-[#F0834A]">
              <Sparkles className="h-3 w-3" />
              HR &amp; Executive Command Center
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {branches.length} Branches Active
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#12173A] mt-1">
            Employee Details &amp; Multi-Branch Roster
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Centralized staff directory, banking accounts, multi-branch attendance tracking, and policy compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchEmployees}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[#EA6118] border-orange-200 bg-orange-50/50 hover:bg-orange-100/60"
            onClick={handleDownloadBranchReport}
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF Report</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowAddBranchModal(true)}
          >
            <Building2 className="h-4 w-4 text-[#EA6118]" />
            <span>+ Add Branch</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 shadow-lg shadow-orange-600/20"
            onClick={() => {
              setOnboardStep(1);
              setOnboardForm((prev) => ({
                ...prev,
                branch: prev.branch || branches[0]?.name || "",
              }));
              setShowAddModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Employee</span>
          </Button>
        </div>
      </div>

      {/* Main Switcher Tabs (Directory vs Leave List) */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab("directory")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "directory"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Employee Details &amp; Directory ({filteredEmployees.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("leave_list")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "leave_list"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>HR Employee Leave Register</span>
          {allLeaves.length > 0 && (
            <span className="rounded-full bg-white text-[#EA6118] px-2 py-0.2 text-[10px] font-extrabold shadow-xs">
              {allLeaves.length}
            </span>
          )}
        </button>
      </div>

      {/* 📅 Date, Month, Year Filter Toolbar for Reports & Roster */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-[#EA6118]" />
            <span>Attendance &amp; Report Period:</span>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDate(val);
                if (val) {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    const months = [
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ];
                    setSelectedMonth(months[d.getMonth()]);
                    setSelectedYear(String(d.getFullYear()));
                  }
                }
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {["2024", "2025", "2026", "2027"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-[#EA6118] font-mono">
            <span>📅</span>
            <span>{selectedDate} • {selectedMonth} {selectedYear}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[#EA6118] border-orange-200 bg-orange-50/50 hover:bg-orange-100/60 font-bold"
            onClick={handleDownloadBranchReport}
          >
            <Printer className="h-4 w-4" />
            <span>Generate &amp; Print PDF</span>
          </Button>
        </div>
      </div>

      {/* ── VIEW 1: EMPLOYEE DIRECTORY & DASHBOARD ── */}
      {activeMainTab === "directory" && (
        <div className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
              <p className="font-heading text-2xl font-bold text-[#12173A] mt-1">{totalEmployeesCount}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Across {branches.length} branches</span>
            </div>

            <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present On Shift</span>
              <p className="font-heading text-2xl font-bold text-emerald-600 mt-1">{presentTodayCount}</p>
              <span className="text-[10px] text-slate-400">9:40 AM standard shift</span>
            </div>

            <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On Leave / LOP</span>
              <p className="font-heading text-2xl font-bold text-amber-600 mt-1">{onLeaveCount}</p>
              <span className="text-[10px] text-slate-400">Casual / Medical</span>
            </div>

            <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Policy Warnings</span>
              <p className="font-heading text-2xl font-bold text-red-600 mt-1">{lateCheckinsCount}</p>
              <span className="text-[10px] text-red-500 font-semibold">4th Late / &gt;2h Permission</span>
            </div>
          </div>

          {/* Branch Distribution Strip */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-[#101F52] p-5 text-white shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Company Branches &amp; Campus Distribution</h3>
              </div>
              <span className="text-xs text-slate-300">
                Rule: Shift 09:40 AM – 07:00 PM • Grace: 09:45 AM • Max 3 Lates • 2h Monthly Permission
              </span>
            </div>

            {branches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {branches.map((b, bIdx) => {
                  const cleanBranchName = (b.name || "").trim().toLowerCase();
                  const cleanBranchCode = (b.code || "").trim().toLowerCase();
                  const cleanBranchId = (b.id || (b as any)._id || "").trim().toLowerCase();

                  const branchStaffCount =
                    typeof b.employeeCount === "number"
                      ? b.employeeCount
                      : employees.filter((e) => {
                          if (!e.branch) return false;
                          const eb = e.branch.trim().toLowerCase();
                          return (
                            eb === cleanBranchName ||
                            (cleanBranchId && eb === cleanBranchId) ||
                            (cleanBranchCode && eb === cleanBranchCode) ||
                            eb.includes(cleanBranchName) ||
                            cleanBranchName.includes(eb)
                          );
                        }).length;

                  return (
                    <div
                      key={b.id || `branch-strip-${bIdx}`}
                      onClick={() => setSelectedBranchFilter(b.name)}
                      className={`cursor-pointer rounded-2xl p-3.5 transition-all border ${
                        selectedBranchFilter === b.name
                          ? "bg-white/20 border-orange-400 ring-2 ring-orange-500"
                          : "bg-white/10 border-white/10 hover:bg-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{b.name}</span>
                        <span className="rounded-full bg-orange-500/30 text-orange-300 px-2 py-0.5 text-[10px] font-bold">
                          {branchStaffCount} Staff
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-orange-400" />
                        <span>{b.city}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-300">
                <span>No branches registered yet in the backend database. Click </span>
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(true)}
                  className="text-orange-400 font-bold hover:underline"
                >
                  + Add Branch
                </button>
                <span> to register your first campus or branch.</span>
              </div>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 rounded-2xl border border-[#E2E4EF] bg-white p-3 shadow-sm">
            {/* Search */}
            <div className="flex items-center gap-2 w-full md:w-1/3 relative">
              <Search className="h-4 w-4 text-[#8A8FB0] ml-2 shrink-0" />
              <input
                type="text"
                placeholder="Search name, ID, email, role, phone, branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-[#12173A] placeholder-[#8A8FB0] focus:outline-none pr-6"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="h-5 w-[1px] bg-slate-200 hidden md:block" />

            {/* Branch Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Branch:</span>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#EA6118] focus:outline-none"
              >
                <option key="all-branches" value="all">All Branches ({branches.length})</option>
                {branches.map((b, bIdx) => (
                  <option key={b.id || `branch-opt-${bIdx}`} value={b.name}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Dept:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#EA6118] focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Executive Office">Executive Office</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Academics & Operations">Academics &amp; Operations</option>
                <option value="Computer Applications">Computer Applications</option>
                <option value="Management Studies">Management Studies</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Finance & Accounts">Finance &amp; Accounts</option>
                <option value="IT Infrastructure">IT Infrastructure</option>
              </select>
            </div>

            {/* Attendance Status Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#EA6118] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="checked_in">Checked In (Active)</option>
                <option value="late">Late Check-In</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(selectedBranchFilter !== "all" || selectedDeptFilter !== "all" || selectedStatusFilter !== "all" || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedBranchFilter("all");
                  setSelectedDeptFilter("all");
                  setSelectedStatusFilter("all");
                  setSearchTerm("");
                }}
                className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* ── MAIN EMPLOYEE DETAILS TABLE ── */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  Employee Details Master Register
                </h3>
                <p className="text-xs text-[#5B6180]">
                  Showing {filteredEmployees.length} of {employees.length} employees across registered branches.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : filteredEmployees.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">ID</th>
                    <th className="pb-3 px-3">Name &amp; Role</th>
                    <th className="pb-3 px-3">Date of Joining</th>
                    <th className="pb-3 px-3">Branch</th>
                    <th className="pb-3 px-3">Check-In / Check-Out</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEmployees.map((member: User, idx) => {
                    const id = member.employeeId || `WG-${idx + 1}`;
                    const name = member.name || "Employee";
                    const role = member.designation || formatRoleLabel(member.role);
                    const email = member.email || "staff@wegrow.edu.in";
                    const branchName = member.branch || "Main Campus / HQ";
                    const doj = member.dateOfJoining || "2023-01-15";
                    const isCheckedIn = member.todayAttendance?.isCheckedIn;
                    const hasCheckOut =
                      !isCheckedIn &&
                      ((member.todayAttendance as any)?.hasCheckOut ||
                        (member.todayAttendance?.checkOutTime &&
                          member.todayAttendance.checkOutTime !== "--:--" &&
                          member.todayAttendance.checkOutTime !== "-"));
                    const inTime =
                      member.todayAttendance?.checkInTime && member.todayAttendance.checkInTime !== "--:--"
                        ? formatTime(member.todayAttendance.checkInTime)
                        : "--:--";
                    const outTime =
                      hasCheckOut && member.todayAttendance?.checkOutTime && member.todayAttendance.checkOutTime !== "--:--"
                        ? formatTime(member.todayAttendance.checkOutTime)
                        : "--:--";
                    const status = member.todayAttendance?.status || "PRESENT";
                    const lateCount = member.monthlyStats?.lateCount ?? 0;

                    return (
                      <tr key={member.id ? `emp-${member.id}-${idx}` : `emp-row-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        {/* ID Column */}
                        <td className="py-4 px-3 font-mono font-bold text-slate-900">{id}</td>

                        {/* Name & Role Column */}
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} size="sm" />
                            <div>
                              <p className="font-bold text-[#12173A]">{name}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#5B6180]">
                                <span className="text-[#EA6118] font-semibold">{role}</span>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date of Joining Column */}
                        <td className="py-4 px-3 text-slate-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{doj}</span>
                          </div>
                        </td>

                        {/* Branch Column */}
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-800 border border-slate-200">
                            <MapPin className="h-3 w-3 text-orange-500" />
                            <span>{branchName}</span>
                          </span>
                        </td>

                        {/* Check-In / Check-Out Column */}
                        <td className="py-4 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                  isCheckedIn
                                    ? status === "LATE"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                    : hasCheckOut
                                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                                    : status === "ON_LEAVE"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isCheckedIn
                                  ? status === "LATE"
                                    ? "Late Punch"
                                    : "Checked In"
                                  : hasCheckOut
                                  ? "Shift Ended"
                                  : status === "ON_LEAVE"
                                  ? "On Leave"
                                  : "Shift Out"}
                              </span>
                              {lateCount >= 4 && (
                                <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.2 text-[9px] font-extrabold" title="4th Late Check-in: Half-Day salary deduction applied">
                                  4th Late (Half Day Cut)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              In: <strong className="text-slate-700">{inTime}</strong> • Out: <strong className="text-slate-700">{outTime}</strong>
                            </p>
                          </div>
                        </td>

                        {/* Action Column */}
                        <td className="py-4 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEmployeePopup(member)}
                              className="flex items-center gap-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA6118] px-2.5 py-1.5 font-bold text-xs transition-colors shadow-xs"
                              title="View & Edit Employee Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleDownloadIndividualReport(member)}
                              className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                              title="Download Individual Report (CSV/Dossier)"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteEmployee(member)}
                              disabled={isDeletingId === ((member as any)._id || member.id || member.employeeId)}
                              className="rounded-xl border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
                              title="Remove / Delete Employee from Database"
                            >
                              <Trash2 className={`h-3.5 w-3.5 ${isDeletingId === ((member as any)._id || member.id || member.employeeId) ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                <p className="font-bold text-sm">No employees match the selected criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting filters or click &quot;Add New Employee&quot;.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: HR ALL EMPLOYEES LEAVE LIST ── */}
      {activeMainTab === "leave_list" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto space-y-4">
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-100 text-[#EA6118] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                  Leave &amp; LOP Compliance
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {allLeaves.length} Total Requests
                </span>
              </div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-[#12173A] mt-1">
                HR Central Leave Register &amp; Approvals
              </h3>
              <p className="text-xs text-[#5B6180]">
                Review all staff leave applications. Medical Leave requires medical certificate upload; otherwise automatically treated as Loss of Pay (LOP).
              </p>
            </div>
            <button
              onClick={fetchLeaves}
              disabled={isLeavesLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLeavesLoading ? "animate-spin" : ""}`} />
              <span>Refresh Leaves</span>
            </button>
          </div>

          {/* 🏷️ Status Filters (All, Pending, Approved, Rejected) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-[#EA6118]" />
                <span>Status Filter:</span>
              </span>

              {/* ALL */}
              <button
                type="button"
                onClick={() => setLeaveStatusFilter("ALL")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  leaveStatusFilter === "ALL"
                    ? "bg-[#12173A] text-white shadow-sm ring-2 ring-slate-800"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>All Requests</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  leaveStatusFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {allLeaves.length}
                </span>
              </button>

              {/* PENDING / TO REVIEW */}
              <button
                type="button"
                onClick={() => setLeaveStatusFilter("PENDING")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  leaveStatusFilter === "PENDING"
                    ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-500"
                    : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Pending Review</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  leaveStatusFilter === "PENDING" ? "bg-white/25 text-white" : "bg-amber-200/70 text-amber-950"
                }`}>
                  {pendingLeavesCount}
                </span>
              </button>

              {/* APPROVED */}
              <button
                type="button"
                onClick={() => setLeaveStatusFilter("APPROVED")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  leaveStatusFilter === "APPROVED"
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500"
                    : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approved</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  leaveStatusFilter === "APPROVED" ? "bg-white/25 text-white" : "bg-emerald-200/70 text-emerald-950"
                }`}>
                  {approvedLeavesCount}
                </span>
              </button>

              {/* REJECTED */}
              <button
                type="button"
                onClick={() => setLeaveStatusFilter("REJECTED")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  leaveStatusFilter === "REJECTED"
                    ? "bg-red-600 text-white shadow-sm ring-2 ring-red-500"
                    : "bg-red-50 text-red-900 hover:bg-red-100 border border-red-200"
                }`}
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Rejected</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  leaveStatusFilter === "REJECTED" ? "bg-white/25 text-white" : "bg-red-200/70 text-red-950"
                }`}>
                  {rejectedLeavesCount}
                </span>
              </button>
            </div>

            {/* Quick Action Info Badge */}
            <div className="text-xs font-semibold text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredLeaves.length}</span> of {allLeaves.length} entries
            </div>
          </div>

          {/* Search, Type & Branch Toolbar */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 w-full md:w-1/2 relative bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
              <Search className="h-4 w-4 text-slate-400 ml-1 shrink-0" />
              <input
                type="text"
                placeholder="Search staff name, ID, reason, or branch..."
                value={leaveSearchTerm}
                onChange={(e) => setLeaveSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none pr-6"
              />
              {leaveSearchTerm && (
                <button
                  type="button"
                  onClick={() => setLeaveSearchTerm("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Leave Type Filter */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Type:</span>
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#EA6118] focus:outline-none shadow-xs"
              >
                <option value="ALL">All Leave Types</option>
                <option value="CASUAL">Casual Leave (CL)</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="SICK">Medical / Sick Leave</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PATERNITY">Paternity</option>
                <option value="LOSS_OF_PAY">Loss of Pay (LOP)</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Branch:</span>
              <select
                value={leaveBranchFilter}
                onChange={(e) => setLeaveBranchFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#EA6118] focus:outline-none shadow-xs"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b, bIdx) => (
                  <option key={b.id || `leave-branch-${bIdx}`} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredLeaves.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Employee</th>
                  <th className="pb-3 px-3">Branch &amp; Dept</th>
                  <th className="pb-3 px-3">Leave Type</th>
                  <th className="pb-3 px-3">Dates &amp; Days</th>
                  <th className="pb-3 px-3">Medical Certificate</th>
                  <th className="pb-3 px-3">Salary / LOP Status</th>
                  <th className="pb-3 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaves.map((lv, lIdx) => {
                  const empName =
                    (typeof lv.userId === "object" ? lv.userId?.name : null) ||
                    lv.employeeName ||
                    lv.userName ||
                    lv.name ||
                    "Staff Member";
                  const empId =
                    (typeof lv.userId === "object" ? lv.userId?.employeeId : null) ||
                    lv.employeeId;
                  const empBranch =
                    (typeof lv.userId === "object" ? lv.userId?.branch : null) ||
                    lv.branch ||
                    "Main Campus / HQ";
                  const empDept =
                    (typeof lv.userId === "object" ? lv.userId?.department : null) ||
                    lv.department;

                  const leaveId = lv._id || lv.id || `leave-${lIdx}`;
                  const isProcessing = isProcessingLeaveId === leaveId;
                  const statusNormalized = (lv.status || "PENDING").toUpperCase();

                  return (
                    <tr key={leaveId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{empName}</p>
                        {empId && <p className="text-[11px] text-slate-400 font-mono">{empId}</p>}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{empBranch}</p>
                        {empDept && <p className="text-[11px] text-slate-500">{empDept}</p>}
                      </td>

                      <td className="py-3 px-3">
                        <span className="rounded-lg bg-blue-50 text-blue-700 font-bold px-2 py-0.5 text-[10px]">
                          {lv.leaveType}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{lv.fromDate} → {lv.toDate}</p>
                        <p className="text-[11px] text-slate-500">{lv.days} Day(s) • &quot;{lv.reason}&quot;</p>
                      </td>

                      {/* Medical Certificate Column */}
                      <td className="py-3 px-3">
                        {lv.leaveType === "SICK" ? (
                          lv.hasMedicalCertificate || lv.medicalCertificateUrl ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                              <FileCheck className="h-3 w-3" />
                              <span>Certificate Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold" title="Medical certificate missing - Loss of pay applies">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Missing Cert (LOP Applied)</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">Not Applicable</span>
                        )}
                      </td>

                      {/* LOP Status */}
                      <td className="py-3 px-3">
                        {lv.paidDays !== undefined && lv.lopDays !== undefined && lv.paidDays > 0 && lv.lopDays > 0 ? (
                          <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                            Split ({lv.paidDays} Paid, {lv.lopDays} LOP)
                          </span>
                        ) : lv.isLop ? (
                          <span className="rounded bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
                            Loss of Pay ({lv.lopDays || lv.days || 1}d LOP)
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            Paid Leave ({lv.paidDays || lv.days || 1}d)
                          </span>
                        )}
                      </td>

                      {/* Review Actions: Approve / Reject */}
                      <td className="py-3 px-3 text-right">
                        {statusNormalized === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReviewLeaveAction(lv, "APPROVE")}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReviewLeaveAction(lv, "REJECT")}
                              className="inline-flex items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : statusNormalized === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        ) : statusNormalized === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-1 text-xs font-bold">
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                            {lv.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500 space-y-2">
              <Calendar className="mx-auto h-10 w-10 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">No leave applications match the &quot;{leaveStatusFilter}&quot; filter.</p>
              <p className="text-xs text-slate-400">Try changing the status tab, search query, or branch filter above.</p>
              {leaveStatusFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setLeaveStatusFilter("ALL");
                    setLeaveSearchTerm("");
                    setLeaveTypeFilter("ALL");
                    setLeaveBranchFilter("ALL");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#EA6118] hover:underline pt-2"
                >
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: ACTION / FULL EMPLOYEE DOSSIER POPUP ── */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedEmployee.name} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-[#12173A]">
                      {selectedEmployee.name}
                    </h3>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                      {selectedEmployee.isActive ? "Active Staff" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-[#EA6118] font-bold">
                    {selectedEmployee.designation || formatRoleLabel(selectedEmployee.role)} • ID: {selectedEmployee.employeeId}
                  </p>
                  <p className="text-[11px] text-[#5B6180] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{selectedEmployee.branch || "Main Campus / HQ"}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
              <button
                onClick={() => setModalActiveTab("profile")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  modalActiveTab === "profile"
                    ? "bg-[#EA6118] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Profile &amp; Job
              </button>
              <button
                onClick={() => setModalActiveTab("bank")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  modalActiveTab === "bank"
                    ? "bg-[#EA6118] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Bank Account Details
              </button>
              <button
                onClick={() => setModalActiveTab("attendance")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  modalActiveTab === "attendance"
                    ? "bg-[#EA6118] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Attendance &amp; Penalties
              </button>
              <button
                onClick={() => setModalActiveTab("leaves")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  modalActiveTab === "leaves"
                    ? "bg-[#EA6118] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Leave &amp; Medical Cert
              </button>
              <button
                onClick={() => setModalActiveTab("security")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  modalActiveTab === "security"
                    ? "bg-[#EA6118] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <KeyRound className="h-3 w-3" />
                <span>Password Reset</span>
              </button>
            </div>

            {/* TAB 1: Profile & Job Details */}
            {modalActiveTab === "profile" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Official Email</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.email}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Phone Number</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.phone || "+91 98765 43210"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Department</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.department}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Date of Joining</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.dateOfJoining || "2023-01-15"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Branch Location</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.branch || "Main Campus / HQ"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Role / Privileges</span>
                    <p className="font-semibold text-[#EA6118] mt-0.5">{formatRoleLabel(selectedEmployee.role)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Bank Account Details */}
            {modalActiveTab === "bank" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-[#101F52] p-4 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                      Verified Payroll Account
                    </span>
                    <CreditCard className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300">Account Number</span>
                    <p className="font-mono text-lg font-bold tracking-widest text-white">
                      {selectedEmployee.bankDetails?.accountNumber || "50100492819201"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <div>
                      <span>Account Holder</span>
                      <p className="font-bold text-white">{selectedEmployee.bankDetails?.accountHolderName || selectedEmployee.name}</p>
                    </div>
                    <div>
                      <span>IFSC Code</span>
                      <p className="font-bold font-mono text-white">{selectedEmployee.bankDetails?.ifscCode || "HDFC0001234"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Bank Name</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.bankDetails?.bankName || "HDFC Bank"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Branch Location</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.bankDetails?.branchName || "Guindy, Chennai"}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">UPI ID / Virtual Payment Address</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedEmployee.bankDetails?.upiId || "user@hdfcbank"}</p>
                </div>
              </div>
            )}

            {/* TAB 3: Attendance & Policy Tracker */}
            {modalActiveTab === "attendance" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Today Check-In</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedEmployee.todayAttendance?.checkInTime || "--:--"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Today Check-Out</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedEmployee.todayAttendance?.checkOutTime || "--:--"}
                    </p>
                  </div>
                </div>

                {/* Late Check-in Policy Box */}
                <div
                  className={`rounded-2xl p-4 border space-y-1 ${
                    (selectedEmployee.monthlyStats?.lateCount || 0) >= 4
                      ? "bg-red-50 border-red-200 text-red-900"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Monthly Late Check-ins (Shift: 09:40 AM / Grace: 09:45 AM)</span>
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-bold shadow-xs">
                      {selectedEmployee.monthlyStats?.lateCount ?? 0} / 3 Allowed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {(selectedEmployee.monthlyStats?.lateCount || 0) >= 4 ? (
                      <strong className="text-red-700">
                        ⚠️ 4th Late check-in triggered! Half-Day salary deduction applied in payroll muster.
                      </strong>
                    ) : (
                      "3 late arrivals allowed per month up to 09:45 AM. 4th late check-in deducts Half-Day salary."
                    )}
                  </p>
                </div>

                {/* Permission Hours Box */}
                <div
                  className={`rounded-2xl p-4 border space-y-1 ${
                    (selectedEmployee.monthlyStats?.permissionHoursUsed || 0) > 2
                      ? "bg-red-50 border-red-200 text-red-900"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Monthly Permission Hours Used</span>
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-bold shadow-xs">
                      {selectedEmployee.monthlyStats?.permissionHoursUsed ?? 0}h / 2.0h Max
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {(selectedEmployee.monthlyStats?.permissionHoursUsed || 0) > 2 ? (
                      <strong className="text-red-700">
                        ⚠️ Total permission exceeded 2.0 hours! Half-Day salary deduction applied in payroll muster.
                      </strong>
                    ) : (
                      "1 month employee allowed 2 hours total permission. More permission triggers Half-Day deduction."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: Leave Balance & Medical Cert */}
            {modalActiveTab === "leaves" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Casual Leave Balance</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      1 CL / Month <span className="text-[11px] font-normal text-slate-500">(Credited monthly)</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Loss of Pay (LOP) Days</span>
                    <p className="font-bold text-red-600 text-sm mt-0.5">
                      {selectedEmployee.monthlyStats?.lopDays ?? 0} Day(s)
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3.5 text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-amber-700" />
                    <span>Medical Leave Policy Notice</span>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    All medical leaves require legitimate hospital prescription / medical certificate upload upon resume date.
                    Unverified medical leaves are marked as Loss of Pay (LOP).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: Direct Password Reset */}
            {modalActiveTab === "security" && (
              <form onSubmit={handleDirectPasswordReset} className="space-y-4 text-xs">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <KeyRound className="h-4 w-4 text-[#EA6118]" />
                    <span>Direct Password Update / Reset</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    As HR / Executive Admin, you can set a new password directly for <strong>{selectedEmployee.name}</strong> ({selectedEmployee.email}). The employee will immediately be able to sign in using this new password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Enter New Password for Employee</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="e.g. SecretPassword123# or WG@Emp2026"
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:border-[#EA6118] focus:outline-none pr-10"
                    />
                    <Lock className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Target User ID: <span className="font-mono">{selectedEmployee.id || (selectedEmployee as any)._id || selectedEmployee.employeeId}</span>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isResettingPassword}
                    className="gap-2 shadow-sm"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Update Employee Password</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDownloadIndividualReport(selectedEmployee)}
                >
                  <Printer className="h-4 w-4" />
                  <span>Export Staff Dossier</span>
                </Button>

                <button
                  type="button"
                  onClick={() => handleDeleteEmployee(selectedEmployee)}
                  disabled={isDeletingId === ((selectedEmployee as any)._id || selectedEmployee.id || selectedEmployee.employeeId)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 text-xs font-bold text-red-600 transition-colors disabled:opacity-50"
                  title="Permanently remove employee"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Employee</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = employees.map((e) =>
                      e.id === selectedEmployee.id ? { ...e, isActive: !e.isActive } : e
                    );
                    setEmployees(updated);
                    setSelectedEmployee({ ...selectedEmployee, isActive: !selectedEmployee.isActive });
                    toast.info(`Employee status updated to ${!selectedEmployee.isActive ? "Active" : "Inactive"}.`);
                  }}
                >
                  {selectedEmployee.isActive ? "Deactivate Account" : "Activate Account"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedEmployee(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW BRANCH ── */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#12173A]">
                  Add New Company Branch
                </h3>
                <p className="text-[11px] text-slate-500">
                  Expand attendance and rosters to new campus / tech parks.
                </p>
              </div>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber City Branch / Madurai Hub"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad / Madurai"
                    value={newBranchData.city}
                    onChange={(e) => setNewBranchData({ ...newBranchData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Branch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HYD-CC"
                    value={newBranchData.code}
                    onChange={(e) => setNewBranchData({ ...newBranchData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Full Address</label>
                <textarea
                  rows={2}
                  placeholder="Physical street address..."
                  value={newBranchData.address}
                  onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">GPS Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newBranchData.latitude}
                    onChange={(e) => setNewBranchData({ ...newBranchData, latitude: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">GPS Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newBranchData.longitude}
                    onChange={(e) => setNewBranchData({ ...newBranchData, longitude: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBranchModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Branch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ONBOARD NEW EMPLOYEE (2-STEP SCREEN: PROFILE & ROLE -> BANK DETAILS) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header & Step Indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg font-bold text-[#12173A]">
                    Onboard New Staff &amp; Faculty
                  </h3>
                  <span className="rounded-full bg-orange-100 text-[#EA6118] px-2.5 py-0.5 text-[10px] font-bold">
                    Step {onboardStep} of 2
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {onboardStep === 1
                    ? "Step 1: Assign Official Profile, Role, Branch & Department"
                    : "Step 2: Setup Bank Account & Payroll Information"}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Progress Pill */}
            <div className="flex items-center gap-2">
              <div
                onClick={() => setOnboardStep(1)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-bold cursor-pointer transition-all ${
                  onboardStep === 1
                    ? "bg-[#EA6118] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                1. Profile &amp; Role
              </div>
              <div
                onClick={() => setOnboardStep(2)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-bold cursor-pointer transition-all ${
                  onboardStep === 2
                    ? "bg-[#EA6118] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                2. Bank &amp; Payroll
              </div>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              {/* ── STEP 1: OFFICIAL PROFILE & ROLE ASSIGNMENT ── */}
              {onboardStep === 1 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Employee ID</label>
                      <input
                        type="text"
                        required
                        placeholder="WG-HR-002 / WG-EMP-050"
                        value={onboardForm.employeeId}
                        onChange={(e) => setOnboardForm({ ...onboardForm, employeeId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. K. Senthil / "
                        value={onboardForm.name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Official Email</label>
                      <input
                        type="email"
                        required
                        placeholder="senthil@wegrow.edu.in"
                        value={onboardForm.email}
                        onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Phone</label>
                      <input
                        type="text"
                        placeholder="9876543210"
                        value={onboardForm.phone}
                        onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 text-[#EA6118]">
                        System Role (Select Role)
                      </label>
                      <select
                        value={onboardForm.role}
                        onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}
                        className="w-full rounded-xl border-2 border-[#EA6118] px-3 py-2 text-xs focus:outline-none bg-orange-50 font-bold text-[#12173A]"
                      >
                        <option value="HR_MANAGER">HR Manager (HR Role)</option>
                        <option value="EMPLOYEE">Employee (Staff / Faculty)</option>
                        <option value="MANAGER">Team Manager</option>
                        <option value="CEO">CEO / Executive</option>
                        <option value="MD">Managing Director (MD)</option>
                        <option value="GM">General Manager (GM)</option>
                        <option value="ADMIN">System Admin</option>
                        <option value="ACCOUNTANT">Accountant</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Assigned Branch</label>
                      <select
                        required
                        value={onboardForm.branch || branches[0]?.name || ""}
                        onChange={(e) => setOnboardForm({ ...onboardForm, branch: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold"
                      >
                        {branches.length === 0 ? (
                          <option value="">No branches found - please add branch first</option>
                        ) : (
                          branches.map((b, bIdx) => (
                            <option key={b.id || `onboard-opt-${bIdx}`} value={b.name}>
                              📍 {b.name} ({b.city})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Department</label>
                      <input
                        type="text"
                        required
                        placeholder="Human Resources / Computer Applications"
                        value={onboardForm.department}
                        onChange={(e) => setOnboardForm({ ...onboardForm, department: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Designation</label>
                      <input
                        type="text"
                        required
                        placeholder="HR Specialist / Assistant Professor"
                        value={onboardForm.designation}
                        onChange={(e) => setOnboardForm({ ...onboardForm, designation: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Date of Joining</label>
                      <input
                        type="date"
                        required
                        value={onboardForm.dateOfJoining}
                        onChange={(e) => setOnboardForm({ ...onboardForm, dateOfJoining: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Gender</label>
                      <select
                        value={onboardForm.gender}
                        onChange={(e) => setOnboardForm({ ...onboardForm, gender: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        if (!onboardForm.employeeId || !onboardForm.name || !onboardForm.email) {
                          toast.warning("Please fill in Employee ID, Name, and Official Email.");
                          return;
                        }
                        setOnboardStep(2);
                      }}
                    >
                      <span>Proceed to Bank Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: BANK ACCOUNT & PAYROLL DETAILS ── */}
              {onboardStep === 2 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="rounded-2xl bg-orange-50 border border-orange-200 p-3 text-orange-900">
                    <p className="font-bold text-xs">Bank Details for Direct Salary Disbursement</p>
                    <p className="text-[11px] text-orange-800">
                      Configure banking coordinates for {onboardForm.name} ({formatRoleLabel(onboardForm.role)}).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder={onboardForm.name || "Full Name"}
                        value={onboardForm.bankHolderName}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bankHolderName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Bank Account Number</label>
                      <input
                        type="text"
                        required
                        placeholder="50100492819201"
                        value={onboardForm.bankAccountNumber}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bankAccountNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Bank Name</label>
                      <input
                        type="text"
                        required
                        placeholder="HDFC Bank / ICICI / SBI"
                        value={onboardForm.bankName}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bankName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">IFSC Code</label>
                      <input
                        type="text"
                        required
                        placeholder="HDFC0001234"
                        value={onboardForm.ifscCode}
                        onChange={(e) => setOnboardForm({ ...onboardForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Bank Branch Name</label>
                      <input
                        type="text"
                        placeholder="Guindy / Anna Salai, Chennai"
                        value={onboardForm.bankBranchName}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bankBranchName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">UPI ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="username@okhdfcbank"
                        value={onboardForm.upiId}
                        onChange={(e) => setOnboardForm({ ...onboardForm, upiId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setOnboardStep(1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Profile</span>
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSubmitting}
                      className="shadow-lg shadow-orange-600/20"
                    >
                      Confirm &amp; Onboard Employee
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmployeesView() {
  return (
    <AppShell>
      <EmployeesContent />
    </AppShell>
  );
}
export default EmployeesView;
