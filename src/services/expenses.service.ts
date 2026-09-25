import apiClient from "@/lib/api-client";

export interface SubmitReimbursementPayload {
  category: string;
  amount: number;
  date: string; // "2026-09-22"
  description: string;
  billUrl?: string;
}

export interface ReviewReimbursementPayload {
  status: "APPROVED" | "REJECTED" | string;
  remarks?: string;
}

export interface DailyOfficeExpensePayload {
  title: string;
  category: string;
  amount: number;
  date: string; // "2026-09-23"
  paymentMode: string;
  vendorName?: string;
  billUrl?: string;
  description?: string;
  tags?: string[];
}

export const expensesService = {
  // 10.1 Submit Reimbursement Claim (Employee)
  async submitReimbursement(payload: SubmitReimbursementPayload) {
    const response = await apiClient.post("/expenses/submit", payload);
    return response.data;
  },

  // 10.2 My Submitted Claims
  async getMyExpenses() {
    const response = await apiClient.get("/expenses/my");
    return response.data;
  },

  // 10.3 Pending Reimbursement Approvals (Manager / HR / CEO)
  async getPendingApprovals() {
    const response = await apiClient.get("/expenses/pending-approvals");
    return response.data;
  },

  // 10.4 Review Reimbursement Claim (Manager / HR)
  async reviewClaim(id: string, payload: ReviewReimbursementPayload) {
    const response = await apiClient.patch(`/expenses/${id}/review`, payload);
    return response.data;
  },

  // 10.5 Admin Daily Office Expense: Create
  async recordDailyExpense(payload: DailyOfficeExpensePayload) {
    const response = await apiClient.post("/expenses/daily", payload);
    return response.data;
  },

  // 10.6 Admin Daily Office Expenses: List
  async getDailyExpenses(params?: { month?: string; year?: string | number; page?: number; limit?: number }) {
    const response = await apiClient.get("/expenses/daily", { params });
    return response.data;
  },

  // 10.7 Admin Daily Office Expense: Get By ID
  async getDailyExpenseById(id: string) {
    const response = await apiClient.get(`/expenses/daily/${id}`);
    return response.data;
  },

  // 10.8 Admin Daily Office Expense: Update
  async updateDailyExpense(id: string, payload: Partial<DailyOfficeExpensePayload>) {
    const response = await apiClient.put(`/expenses/daily/${id}`, payload);
    return response.data;
  },

  // 10.9 Admin Daily Office Expense: Delete
  async deleteDailyExpense(id: string) {
    const response = await apiClient.delete(`/expenses/daily/${id}`);
    return response.data;
  },

  // 10.10 CEO / Admin: Executive Monthly Expense Overview
  async getCeoMonthlyOverview(year: number, month: number) {
    const response = await apiClient.get(`/expenses/ceo/monthly-overview?year=${year}&month=${month}`);
    return response.data;
  },
};

export default expensesService;
