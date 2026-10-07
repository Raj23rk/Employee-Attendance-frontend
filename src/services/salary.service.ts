import apiClient from "@/lib/api-client";

export interface StaffSalaryRecord {
  id: string;
  employeeId: string;
  name: string;
  mobile: string;
  role: string;
  designation: string;
  branch: string; // "Sivakasi" | "Srivilliputhur"
  doj: string; // Date of Joining (e.g. "2026-05-20")
  baseSalary: number; // Actual Base Monthly Salary
  currentSalary: number; // Revised / Current Salary with increments
  department: string;
  bankAccount?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  monthlyHistory?: Record<string, number | string>; // e.g. { "JAN": "NIL", "MAY": 19000, "SEP": 19000 }
  increments?: SalaryIncrement[];
  isActive: boolean;
}

export interface SalaryIncrement {
  id: string;
  staffId: string;
  staffName: string;
  previousSalary: number;
  incrementAmount: number;
  newSalary: number;
  percentage: number;
  effectiveDate: string;
  reason: string;
  approvedBy: "HR" | "GM" | "MD" | "CEO" | "ADMIN" | string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export interface AttendanceDeductionBreakdown {
  staffId: string;
  staffName: string;
  branch: string;
  role: string;
  baseSalary: number;
  monthYear: string; // e.g., "September 2026"
  totalDaysInMonth: number; // 30
  workingDays: number; // 26
  presentDays: number;
  halfDays: number;
  absentDays: number;
  lateCount: number; // >3 triggers late deduction
  excessLateCount: number;
  permissionHoursUsed: number; // >2 hrs triggers half-day deduction
  excessPermissionHours: number;
  lopDays: number; // Loss of Pay days

  // Calculations
  perDayRate: number;
  grossSalary: number;
  basicPay: number;
  hra: number;
  specialAllowance: number;
  otherAllowances: number;

  // Deductions
  lopDeduction: number;
  lateDeduction: number;
  permissionDeduction: number;
  totalAttendanceDeduction: number;
  pfDeduction: number;
  tdsDeduction: number;
  esiDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  netPayable: number;
  status: "PAID" | "PENDING" | "PROCESSED";
  generatedAt: string;
  assignedTo: string; // Staff Name or User ID
}

export interface GenerateAllPayslipsPayload {
  monthYear: string;
  branch?: string; // "all" | "Sivakasi" | "Srivilliputhur"
  approvedBy: string;
  customDeductions?: Record<string, number>;
}

// Full Initial Roster matching the document Sivakasi & Srivilliputhur branches
export const INITIAL_STAFF_SALARY_DATA: StaffSalaryRecord[] = [
  // ── Sivakasi Branch Staff (21) ──
  {
    id: "SV-01",
    employeeId: "SK-001",
    name: "Ashok Kumar",
    mobile: "9025977171",
    role: "incharger",
    designation: "Branch Incharge",
    branch: "Sivakasi",
    doj: "2026-05-20",
    baseSalary: 19000,
    currentSalary: 19000,
    department: "Operations",
    bankAccount: "HDFC00998811",
    ifscCode: "HDFC0001234",
    panNumber: "ABCPA1234K",
    uanNumber: "100988776655",
    monthlyHistory: { MAY: 19000, JUNE: 19000, JULY: 19000, AUGUST: 19000, SEP: 19000 },
    isActive: true,
  },
  {
    id: "SV-02",
    employeeId: "SK-002",
    name: "Devi Priya S",
    mobile: "7708406689",
    role: "staff",
    designation: "Staff Executive",
    branch: "Sivakasi",
    doj: "2026-01-08",
    baseSalary: 19000,
    currentSalary: 19000,
    department: "Academic & Admin",
    bankAccount: "SBIN00445566",
    ifscCode: "SBIN0005678",
    panNumber: "DEFPA2345L",
    uanNumber: "100988776656",
    monthlyHistory: { JAN: 10000, FEB: 10000, MARCH: 10000, APRIL: 10000, MAY: 19000, JUNE: 19000, JULY: 19000, AUGUST: 10000, SEP: 19000 },
    isActive: true,
  },
  {
    id: "SV-03",
    employeeId: "SK-003",
    name: "Dhanalakshmi",
    mobile: "9600245696",
    role: "aspirants",
    designation: "Trainee / Aspirant",
    branch: "Sivakasi",
    doj: "2026-06-01",
    baseSalary: 7000,
    currentSalary: 7000,
    department: "Trainee Program",
    bankAccount: "ICIC00332211",
    ifscCode: "ICIC0003456",
    panNumber: "GHIPA3456M",
    uanNumber: "100988776657",
    monthlyHistory: { JUNE: 7000, JULY: 7000, AUGUST: 7000, SEP: 7000 },
    isActive: true,
  },
  {
    id: "SV-04",
    employeeId: "SK-004",
    name: "Dr V Lakshmipriya",
    mobile: "6383039802",
    role: "management",
    designation: "Senior Management Lead",
    branch: "Sivakasi",
    doj: "2026-01-01",
    baseSalary: 47904,
    currentSalary: 47904,
    department: "Executive Management",
    bankAccount: "KKBK00778899",
    ifscCode: "KKBK0007890",
    panNumber: "JKLPA4567N",
    uanNumber: "100988776658",
    monthlyHistory: { MAY: 47904, JUNE: 47904, JULY: 47904, AUGUST: 47904, SEP: 47904 },
    isActive: true,
  },
  {
    id: "SV-05",
    employeeId: "SK-005",
    name: "Esther",
    mobile: "8888888888",
    role: "sweeper",
    designation: "Facility Support Staff",
    branch: "Sivakasi",
    doj: "2026-01-01",
    baseSalary: 3000,
    currentSalary: 3000,
    department: "Housekeeping",
    bankAccount: "IOBA00112233",
    ifscCode: "IOBA0001234",
    panNumber: "MNOPA5678O",
    monthlyHistory: { MAY: 3000, JUNE: 3000, JULY: 3000, AUGUST: 3000, SEP: 3000 },
    isActive: true,
  },
  {
    id: "SV-06",
    employeeId: "SK-006",
    name: "Eswari",
    mobile: "9500659115",
    role: "maid",
    designation: "Care & Support Staff",
    branch: "Sivakasi",
    doj: "2026-08-19",
    baseSalary: 10000,
    currentSalary: 10000,
    department: "Support Services",
    bankAccount: "CANR00998877",
    ifscCode: "CNRB0009876",
    panNumber: "PQRPA6789P",
    monthlyHistory: { AUGUST: 4193.56, SEP: 10000 },
    isActive: true,
  },
  {
    id: "SV-07",
    employeeId: "SK-007",
    name: "Gopinath C",
    mobile: "9344722769",
    role: "staff",
    designation: "Program Executive",
    branch: "Sivakasi",
    doj: "2026-09-07",
    baseSalary: 23000,
    currentSalary: 23000,
    department: "Operations",
    bankAccount: "UBIN00443322",
    ifscCode: "UBIN0004321",
    panNumber: "STUPA7890Q",
    monthlyHistory: { SEP: 18399.98 },
    isActive: true,
  },
  {
    id: "SV-08",
    employeeId: "SK-008",
    name: "K A K Ajith Kumar",
    mobile: "7598951588",
    role: "manager",
    designation: "Branch Operations Manager",
    branch: "Sivakasi",
    doj: "2025-12-26",
    baseSalary: 25000,
    currentSalary: 33250,
    department: "Administration",
    bankAccount: "HDFC00119922",
    ifscCode: "HDFC0004567",
    panNumber: "VWXPA8901R",
    uanNumber: "100988776660",
    monthlyHistory: { JUNE: 33250, JULY: 33250, AUGUST: 32177.42, SEP: 25000 },
    isActive: true,
  },
  {
    id: "SV-09",
    employeeId: "SK-009",
    name: "LakshmiPriya S",
    mobile: "7639109843",
    role: "staff",
    designation: "Senior Staff Officer",
    branch: "Sivakasi",
    doj: "2026-05-07",
    baseSalary: 19000,
    currentSalary: 23750,
    department: "Admissions & Counseling",
    bankAccount: "KVBL00554433",
    ifscCode: "KVBL0005544",
    panNumber: "YZAPA9012S",
    monthlyHistory: { MAY: 18850, JUNE: 23750, JULY: 23750, AUGUST: 18000, SEP: 19000 },
    isActive: true,
  },
  {
    id: "SV-10",
    employeeId: "SK-010",
    name: "Malliga",
    mobile: "9999999999",
    role: "staff",
    designation: "Senior Faculty / Staff",
    branch: "Sivakasi",
    doj: "2026-06-01",
    baseSalary: 33000,
    currentSalary: 33000,
    department: "Academic",
    bankAccount: "SBIN00667788",
    ifscCode: "SBIN0006677",
    panNumber: "BCDPB0123T",
    uanNumber: "100988776662",
    monthlyHistory: { JUNE: 33000, JULY: 33000, AUGUST: 33000, SEP: 33000 },
    isActive: true,
  },
  {
    id: "SV-11",
    employeeId: "SK-011",
    name: "Mareeswaran",
    mobile: "6385817055",
    role: "staff",
    designation: "Accounts & Field Executive",
    branch: "Sivakasi",
    doj: "2026-09-16",
    baseSalary: 14000,
    currentSalary: 14000,
    department: "Finance & Accounts",
    bankAccount: "TMBL00112244",
    ifscCode: "TMBL0001122",
    panNumber: "EFGPB1234U",
    monthlyHistory: { SEP: 6999.95 },
    isActive: true,
  },
  {
    id: "SV-12",
    employeeId: "SK-012",
    name: "Muthu Selvi",
    mobile: "9597845037",
    role: "staff",
    designation: "Customer Relationship Officer",
    branch: "Sivakasi",
    doj: "2026-05-16",
    baseSalary: 14000,
    currentSalary: 14000,
    department: "Student Support",
    bankAccount: "IOBA00993311",
    ifscCode: "IOBA0009933",
    panNumber: "HIJPB2345V",
    monthlyHistory: { JUNE: 10000, JULY: 10000, AUGUST: 10000, SEP: 14000 },
    isActive: true,
  },
  {
    id: "SV-13",
    employeeId: "SK-013",
    name: "Muthumeena",
    mobile: "9159426388",
    role: "telecaller",
    designation: "Senior Telecaller & Outreach",
    branch: "Sivakasi",
    doj: "2026-05-15",
    baseSalary: 23750,
    currentSalary: 23750,
    department: "Telecalling & Marketing",
    bankAccount: "HDFC00887766",
    ifscCode: "HDFC0008877",
    panNumber: "KLMPB3456W",
    uanNumber: "100988776665",
    monthlyHistory: { JUNE: 23750, JULY: 23750, AUGUST: 23750, SEP: 23750 },
    isActive: true,
  },
  {
    id: "SV-14",
    employeeId: "SK-014",
    name: "Nandha Kumar",
    mobile: "6369840813",
    role: "staff",
    designation: "Junior Technical Assistant",
    branch: "Sivakasi",
    doj: "2026-01-01",
    baseSalary: 5000,
    currentSalary: 5000,
    department: "IT & Technical Support",
    bankAccount: "CANR00334455",
    ifscCode: "CNRB0003344",
    panNumber: "NOPPB4567X",
    monthlyHistory: { MAY: 5000, JUNE: 5000, JULY: 5000, AUGUST: 5000, SEP: 5000 },
    isActive: true,
  },
  {
    id: "SV-15",
    employeeId: "SK-015",
    name: "Pandi Selvam",
    mobile: "6381543243",
    role: "staff",
    designation: "Staff Associate",
    branch: "Sivakasi",
    doj: "2026-09-28",
    baseSalary: 8000,
    currentSalary: 8000,
    department: "Logistics",
    bankAccount: "SBIN00114477",
    ifscCode: "SBIN0001144",
    panNumber: "QRSTB5678Y",
    monthlyHistory: { SEP: 799.91 },
    isActive: true,
  },
  {
    id: "SV-16",
    employeeId: "SK-016",
    name: "RajaValli",
    mobile: "6382976368",
    role: "staff",
    designation: "Office Coordinator",
    branch: "Sivakasi",
    doj: "2026-08-31",
    baseSalary: 13000,
    currentSalary: 13000,
    department: "Admin Office",
    bankAccount: "KVBL00889900",
    ifscCode: "KVBL0008899",
    panNumber: "UVWTB6789Z",
    monthlyHistory: { SEP: 13000 },
    isActive: true,
  },
  {
    id: "SV-17",
    employeeId: "SK-017",
    name: "Rajkumar",
    mobile: "6380629995",
    role: "manager",
    designation: "Assistant General Manager",
    branch: "Sivakasi",
    doj: "2026-07-13",
    baseSalary: 23000,
    currentSalary: 23000,
    department: "Branch Management",
    bankAccount: "ICIC00994422",
    ifscCode: "ICIC0009944",
    panNumber: "XYZTB7890A",
    uanNumber: "100988776670",
    monthlyHistory: { JULY: 11645.2, AUGUST: 19000, SEP: 23000 },
    isActive: true,
  },
  {
    id: "SV-18",
    employeeId: "SK-018",
    name: "Shiekabdulla",
    mobile: "9094511116",
    role: "incharger",
    designation: "Academic Incharge",
    branch: "Sivakasi",
    doj: "2026-01-01",
    baseSalary: 23750,
    currentSalary: 23750,
    department: "Curriculum & Faculty",
    bankAccount: "HDFC00331199",
    ifscCode: "HDFC0003311",
    panNumber: "ABCDK8901B",
    uanNumber: "100988776671",
    monthlyHistory: { JUNE: 22562.49, JULY: 22217.74, AUGUST: 21451.61, SEP: 23750 },
    isActive: true,
  },
  {
    id: "SV-19",
    employeeId: "SK-019",
    name: "Subha Rani",
    mobile: "8989898989",
    role: "staff",
    designation: "Helpdesk & Receptionist",
    branch: "Sivakasi",
    doj: "2026-08-03",
    baseSalary: 5000,
    currentSalary: 5000,
    department: "Front Office",
    bankAccount: "TMBL00445588",
    ifscCode: "TMBL0004455",
    panNumber: "EFGHK9012C",
    monthlyHistory: { AUGUST: 4838.71, SEP: 5000 },
    isActive: true,
  },
  {
    id: "SV-20",
    employeeId: "SK-020",
    name: "Subhashini",
    mobile: "9843128769",
    role: "incharger",
    designation: "Incharge - Enrollment",
    branch: "Sivakasi",
    doj: "2026-07-01",
    baseSalary: 14000,
    currentSalary: 14000,
    department: "Admissions",
    bankAccount: "CANR00112288",
    ifscCode: "CNRB0001122",
    panNumber: "IJKLK0123D",
    monthlyHistory: { JULY: 10000, AUGUST: 10000, SEP: 14000 },
    isActive: true,
  },
  {
    id: "SV-21",
    employeeId: "SK-021",
    name: "Thavabalan",
    mobile: "9952337331",
    role: "director",
    designation: "Managing Director",
    branch: "Sivakasi",
    doj: "2026-01-01",
    baseSalary: 143043,
    currentSalary: 143043,
    department: "Board of Directors",
    bankAccount: "KKBK00119933",
    ifscCode: "KKBK0001199",
    panNumber: "MNPLK1234E",
    uanNumber: "100988776675",
    monthlyHistory: { JUNE: 143043, JULY: 143043, AUGUST: 143043, SEP: 143043 },
    isActive: true,
  },

  // ── Srivilliputhur Branch Staff (6) ──
  {
    id: "SR-01",
    employeeId: "SP-001",
    name: "Dhivya",
    mobile: "7777777777",
    role: "sweeper",
    designation: "Facility Support Staff",
    branch: "Srivilliputhur",
    doj: "2026-01-01",
    baseSalary: 3000,
    currentSalary: 3000,
    department: "Housekeeping",
    bankAccount: "SBIN00994411",
    ifscCode: "SBIN0009944",
    panNumber: "OPQRK2345F",
    monthlyHistory: { MAY: 3000, JUNE: 3000, JULY: 3000, AUGUST: 3000, SEP: 3000 },
    isActive: true,
  },
  {
    id: "SR-02",
    employeeId: "SP-002",
    name: "Geetha",
    mobile: "9344671317",
    role: "staff",
    designation: "Senior Academic Coordinator",
    branch: "Srivilliputhur",
    doj: "2026-07-10",
    baseSalary: 12000,
    currentSalary: 12000,
    department: "Academic",
    bankAccount: "IOBA00448822",
    ifscCode: "IOBA0004488",
    panNumber: "STUVM3456G",
    uanNumber: "100988776680",
    monthlyHistory: { JULY: 8322.55, AUGUST: 12000, SEP: 11600 },
    isActive: true,
  },
  {
    id: "SR-03",
    employeeId: "SP-003",
    name: "Prabhakaran B",
    mobile: "9080118824",
    role: "staff",
    designation: "Technical Assistant",
    branch: "Srivilliputhur",
    doj: "2026-09-03",
    baseSalary: 5500,
    currentSalary: 5500,
    department: "Technical Operations",
    bankAccount: "HDFC00665544",
    ifscCode: "HDFC0006655",
    panNumber: "WXYZM4567H",
    monthlyHistory: { SEP: 4950.01 },
    isActive: true,
  },
  {
    id: "SR-04",
    employeeId: "SP-004",
    name: "Sujatha",
    mobile: "9080150362",
    role: "staff",
    designation: "Student Relations Officer",
    branch: "Srivilliputhur",
    doj: "2026-07-13",
    baseSalary: 10000,
    currentSalary: 10000,
    department: "Student Affairs",
    bankAccount: "CANR00778844",
    ifscCode: "CNRB0007788",
    panNumber: "ABCDM5678I",
    monthlyHistory: { JULY: 5483.88, AUGUST: 8870.97, SEP: 8666.68 },
    isActive: true,
  },
  {
    id: "SR-05",
    employeeId: "SP-005",
    name: "Uma Rani",
    mobile: "7010750916",
    role: "staff",
    designation: "Senior Faculty & Counselor",
    branch: "Srivilliputhur",
    doj: "2026-06-15",
    baseSalary: 19000,
    currentSalary: 19000,
    department: "Academic & Counseling",
    bankAccount: "KVBL00331122",
    ifscCode: "KVBL0003311",
    panNumber: "EFGHM6789J",
    uanNumber: "100988776685",
    monthlyHistory: { JUNE: 3400, JULY: 5419.35, AUGUST: 5806.45, SEP: 19000 },
    isActive: true,
  },
  {
    id: "SR-06",
    employeeId: "SP-006",
    name: "Vignesh A",
    mobile: "6374545878",
    role: "manager",
    designation: "Srivilliputhur Branch Head",
    branch: "Srivilliputhur",
    doj: "2025-12-22",
    baseSalary: 20000,
    currentSalary: 33250,
    department: "Branch Management",
    bankAccount: "TMBL00887766",
    ifscCode: "TMBL0008877",
    panNumber: "IJKLM7890K",
    uanNumber: "100988776686",
    monthlyHistory: { JUNE: 33250, JULY: 28959.68, AUGUST: 30032.26, SEP: 18333.32 },
    isActive: true,
  },
];

const LOCAL_STORAGE_STAFF_KEY = "hrone_salary_staff_v2";
const LOCAL_STORAGE_INCREMENTS_KEY = "hrone_salary_increments_v2";
const LOCAL_STORAGE_PAYSLIPS_KEY = "hrone_salary_payslips_v2";

export const salaryService = {
  /**
   * Check if the active role has permission for Salary Modification / Increments
   * Allowed roles: HR (hr_manager), GM, MD, Admin, CEO
   */
  hasSalaryAdminAccess(role?: string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase().replace(/[- ]/g, "_");
    return ["admin", "ceo", "md", "gm", "hr_manager", "hr"].includes(normalized);
  },

  /**
   * 1. Get all staff salary master records (with branch/search filters)
   */
  async getAllStaffSalaries(params?: { branch?: string; search?: string }): Promise<StaffSalaryRecord[]> {
    try {
      const response = await apiClient.get("/salary/staff", { params });
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Fallback to localStorage or initial roster
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
      let list: StaffSalaryRecord[] = stored ? JSON.parse(stored) : INITIAL_STAFF_SALARY_DATA;
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(list));
      }

      if (params?.branch && params.branch !== "all") {
        list = list.filter((s) => s.branch.toLowerCase() === params.branch?.toLowerCase());
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.employeeId.toLowerCase().includes(q) ||
            s.mobile.includes(q) ||
            s.role.toLowerCase().includes(q)
        );
      }
      return list;
    }

    return INITIAL_STAFF_SALARY_DATA;
  },

  /**
   * 2. Get single staff salary record
   */
  async getStaffSalaryById(id: string): Promise<StaffSalaryRecord | null> {
    const list = await this.getAllStaffSalaries();
    return list.find((s) => s.id === id || s.employeeId === id) || null;
  },

  /**
   * 3. CRUD: Create / Record Salary Increment (HR, GM, MD only)
   */
  async createSalaryIncrement(payload: {
    staffId: string;
    incrementAmount: number;
    newSalary?: number;
    effectiveDate: string;
    reason: string;
    approvedBy: "HR" | "GM" | "MD" | "CEO" | "ADMIN" | string;
  }): Promise<{ success: boolean; data: SalaryIncrement; updatedStaff: StaffSalaryRecord }> {
    try {
      const response = await apiClient.post("/salary/increments", payload);
      if (response?.data) return response.data;
    } catch {
      // Local sync fallback
    }

    const staffList = await this.getAllStaffSalaries();
    const staffIndex = staffList.findIndex((s) => s.id === payload.staffId || s.employeeId === payload.staffId);
    if (staffIndex === -1) {
      throw new Error("Staff record not found");
    }

    const staff = staffList[staffIndex];
    const prevSalary = staff.currentSalary || staff.baseSalary;
    const newSalary = payload.newSalary || prevSalary + Number(payload.incrementAmount);
    const incAmount = Number(payload.incrementAmount) || newSalary - prevSalary;
    const pct = prevSalary > 0 ? Number(((incAmount / prevSalary) * 100).toFixed(2)) : 0;

    const newIncrement: SalaryIncrement = {
      id: `INC-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      previousSalary: prevSalary,
      incrementAmount: incAmount,
      newSalary: newSalary,
      percentage: pct,
      effectiveDate: payload.effectiveDate || new Date().toISOString().split("T")[0],
      reason: payload.reason || "Annual performance appraisal adjustment",
      approvedBy: payload.approvedBy || "HR",
      status: "APPROVED",
      createdAt: new Date().toISOString(),
    };

    // Update staff record
    const updatedStaff: StaffSalaryRecord = {
      ...staff,
      currentSalary: newSalary,
      increments: [...(staff.increments || []), newIncrement],
    };
    staffList[staffIndex] = updatedStaff;

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(staffList));

      const storedInc = localStorage.getItem(LOCAL_STORAGE_INCREMENTS_KEY);
      const allInc: SalaryIncrement[] = storedInc ? JSON.parse(storedInc) : [];
      allInc.unshift(newIncrement);
      localStorage.setItem(LOCAL_STORAGE_INCREMENTS_KEY, JSON.stringify(allInc));
    }

    return { success: true, data: newIncrement, updatedStaff };
  },

  /**
   * 4. CRUD: Get all increments history
   */
  async getAllIncrements(staffId?: string): Promise<SalaryIncrement[]> {
    try {
      const response = await apiClient.get("/salary/increments", { params: { staffId } });
      if (response?.data?.data) return response.data.data;
    } catch {
      // Local sync fallback
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_INCREMENTS_KEY);
      let list: SalaryIncrement[] = stored ? JSON.parse(stored) : [];
      if (staffId) {
        list = list.filter((i) => i.staffId === staffId);
      }
      return list;
    }
    return [];
  },

  /**
   * 5. CRUD: Update an increment record (HR, GM, MD only)
   */
  async updateSalaryIncrement(
    incrementId: string,
    payload: Partial<SalaryIncrement>
  ): Promise<{ success: boolean; data: SalaryIncrement }> {
    try {
      const response = await apiClient.put(`/salary/increments/${incrementId}`, payload);
      if (response?.data) return response.data;
    } catch {
      // Local sync fallback
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_INCREMENTS_KEY);
      let list: SalaryIncrement[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((i) => i.id === incrementId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem(LOCAL_STORAGE_INCREMENTS_KEY, JSON.stringify(list));
        return { success: true, data: list[idx] };
      }
    }
    throw new Error("Increment record not found");
  },

  /**
   * 6. CRUD: Delete / Revert an increment record (HR, GM, MD only)
   */
  async deleteSalaryIncrement(incrementId: string): Promise<{ success: boolean }> {
    try {
      await apiClient.delete(`/salary/increments/${incrementId}`);
      return { success: true };
    } catch {
      // Local sync fallback
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_INCREMENTS_KEY);
      let list: SalaryIncrement[] = stored ? JSON.parse(stored) : [];
      const target = list.find((i) => i.id === incrementId);
      if (target) {
        list = list.filter((i) => i.id !== incrementId);
        localStorage.setItem(LOCAL_STORAGE_INCREMENTS_KEY, JSON.stringify(list));

        // Revert current salary in staff
        const staffList = await this.getAllStaffSalaries();
        const sIdx = staffList.findIndex((s) => s.id === target.staffId);
        if (sIdx !== -1) {
          staffList[sIdx].currentSalary = target.previousSalary;
          staffList[sIdx].increments = (staffList[sIdx].increments || []).filter((i) => i.id !== incrementId);
          localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(staffList));
        }
      }
    }
    return { success: true };
  },

  /**
   * 7. CRUD: Direct Update of Employee Base Salary / Role / Details (HR, GM, MD only)
   */
  async updateStaffSalary(id: string, payload: Partial<StaffSalaryRecord>): Promise<StaffSalaryRecord> {
    try {
      const response = await apiClient.put(`/salary/staff/${id}`, payload);
      if (response?.data?.data) return response.data.data;
    } catch {
      // Local sync fallback
    }

    const list = await this.getAllStaffSalaries();
    const idx = list.findIndex((s) => s.id === id || s.employeeId === id);
    if (idx === -1) throw new Error("Staff member not found");

    list[idx] = { ...list[idx], ...payload };
    if (payload.baseSalary && !payload.currentSalary) {
      list[idx].currentSalary = payload.baseSalary;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(list));
    }
    return list[idx];
  },

  /**
   * 8. AUTOMATIC ATTENDANCE-BASED SALARY DEDUCTION CALCULATION ENGINE
   * Implements company policy:
   * - Daily Rate = Salary / Total Days (e.g. 30)
   * - 3 lates allowed (grace up to 9:45 AM). 4th+ late check-in deducts 0.5 day salary.
   * - 2 hours monthly permission allowed. Excess triggers 0.5 day deduction.
   * - Loss of Pay (Absent days + half days * 0.5) deducts proportionate salary.
   * - Standard statutory deductions (PF / TDS).
   */
  calculateDeductions(params: {
    staff: StaffSalaryRecord;
    monthYear: string;
    totalDaysInMonth?: number;
    workingDays?: number;
    presentDays?: number;
    halfDays?: number;
    absentDays?: number;
    lateCount?: number;
    permissionHoursUsed?: number;
    customDeduction?: number;
    customBonus?: number;
  }): AttendanceDeductionBreakdown {
    const { staff, monthYear } = params;
    const salary = Number(staff.currentSalary || staff.baseSalary || 15000);

    const totalDays = params.totalDaysInMonth || 30;
    const workingDays = params.workingDays || 26;

    // Simulation / Default realistic stats if not passed
    const presentDays = params.presentDays !== undefined ? params.presentDays : workingDays;
    const halfDays = params.halfDays !== undefined ? params.halfDays : 0;
    const absentDays = params.absentDays !== undefined ? params.absentDays : 0;
    const lateCount = params.lateCount !== undefined ? params.lateCount : 0;
    const permissionHoursUsed = params.permissionHoursUsed !== undefined ? params.permissionHoursUsed : 0;

    const perDayRate = Number((salary / totalDays).toFixed(2));

    // Policy Rule 1: 3 lates allowed per month. 4th late check-in onwards deducts 0.5 day each
    const excessLateCount = Math.max(0, lateCount - 3);
    const lateDeductionDays = excessLateCount * 0.5;
    const lateDeduction = Number((lateDeductionDays * perDayRate).toFixed(2));

    // Policy Rule 2: 2 hours monthly permission quota. Excess triggers half-day deduction
    const excessPermissionHours = Math.max(0, permissionHoursUsed - 2);
    const permissionDeductionDays = excessPermissionHours > 0 ? Math.ceil(excessPermissionHours / 2) * 0.5 : 0;
    const permissionDeduction = Number((permissionDeductionDays * perDayRate).toFixed(2));

    // Policy Rule 3: Absent / LOP Days & Half Days
    const lopDays = absentDays + halfDays * 0.5;
    const lopDeduction = Number((lopDays * perDayRate).toFixed(2));

    // Total Attendance Deductions
    const totalAttendanceDeduction = Number((lopDeduction + lateDeduction + permissionDeduction).toFixed(2));

    // Salary Structure Breakdown
    const basicPay = Number((salary * 0.5).toFixed(2));
    const hra = Number((salary * 0.3).toFixed(2));
    const specialAllowance = Number((salary * 0.2).toFixed(2));
    const grossSalary = salary + (params.customBonus || 0);

    // Statutory deductions (PF ~12% of basic if salary > 15k or standard min)
    const pfDeduction = salary >= 15000 ? Math.min(1800, Number((basicPay * 0.12).toFixed(2))) : 0;
    const tdsDeduction = salary >= 50000 ? Number((salary * 0.05).toFixed(2)) : 0;
    const otherDeductions = params.customDeduction || 0;

    const totalDeductions = Number(
      (totalAttendanceDeduction + pfDeduction + tdsDeduction + otherDeductions).toFixed(2)
    );
    const netPayable = Math.max(0, Number((grossSalary - totalDeductions).toFixed(2)));

    return {
      staffId: staff.id,
      staffName: staff.name,
      branch: staff.branch,
      role: staff.role,
      baseSalary: salary,
      monthYear,
      totalDaysInMonth: totalDays,
      workingDays,
      presentDays,
      halfDays,
      absentDays,
      lateCount,
      excessLateCount,
      permissionHoursUsed,
      excessPermissionHours,
      lopDays,

      perDayRate,
      grossSalary,
      basicPay,
      hra,
      specialAllowance,
      otherAllowances: params.customBonus || 0,

      lopDeduction,
      lateDeduction,
      permissionDeduction,
      totalAttendanceDeduction,
      pfDeduction,
      tdsDeduction,
      esiDeduction: 0,
      otherDeductions,
      totalDeductions,

      netPayable,
      status: "PAID",
      generatedAt: new Date().toISOString(),
      assignedTo: staff.name,
    };
  },

  /**
   * 9. BATCH / ONE-CLICK GENERATE PAYSLIPS FOR ALL STAFF
   * Reads all employees in Sivakasi & Srivilliputhur, auto-calculates attendance deductions, and assigns payslips
   */
  async generateAllPayslips(payload: GenerateAllPayslipsPayload): Promise<{
    count: number;
    payslips: AttendanceDeductionBreakdown[];
    totalGross: number;
    totalDeductions: number;
    totalNetPayout: number;
  }> {
    try {
      const response = await apiClient.post("/salary/generate-batch", payload);
      if (response?.data?.payslips) return response.data;
    } catch {
      // Local sync fallback
    }

    const staffList = await this.getAllStaffSalaries({ branch: payload.branch });
    const generated: AttendanceDeductionBreakdown[] = [];

    // Specific monthly past adjustments if matching September 2026 or similar
    staffList.forEach((staff) => {
      // Check if staff has historical specific record for the month (e.g. Sep or current)
      let customDeduction = 0;
      let lateCount = 0;
      let absentDays = 0;
      let halfDays = 0;

      // Realistic variation based on document figures if available
      const historyAmount = staff.monthlyHistory?.SEP || staff.monthlyHistory?.SEPTEMBER;
      if (typeof historyAmount === "number" && historyAmount < staff.baseSalary) {
        // Attendance deduction occurred in recorded data
        const diff = staff.baseSalary - historyAmount;
        customDeduction = Number(diff.toFixed(2));
      }

      const breakdown = this.calculateDeductions({
        staff,
        monthYear: payload.monthYear,
        lateCount,
        absentDays,
        halfDays,
        customDeduction,
      });

      generated.push(breakdown);
    });

    // Save to persistent storage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAYSLIPS_KEY);
      let existing: AttendanceDeductionBreakdown[] = stored ? JSON.parse(stored) : [];
      // Replace duplicates for the same monthYear and staffId
      const filtered = existing.filter((p) => p.monthYear !== payload.monthYear);
      const combined = [...generated, ...filtered];
      localStorage.setItem(LOCAL_STORAGE_PAYSLIPS_KEY, JSON.stringify(combined));
    }

    const totalGross = generated.reduce((acc, curr) => acc + curr.grossSalary, 0);
    const totalDeductions = generated.reduce((acc, curr) => acc + curr.totalDeductions, 0);
    const totalNetPayout = generated.reduce((acc, curr) => acc + curr.netPayable, 0);

    return {
      count: generated.length,
      payslips: generated,
      totalGross,
      totalDeductions,
      totalNetPayout,
    };
  },

  /**
   * 10. Get all generated payslips (with filters)
   */
  async getAllGeneratedPayslips(params?: {
    monthYear?: string;
    branch?: string;
    staffId?: string;
  }): Promise<AttendanceDeductionBreakdown[]> {
    try {
      const response = await apiClient.get("/salary/payslips", { params });
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Local sync fallback
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAYSLIPS_KEY);
      let list: AttendanceDeductionBreakdown[] = stored ? JSON.parse(stored) : [];

      // If empty on first load, pre-populate with September 2026 payslips
      if (list.length === 0) {
        const batch = await this.generateAllPayslips({
          monthYear: "September 2026",
          branch: "all",
          approvedBy: "HR & GM",
        });
        list = batch.payslips;
      }

      if (params?.monthYear && params.monthYear !== "all") {
        list = list.filter((p) => p.monthYear.toLowerCase() === params.monthYear?.toLowerCase());
      }
      if (params?.branch && params.branch !== "all") {
        list = list.filter((p) => p.branch.toLowerCase() === params.branch?.toLowerCase());
      }
      if (params?.staffId) {
        list = list.filter((p) => p.staffId === params.staffId);
      }

      return list;
    }

    return [];
  },

  /**
   * 11. Update individual payslip status (e.g. PAID, PROCESSED, PENDING)
   */
  async updatePayslipStatus(
    staffId: string,
    monthYear: string,
    status: "PAID" | "PENDING" | "PROCESSED"
  ): Promise<boolean> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAYSLIPS_KEY);
      let list: AttendanceDeductionBreakdown[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((p) => p.staffId === staffId && p.monthYear === monthYear);
      if (idx !== -1) {
        list[idx].status = status;
        localStorage.setItem(LOCAL_STORAGE_PAYSLIPS_KEY, JSON.stringify(list));
        return true;
      }
    }
    return false;
  },
};

export default salaryService;
