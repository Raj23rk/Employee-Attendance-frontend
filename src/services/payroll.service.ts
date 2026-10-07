import apiClient from "../lib/api-client";

export interface SalaryStructure {
  _id?: string;
  userId: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
    department: string;
    role: string;
    designation?: string;
    branch?: string;
    phone?: string;
    dateOfJoining?: string;
  };
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  paymentMode: string;
  notes?: string;
}

export interface BranchStaffMember {
  userId: string;
  employeeId: string;
  name: string;
  role: string;
  designation?: string;
  branch: string;
  phone?: string;
  dateOfJoining?: string;
  baseSalary: number;
  grossSalary?: number;
  netSalary?: number;
  attendanceDeduction?: number;
  lopDays?: number;
  finalSalary?: number;
  basic?: number;
  hra?: number;
  pfDeduction?: number;
  esiDeduction?: number;
  tdsDeduction?: number;
}

export interface BranchSalaryGroup {
  branchName: string;
  shortName: string;
  employeeCount: number;
  totalBaseSalary: number;
  totalGrossSalary?: number;
  totalNetSalary?: number;
  totalFinalSalary?: number;
  staff: BranchStaffMember[];
}

export interface BranchWiseSalaryResponse {
  success: boolean;
  totalEmployees: number;
  totalCompanyBaseSalary: number;
  totalCompanyGrossSalary?: number;
  totalCompanyNetSalary?: number;
  totalCompanyFinalSalary?: number;
  branchCount: number;
  branches: BranchSalaryGroup[];
}

export interface SalaryIncrement {
  _id: string;
  userId: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
    role: string;
    branch?: string;
    designation?: string;
  };
  previousSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  remarks?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: {
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface Payslip {
  _id: string;
  userId: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
    department: string;
    designation?: string;
    branch?: string;
    phone?: string;
  };
  payslipNo: string;
  monthYear: string;
  month: number;
  year: number;
  baseSalary: number;
  grossPay: number;
  totalDaysInMonth: number;
  workingDays: number;
  paidDays: number;
  absentDays: number;
  paidLeaves: number;
  lateCount: number;
  latePenaltyDays: number;
  lopDays: number;
  dailyRate: number;
  attendanceDeduction: number;
  otherDeductions: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  totalDeductions: number;
  netPay: number;
  amountInWords: string;
  breakdown: {
    basic: number;
    hra: number;
    specialAllowance: number;
    otherAllowances: number;
    lopDeduction: number;
    pf: number;
    esi: number;
    tds: number;
  };
  status: string;
  paymentDate?: string;
  notes?: string;
}

export const payrollService = {
  // ==================== 1. EMPLOYEE SELF-SERVICE ====================

  // Get current logged-in employee salary structure
  getMySalaryStructure: async () => {
    const res = await apiClient.get<{ success: boolean; data: SalaryStructure }>("/payroll/salary-structure");
    return res.data;
  },

  // Get current logged-in employee payslips list
  getMyPayslips: async () => {
    const res = await apiClient.get<{ success: boolean; data: Payslip[] }>("/payroll/payslips");
    return res.data;
  },

  // Get HTML payslip for viewing / printing (Self)
  downloadMyPayslipHtml: async (monthYear: string) => {
    const res = await apiClient.get(`/payroll/payslips/${encodeURIComponent(monthYear)}/download`, {
      responseType: "text",
    });
    return res.data;
  },

  // ==================== 2. SALARY INCREMENT CRUD (HR / GM / MD) ====================

  // Create & Apply New Salary Increment
  createSalaryIncrement: async (data: {
    userId: string;
    incrementAmount?: number;
    newSalary?: number;
    effectiveDate?: string;
    reason?: string;
    remarks?: string;
    status?: "APPROVED" | "PENDING" | string;
  }) => {
    const res = await apiClient.post<{ success: boolean; message?: string; data: SalaryIncrement }>("/payroll/salary-increments", data);
    return res.data;
  },

  // Get All Salary Increment History
  getAllSalaryIncrements: async (userId?: string) => {
    const params = userId ? `?userId=${userId}` : "";
    const res = await apiClient.get<{ success: boolean; data: SalaryIncrement[] }>(`/payroll/salary-increments${params}`);
    return res.data;
  },

  // Get Single Increment Record by ID
  getSalaryIncrementById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: SalaryIncrement }>(`/payroll/salary-increments/${id}`);
    return res.data;
  },

  // Update Existing Increment Record
  updateSalaryIncrement: async (
    id: string,
    data: {
      newSalary?: number;
      incrementAmount?: number;
      effectiveDate?: string;
      reason?: string;
      remarks?: string;
      status?: string;
    }
  ) => {
    const res = await apiClient.put<{ success: boolean; message?: string; data: SalaryIncrement }>(`/payroll/salary-increments/${id}`, data);
    return res.data;
  },

  // Delete Salary Increment Record
  deleteSalaryIncrement: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(`/payroll/salary-increments/${id}`);
    return res.data;
  },

  // ==================== 3. SALARY STRUCTURE MANAGEMENT (HR / GM / MD) ====================

  // Get all employee salary structures
  getAllSalaryStructures: async (branch?: string) => {
    const params = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    const res = await apiClient.get<{ success: boolean; data: SalaryStructure[] }>(`/payroll/admin/salary-structures${params}`);
    return res.data;
  },

  // Fetch salary structures split & grouped by branch
  getBranchWiseSalaries: async (monthYear?: string) => {
    const params = monthYear ? `?monthYear=${encodeURIComponent(monthYear)}` : "";
    const res = await apiClient.get<BranchWiseSalaryResponse>(`/payroll/admin/salary-structures/branch-wise${params}`);
    return res.data;
  },

  // Fetch payslips split & grouped by branch
  getBranchWisePayslips: async (monthYear?: string) => {
    const params = monthYear ? `?monthYear=${encodeURIComponent(monthYear)}` : "";
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`/payroll/admin/payslips/branch-wise${params}`);
    return res.data;
  },

  // Update base salary directly for any employee
  updateEmployeeSalaryStructure: async (
    userId: string,
    data: {
      baseSalary?: number;
      grossSalary?: number;
      paymentMode?: string;
      notes?: string;
    }
  ) => {
    const res = await apiClient.put<{ success: boolean; message?: string; data: SalaryStructure }>(`/payroll/admin/salary-structure/${userId}`, data);
    return res.data;
  },

  // ==================== 4. ATTENDANCE PAYROLL & PAYSLIPS (HR / GM / MD) ====================

  // 1-Click Monthly Payroll Generation (Calculates LOP & generates payslips for all staff)
  generateMonthlyPayslips: async (data: {
    monthYear?: string; // e.g. "10-2026" or "October-2026"
    month?: number; // 10
    year?: number; // 2026
    branch?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; message?: string; processedCount: number; data?: Payslip[] }>(
      "/payroll/admin/generate-monthly-payslips",
      data
    );
    return res.data;
  },

  // Get all generated payslips across company
  getAllAdminPayslips: async (monthYear?: string, branch?: string) => {
    const query = new URLSearchParams();
    if (monthYear) query.append("monthYear", monthYear);
    if (branch) query.append("branch", branch);
    const res = await apiClient.get<{ success: boolean; data: Payslip[] }>(`/payroll/admin/payslips?${query.toString()}`);
    return res.data;
  },

  // Get direct download URL for payslip
  getPayslipDownloadUrl: (monthYearOrUserId: string, monthYear?: string) => {
    if (monthYear) {
      return `${apiClient.defaults.baseURL}/payroll/admin/payslips/${monthYearOrUserId}/${encodeURIComponent(monthYear)}/download`;
    }
    return `${apiClient.defaults.baseURL}/payroll/payslips/${encodeURIComponent(monthYearOrUserId)}/download`;
  },

  // Get HTML template payslip for any staff
  downloadEmployeePayslipHtml: async (userId: string, monthYear: string) => {
    const res = await apiClient.get(`/payroll/admin/payslips/${userId}/${encodeURIComponent(monthYear)}/download`, {
      responseType: "text",
    });
    return res.data;
  },

  // Delete Payslip (Admin / HR)
  deletePayslip: async (id: string) => {
    try {
      const res = await apiClient.delete<{ success: boolean; message?: string }>(`/payroll/admin/payslips/${id}`);
      return res.data;
    } catch {
      const res = await apiClient.delete<{ success: boolean; message?: string }>(`/payroll/payslips/${id}`);
      return res.data;
    }
  },

  // Update Payslip (Admin / HR)
  updatePayslip: async (id: string, data: Partial<Payslip>) => {
    const res = await apiClient.put<{ success: boolean; message?: string; data: Payslip }>(`/payroll/admin/payslips/${id}`, data);
    return res.data;
  },
};

export default payrollService;
