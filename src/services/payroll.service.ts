import apiClient from "@/lib/api-client";

export interface SalaryStructurePayload {
  grossSalary: number;
  netSalary: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  pfDeduction: number;
  tdsDeduction: number;
}

export interface GeneratePayslipPayload {
  userId: string;
  monthYear: string; // "September 2026"
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  workingDays: number;
  paidDays: number;
  status: "PAID" | "PENDING" | "PROCESSED" | string;
}

export const payrollService = {
  // 9.1 My Salary Structure
  async getSalaryStructure() {
    const response = await apiClient.get("/payroll/salary-structure");
    return response.data;
  },

  // 9.2 My Payslips
  async getMyPayslips() {
    const response = await apiClient.get("/payroll/payslips");
    return response.data;
  },

  // 9.3 Download Payslip
  getPayslipDownloadUrl(monthYear: string) {
    return `${apiClient.defaults.baseURL}/payroll/payslips/${monthYear}/download`;
  },

  async downloadPayslip(monthYear: string) {
    const response = await apiClient.get(`/payroll/payslips/${monthYear}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  // 9.4 Admin: All Salary Structures
  async getAllSalaryStructures() {
    const response = await apiClient.get("/payroll/admin/salary-structures");
    return response.data;
  },

  // 9.5 Admin: Update Salary Structure
  async updateSalaryStructure(userId: string, payload: SalaryStructurePayload) {
    const response = await apiClient.put(`/payroll/admin/salary-structure/${userId}`, payload);
    return response.data;
  },

  // 9.6 Admin: Generate / Record Payslip
  async generatePayslip(payload: GeneratePayslipPayload) {
    const response = await apiClient.post("/payroll/admin/generate-payslip", payload);
    return response.data;
  },

  // 9.7 Admin / CEO: List All Generated Payslips
  async getAllPayslips(monthYear?: string) {
    const response = await apiClient.get("/payroll/admin/payslips", {
      params: monthYear ? { monthYear } : undefined,
    });
    return response.data;
  },
};

export default payrollService;
