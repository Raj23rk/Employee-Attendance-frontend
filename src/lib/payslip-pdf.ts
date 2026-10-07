import { AttendanceDeductionBreakdown, StaffSalaryRecord, StaffSalaryIncrement } from "@/services/salary.service";

/**
 * Format currency to INR style: ₹ 19,000.00
 */
function formatInr(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return "₹ 0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹ 0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Convert number into words (Indian numbering format)
 */
function numberToWords(num: number): string {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const n = Math.floor(num);
  if (n === 0) return "Zero Rupees Only";

  const numStr = ("000000000" + n).substr(-9);
  const match = numStr.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return `${n} Rupees Only`;

  let str = "";
  str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0] as any] + " " + a[match[1][1] as any]) + "Crore " : "";
  str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0] as any] + " " + a[match[2][1] as any]) + "Lakh " : "";
  str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0] as any] + " " + a[match[3][1] as any]) + "Thousand " : "";
  str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0] as any] + " " + a[match[4][1] as any]) + "Hundred " : "";
  str +=
    Number(match[5]) !== 0
      ? (str !== "" ? "and " : "") +
        (a[Number(match[5])] || b[match[5][0] as any] + " " + a[match[5][1] as any])
      : "";

  return str ? `Rupees ${str.trim()} Only` : "Zero Rupees Only";
}

/**
 * Generate and open print preview for a single Employee Payslip
 */
export function generateIndividualPayslipPdf(
  payslip: AttendanceDeductionBreakdown,
  staff?: StaffSalaryRecord
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.warn("Popup blocked: Please allow popups to download/print payslip PDF.");
    return;
  }

  const netInWords = numberToWords(payslip.netPayable);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${payslip.staffName} (${payslip.monthYear})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 30px 20px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .payslip-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      padding: 36px;
      position: relative;
      overflow: hidden;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(14, 165, 233, 0.03);
      letter-spacing: 12px;
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      text-transform: uppercase;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .org-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .org-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #ea6118;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
    }

    .org-info h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .org-info p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .slip-badge {
      text-align: right;
    }

    .slip-title {
      font-size: 15px;
      font-weight: 800;
      color: #ea6118;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .slip-period {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }

    .slip-status {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      background: #dcfce7;
      color: #166534;
      font-size: 10px;
      font-weight: 800;
      border-radius: 999px;
      text-transform: uppercase;
    }

    .grid-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .info-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      font-size: 12px;
    }

    .info-label {
      width: 140px;
      color: #64748b;
      font-weight: 600;
    }

    .info-value {
      flex: 1;
      color: #0f172a;
      font-weight: 700;
    }

    /* Attendance summary pills */
    .attendance-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .att-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 8px;
      text-align: center;
    }

    .att-card.danger {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .att-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .att-num {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }

    .att-card.danger .att-num {
      color: #dc2626;
    }

    /* Earnings & Deductions Tables */
    .salary-tables {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .table-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .table-box-header {
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
    }

    .earnings-head {
      background: #f0fdf4;
      color: #166534;
      border-bottom: 1px solid #bbf7d0;
    }

    .deductions-head {
      background: #fef2f2;
      color: #991b1b;
      border-bottom: 1px solid #fecaca;
    }

    .table-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row .item-name {
      color: #475569;
      font-weight: 500;
    }

    .table-row .item-val {
      font-weight: 700;
      color: #0f172a;
    }

    .deduct-item {
      color: #dc2626 !important;
    }

    .table-box-footer {
      padding: 10px 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 800;
    }

    /* Net Payout Banner */
    .net-banner {
      background: linear-gradient(135deg, #0a1b45 0%, #1e3a8a 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .net-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
    }

    .net-words {
      font-size: 12px;
      font-weight: 600;
      margin-top: 4px;
      color: #fce3cf;
    }

    .net-amount {
      font-size: 28px;
      font-weight: 900;
      color: #38bdf8;
      letter-spacing: -0.5px;
      text-align: right;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 36px;
      border-top: 1px dashed #cbd5e1;
      position: relative;
      z-index: 1;
    }

    .sign-col {
      text-align: center;
      width: 200px;
    }

    .sign-line {
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 6px;
    }

    .sign-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .print-controls {
      text-align: center;
      margin-top: 24px;
    }

    .btn-print {
      background: #ea6118;
      color: #ffffff;
      border: none;
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(234, 97, 24, 0.3);
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .payslip-container {
        border: none;
        box-shadow: none;
        padding: 20px 0;
      }
      .print-controls {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="payslip-container">
    <div class="watermark">CONFIDENTIAL</div>

    <!-- Header -->
    <div class="header">
      <div class="org-brand">
        <div class="org-logo">HR</div>
        <div class="org-info">
          <h1>HROne Institutional Group</h1>
          <p>Multi-Campus Operations • Sivakasi &amp; Srivilliputhur Branches</p>
        </div>
      </div>
      <div class="slip-badge">
        <div class="slip-title">Salary Payslip</div>
        <div class="slip-period">${payslip.monthYear}</div>
        <span class="slip-status">${payslip.status}</span>
      </div>
    </div>

    <!-- Employee & Bank Info -->
    <div class="grid-section">
      <div class="info-col">
        <div class="info-row">
          <span class="info-label">Staff Name:</span>
          <span class="info-value">${payslip.staffName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Staff / Emp ID:</span>
          <span class="info-value">${staff?.employeeId || payslip.staffId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Designation / Role:</span>
          <span class="info-value">${staff?.designation || payslip.role}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Branch Campus:</span>
          <span class="info-value">${payslip.branch} Branch</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date of Joining:</span>
          <span class="info-value">${staff?.doj || "01-01-2026"}</span>
        </div>
      </div>

      <div class="info-col">
        <div class="info-row">
          <span class="info-label">Mobile Number:</span>
          <span class="info-value">${staff?.mobile || "-"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Bank Account:</span>
          <span class="info-value">${staff?.bankAccount || "SBIN00889911"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Bank IFSC:</span>
          <span class="info-value">${staff?.ifscCode || "SBIN0001234"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">PAN Number:</span>
          <span class="info-value">${staff?.panNumber || "ABCDE1234F"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Mode:</span>
          <span class="info-value">Direct Bank Transfer</span>
        </div>
      </div>
    </div>

    <!-- Attendance Performance Summary -->
    <div class="attendance-bar">
      <div class="att-card">
        <div class="att-title">Calendar Days</div>
        <div class="att-num">${payslip.totalDaysInMonth}</div>
      </div>
      <div class="att-card">
        <div class="att-title">Present Days</div>
        <div class="att-num">${payslip.presentDays}</div>
      </div>
      <div class="att-card">
        <div class="att-title">Half Days</div>
        <div class="att-num">${payslip.halfDays}</div>
      </div>
      <div class="att-card ${payslip.absentDays > 0 ? "danger" : ""}">
        <div class="att-title">Absent / LOP</div>
        <div class="att-num">${payslip.absentDays}</div>
      </div>
      <div class="att-card ${payslip.excessLateCount > 0 ? "danger" : ""}">
        <div class="att-title">Lates (${payslip.lateCount})</div>
        <div class="att-num">${payslip.excessLateCount > 0 ? `-${payslip.excessLateCount * 0.5}d` : "Normal"}</div>
      </div>
      <div class="att-card">
        <div class="att-title">Paid Days</div>
        <div class="att-num">${(payslip.totalDaysInMonth - payslip.lopDays - (payslip.excessLateCount * 0.5)).toFixed(1)}</div>
      </div>
    </div>

    <!-- Earnings and Deductions Table -->
    <div class="salary-tables">
      <!-- Earnings Box -->
      <div class="table-box">
        <div class="table-box-header earnings-head">
          <span>Earnings &amp; Allowances</span>
          <span>Amount</span>
        </div>
        <div class="table-row">
          <span class="item-name">Basic Pay</span>
          <span class="item-val">${formatInr(payslip.basicPay)}</span>
        </div>
        <div class="table-row">
          <span class="item-name">House Rent Allowance (HRA)</span>
          <span class="item-val">${formatInr(payslip.hra)}</span>
        </div>
        <div class="table-row">
          <span class="item-name">Special &amp; Performance Allowance</span>
          <span class="item-val">${formatInr(payslip.specialAllowance)}</span>
        </div>
        ${
          payslip.otherAllowances > 0
            ? `
        <div class="table-row">
          <span class="item-name">Other Allowances / Bonus</span>
          <span class="item-val">${formatInr(payslip.otherAllowances)}</span>
        </div>
        `
            : ""
        }
        <div class="table-box-footer">
          <span>Total Gross Pay (A)</span>
          <span style="color: #166534;">${formatInr(payslip.grossSalary)}</span>
        </div>
      </div>

      <!-- Deductions Box -->
      <div class="table-box">
        <div class="table-box-header deductions-head">
          <span>Deductions &amp; Penalties</span>
          <span>Amount</span>
        </div>
        <div class="table-row">
          <span class="item-name">Attendance / LOP Deduction</span>
          <span class="item-val deduct-item">- ${formatInr(payslip.lopDeduction)}</span>
        </div>
        ${
          payslip.lateDeduction > 0
            ? `
        <div class="table-row">
          <span class="item-name">Late Arrival Policy Penalty</span>
          <span class="item-val deduct-item">- ${formatInr(payslip.lateDeduction)}</span>
        </div>
        `
            : ""
        }
        ${
          payslip.permissionDeduction > 0
            ? `
        <div class="table-row">
          <span class="item-name">Excess Permission Deduction</span>
          <span class="item-val deduct-item">- ${formatInr(payslip.permissionDeduction)}</span>
        </div>
        `
            : ""
        }
        <div class="table-row">
          <span class="item-name">Provident Fund (PF)</span>
          <span class="item-val deduct-item">- ${formatInr(payslip.pfDeduction)}</span>
        </div>
        <div class="table-row">
          <span class="item-name">TDS / Professional Tax</span>
          <span class="item-val deduct-item">- ${formatInr(payslip.tdsDeduction)}</span>
        </div>
        ${
          payslip.otherDeductions > 0
            ? `
        <div class="table-row">
          <span class="item-name">Other Adjustments</span>
          <span class="item-val deduct-item">- ${formatInr(payslip.otherDeductions)}</span>
        </div>
        `
            : ""
        }
        <div class="table-box-footer">
          <span>Total Deductions (B)</span>
          <span style="color: #dc2626;">- ${formatInr(payslip.totalDeductions)}</span>
        </div>
      </div>
    </div>

    <!-- Net Salary Banner -->
    <div class="net-banner">
      <div>
        <div class="net-label">Net Take-Home Salary (A - B)</div>
        <div class="net-words">${netInWords}</div>
      </div>
      <div>
        <div class="net-amount">${formatInr(payslip.netPayable)}</div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sign-col">
        <div class="sign-line"></div>
        <div class="sign-label">Employee Signature</div>
      </div>
      <div class="sign-col">
        <div class="sign-line"></div>
        <div class="sign-label">HR / Accounts Officer</div>
      </div>
      <div class="sign-col">
        <div class="sign-line"></div>
        <div class="sign-label">General Manager / MD</div>
      </div>
    </div>

    <div class="print-controls">
      <button onclick="window.print()" class="btn-print">🖨️ Print / Save Official PDF</button>
    </div>
  </div>

</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generate Master Salary Register & Summary PDF for all staff
 */
export function generateSalaryMasterRegisterPdf(
  payslips: AttendanceDeductionBreakdown[],
  monthYear: string,
  branchTitle: string = "All Branches"
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.warn("Popup blocked: Please allow popups to download/print salary register PDF.");
    return;
  }

  const totalGross = payslips.reduce((acc, curr) => acc + curr.grossSalary, 0);
  const totalDeductions = payslips.reduce((acc, curr) => acc + curr.totalDeductions, 0);
  const totalNet = payslips.reduce((acc, curr) => acc + curr.netPayable, 0);

  const rows = payslips
    .map(
      (p, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 700;">${p.staffName}</td>
        <td>${p.branch}</td>
        <td>${p.role}</td>
        <td style="text-align: right; font-weight: 600;">${formatInr(p.baseSalary)}</td>
        <td style="text-align: center;">${p.totalDaysInMonth - p.lopDays} / ${p.totalDaysInMonth}</td>
        <td style="text-align: right; color: #dc2626; font-weight: 600;">${p.totalAttendanceDeduction > 0 ? "- " + formatInr(p.totalAttendanceDeduction) : "₹ 0.00"}</td>
        <td style="text-align: right; color: #dc2626;">- ${formatInr(p.totalDeductions)}</td>
        <td style="text-align: right; font-weight: 800; color: #166534;">${formatInr(p.netPayable)}</td>
        <td style="text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${p.status}</span></td>
      </tr>
    `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Monthly Salary Muster Register - ${monthYear}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 30px;
      color: #0f172a;
      background: #f8fafc;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .register-card {
      background: #fff;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      max-width: 1000px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary-box {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .summary-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .summary-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 8px 10px; font-weight: 700; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .btn-print { background: #ea6118; color: #fff; border: none; padding: 10px 24px; font-weight: 700; border-radius: 8px; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .register-card { border: none; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="register-card">
    <div class="header">
      <div>
        <h2 style="font-size: 20px; font-weight: 800;">Monthly Staff Salary Register &amp; Attendance Payout</h2>
        <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Branch: ${branchTitle} • Cycle: ${monthYear} • Authorized by HR, GM &amp; MD</p>
      </div>
      <button onclick="window.print()" class="btn-print">🖨️ Print Muster</button>
    </div>

    <div class="summary-grid">
      <div class="summary-box">
        <div class="summary-title">Total Staff Count</div>
        <div class="summary-val">${payslips.length} Employees</div>
      </div>
      <div class="summary-box">
        <div class="summary-title">Total Gross Pay</div>
        <div class="summary-val">${formatInr(totalGross)}</div>
      </div>
      <div class="summary-box">
        <div class="summary-title">Attendance &amp; Total Deductions</div>
        <div class="summary-val" style="color: #dc2626;">- ${formatInr(totalDeductions)}</div>
      </div>
      <div class="summary-box">
        <div class="summary-title">Net Bank Payout</div>
        <div class="summary-val" style="color: #166534;">${formatInr(totalNet)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Staff Name</th>
          <th>Branch</th>
          <th>Role</th>
          <th style="text-align: right;">Base Pay</th>
          <th style="text-align: center;">Paid Days</th>
          <th style="text-align: right;">Att. Deduct</th>
          <th style="text-align: right;">Total Deduct</th>
          <th style="text-align: right;">Net Payable</th>
          <th style="text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; padding-top: 40px; border-top: 1px dashed #cbd5e1;">
      <div style="text-align: center; width: 200px;">
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: 700; color: #64748b;">Prepared by HR Manager</div>
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: 700; color: #64748b;">Verified by General Manager (GM)</div>
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: 700; color: #64748b;">Approved by Managing Director (MD)</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
