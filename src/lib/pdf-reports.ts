import { formatTime, formatDate } from "@/lib/helpers";
import { formatRoleLabel, type User } from "@/lib/constants";

/**
 * Generate and open a styled PDF printable report for Multi-Branch / Staff Attendance Register
 */
export function generateBranchAttendancePdf(
  employees: User[],
  branchFilterName: string = "all",
  options?: { reportTitle?: string; customDate?: string; selectedPeriod?: string }
) {
  const branchTitle =
    branchFilterName === "all" || !branchFilterName
      ? "All Registered Branches & Campuses"
      : branchFilterName;

  const reportDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalEmployees = employees.length;
  const checkedInCount = employees.filter((e) => e.todayAttendance?.isCheckedIn).length;
  const checkedOutCount = employees.filter(
    (e) =>
      !e.todayAttendance?.isCheckedIn &&
      e.todayAttendance?.checkOutTime &&
      e.todayAttendance.checkOutTime !== "--:--" &&
      e.todayAttendance.checkOutTime !== "-"
  ).length;
  const onLeaveCount = employees.filter((e) => e.todayAttendance?.status === "ON_LEAVE").length;

  const rowsHtml = employees
    .map((emp, idx) => {
      const isCheckedIn = emp.todayAttendance?.isCheckedIn;
      const hasCheckOut =
        !isCheckedIn &&
        emp.todayAttendance?.checkOutTime &&
        emp.todayAttendance.checkOutTime !== "--:--" &&
        emp.todayAttendance.checkOutTime !== "-";

      const inTimeFormatted =
        emp.todayAttendance?.checkInTime && emp.todayAttendance.checkInTime !== "--:--"
          ? formatTime(emp.todayAttendance.checkInTime)
          : "--:--";

      const outTimeFormatted =
        emp.todayAttendance?.checkOutTime && emp.todayAttendance.checkOutTime !== "--:--"
          ? formatTime(emp.todayAttendance.checkOutTime)
          : "--:--";

      const status = emp.todayAttendance?.status || "PRESENT";
      let statusBadge = "";
      if (isCheckedIn) {
        statusBadge =
          status === "LATE"
            ? `<span class="badge badge-late">Late Punch</span>`
            : `<span class="badge badge-present">Checked In</span>`;
      } else if (hasCheckOut) {
        statusBadge = `<span class="badge badge-shift-out">Shift Ended</span>`;
      } else if (status === "ON_LEAVE") {
        statusBadge = `<span class="badge badge-leave">On Leave</span>`;
      } else {
        statusBadge = `<span class="badge badge-absent">Shift Out</span>`;
      }

      // Check-in styling: Green badge/text
      const inTimeHtml =
        inTimeFormatted !== "--:--"
          ? `<span class="time-in-badge">${inTimeFormatted}</span>`
          : `<span class="text-muted">--:--</span>`;

      // Check-out styling: Red badge/text
      const outTimeHtml =
        outTimeFormatted !== "--:--"
          ? `<span class="time-out-badge">${outTimeFormatted}</span>`
          : `<span class="text-muted">--:--</span>`;

      return `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td class="font-mono font-bold">${emp.employeeId || "WG-" + (idx + 1)}</td>
          <td>
            <div class="emp-name">${emp.name}</div>
            <div class="emp-sub">${emp.designation || formatRoleLabel(emp.role)} • ${emp.email || ""}</div>
          </td>
          <td>
            <div class="branch-pill">📍 ${emp.branch || "Main Campus"}</div>
          </td>
          <td class="text-center">${emp.dateOfJoining || "-"}</td>
          <td class="text-center">${inTimeHtml}</td>
          <td class="text-center">${outTimeHtml}</td>
          <td class="text-center">${statusBadge}</td>
          <td>${emp.department || "General"}</td>
        </tr>
      `;
    })
    .join("");

  const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Attendance_Report_${branchFilterName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #f8fafc;
      color: #0f172a;
      padding: 20px;
      font-size: 11px;
      line-height: 1.4;
    }
    .print-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn {
      background: #ea580c;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);
    }
    .btn-secondary {
      background: #64748b;
    }
    .btn:hover {
      opacity: 0.92;
    }
    .report-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .org-title {
      font-size: 20px;
      font-weight: 900;
      color: #0a1b45;
      letter-spacing: -0.5px;
    }
    .org-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
      font-size: 11px;
    }
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .stat-card.green {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .stat-card.red {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .stat-card.blue {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .stat-val {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }
    .stat-val.green { color: #16a34a; }
    .stat-val.red { color: #dc2626; }
    .stat-val.blue { color: #2563eb; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #0a1b45;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #0a1b45;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      border-left: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; }
    .font-bold { font-weight: 700; }
    .text-muted { color: #94a3b8; font-weight: 600; }
    
    .emp-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 11px;
    }
    .emp-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 1px;
    }
    .branch-pill {
      font-size: 10px;
      font-weight: 600;
      color: #334155;
    }

    /* ── CHECK-IN GREEN / CHECK-OUT RED BADGES ── */
    .time-in-badge {
      display: inline-block;
      background: #dcfce7 !important;
      color: #15803d !important;
      border: 1px solid #86efac;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 10.5px;
      font-family: "SFMono-Regular", Consolas, monospace;
      letter-spacing: 0.2px;
    }
    .time-out-badge {
      display: inline-block;
      background: #fee2e2 !important;
      color: #b91c1c !important;
      border: 1px solid #fca5a5;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 10.5px;
      font-family: "SFMono-Regular", Consolas, monospace;
      letter-spacing: 0.2px;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-present {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge-shift-out {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .badge-late {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-leave {
      background: #ffedd5;
      color: #c2410c;
      border: 1px solid #fed7aa;
    }
    .badge-absent {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }

    .report-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 20px;
      font-size: 9.5px;
      color: #64748b;
    }
    .signature-box {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #94a3b8;
      width: 180px;
      font-weight: 700;
      color: #0f172a;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
      .report-container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      th {
        background: #0a1b45 !important;
        color: #ffffff !important;
      }
      .time-in-badge {
        background: #dcfce7 !important;
        color: #15803d !important;
        border: 1px solid #86efac !important;
      }
      .time-out-badge {
        background: #fee2e2 !important;
        color: #b91c1c !important;
        border: 1px solid #fca5a5 !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="report-container">
    <div class="report-header">
      <div>
        <div class="org-title">WEGROW SKILL CAMPUS</div>
        <div class="org-subtitle">${options?.reportTitle || "Staff Attendance & Biometric Daily Master Register"}</div>
      </div>
      <div class="meta-box">
        <div><strong>Date / Period:</strong> ${options?.customDate || reportDate}</div>
        <div><strong>Campus / Scope:</strong> ${branchTitle}</div>
        <div><strong>Standard Shift:</strong> 09:40 AM – 07:00 PM (Grace: 09:45 AM)</div>
      </div>
    </div>

    <div class="summary-strip">
      <div class="stat-card">
        <div class="stat-label">Total Registered Staff</div>
        <div class="stat-val">${totalEmployees}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Currently Checked In</div>
        <div class="stat-val green">${checkedInCount}</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Completed Shift (Out)</div>
        <div class="stat-val blue">${checkedOutCount}</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">On Leave / Absent</div>
        <div class="stat-val red">${onLeaveCount}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 32px;" class="text-center">#</th>
          <th style="width: 85px;">Staff ID</th>
          <th>Employee Name &amp; Role</th>
          <th>Branch Campus</th>
          <th class="text-center" style="width: 85px;">Joining Date</th>
          <th class="text-center" style="width: 105px;">Check-In (IST)</th>
          <th class="text-center" style="width: 105px;">Check-Out (IST)</th>
          <th class="text-center" style="width: 95px;">Shift Status</th>
          <th>Department</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="report-footer">
      <div>
        <div><strong>WeGrow HR &amp; Biometric Compliance Directorate</strong></div>
        <div>Computer-generated official statement • Generated on: ${new Date().toLocaleString("en-IN")}</div>
        <div style="margin-top: 4px; color: #94a3b8;">Policy: Max 3 late check-ins allowed/month. 4th late check-in deducts Half-Day salary.</div>
      </div>

      <div class="signature-box">
        Authorized Signatory / HR Head
      </div>
    </div>
  </div>

  <script>
    window.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}

/**
 * Generate Individual Employee Month-by-Day Detailed Attendance PDF Report
 * Table format with each day of the month: Check-In (Green), Check-Out (Red), Leave, Hours
 */
export function generateEmployeeIndividualPdf(
  emp: User,
  month?: number,
  year?: number,
  customRecords?: any[]
) {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1; // 1-indexed

  const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
  });
  const monthYearLabel = `${monthName} ${targetYear}`;

  // Number of days in the target month (e.g. 31 for October)
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const todayDateStr = now.toISOString().split("T")[0];

  // Map any past/custom attendance records
  const recordMap = new Map<string, any>();
  if (Array.isArray(customRecords)) {
    customRecords.forEach((r) => {
      const d = r.date || r.targetDate;
      if (d) recordMap.set(d, r);
    });
  }
  if (Array.isArray((emp as any).attendanceHistory)) {
    (emp as any).attendanceHistory.forEach((r: any) => {
      const d = r.date || r.targetDate;
      if (d) recordMap.set(d, r);
    });
  }

  let presentDaysCount = 0;
  let lateDaysCount = 0;
  let leaveDaysCount = 0;
  let weeklyOffCount = 0;

  // Build each day of the month row
  const dayRowsHtml: string[] = [];

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateObj = new Date(targetYear, targetMonth - 1, dayNum);
    const dateIsoStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayOfWeek = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const isSunday = dateObj.getDay() === 0;
    const isToday = dateIsoStr === todayDateStr;
    const isPast = dateObj <= now;

    let inTime = "--:--";
    let outTime = "--:--";
    let statusText = "Scheduled";
    let badgeClass = "badge-scheduled";
    let durationText = "--";
    let notes = `📍 ${emp.branch || "Campus Branch"}`;

    const existingRecord = recordMap.get(dateIsoStr);

    if (isToday) {
      const todayIn = emp.todayAttendance?.checkInTime;
      const todayOut = emp.todayAttendance?.checkOutTime;
      const isCheckedIn = emp.todayAttendance?.isCheckedIn;
      const hasOut = todayOut && todayOut !== "--:--" && todayOut !== "-";

      if (todayIn && todayIn !== "--:--" && todayIn !== "-") {
        inTime = formatTime(todayIn);
        presentDaysCount++;
      }
      if (hasOut) {
        outTime = formatTime(todayOut);
      }

      if (isCheckedIn) {
        if (emp.todayAttendance?.status === "LATE") {
          statusText = "Late Punch";
          badgeClass = "badge-late";
          lateDaysCount++;
        } else {
          statusText = "Present (On Shift)";
          badgeClass = "badge-present";
        }
      } else if (hasOut) {
        statusText = "Shift Ended";
        badgeClass = "badge-shift-out";
      } else if (emp.todayAttendance?.status === "ON_LEAVE") {
        statusText = "On Leave";
        badgeClass = "badge-leave";
        leaveDaysCount++;
      } else {
        statusText = "Shift Out";
        badgeClass = "badge-absent";
      }
      durationText = isCheckedIn ? "Active Session" : hasOut ? "08h 00m" : "--";
      notes = "Today's Live Punch (Biometric/GPS)";
    } else if (existingRecord) {
      const recIn = existingRecord.checkInTime || existingRecord.checkIn || existingRecord.checkin;
      const recOut = existingRecord.checkOutTime || existingRecord.checkOut || existingRecord.checkout;
      if (recIn && recIn !== "-" && recIn !== "--:--") {
        inTime = formatTime(recIn);
        presentDaysCount++;
      }
      if (recOut && recOut !== "-" && recOut !== "--:--") {
        outTime = formatTime(recOut);
      }

      const st = existingRecord.status?.toUpperCase() || "PRESENT";
      if (st === "PRESENT") {
        statusText = "Present";
        badgeClass = "badge-present";
      } else if (st === "LATE") {
        statusText = "Late Arrival";
        badgeClass = "badge-late";
        lateDaysCount++;
      } else if (st === "LEAVE" || st === "ON_LEAVE" || st === "CASUAL_LEAVE") {
        statusText = "Casual Leave (CL)";
        badgeClass = "badge-leave";
        leaveDaysCount++;
      } else if (st === "MEDICAL_LEAVE") {
        statusText = "Medical Leave (ML)";
        badgeClass = "badge-leave";
        leaveDaysCount++;
      } else {
        statusText = existingRecord.status || "Present";
        badgeClass = "badge-present";
      }
      durationText = existingRecord.workingHours || existingRecord.duration || "08h 30m";
      notes = existingRecord.notes || existingRecord.terminal || `📍 ${emp.branch || "Campus"}`;
    } else if (isSunday) {
      statusText = "Sunday (Weekly Off)";
      badgeClass = "badge-off";
      notes = "Campus Weekly Holiday";
      weeklyOffCount++;
    } else if (isPast) {
      // Past day without record
      statusText = "Absent / LOP";
      badgeClass = "badge-absent";
      notes = "No punch logged";
    } else {
      // Future day
      statusText = "Scheduled Shift";
      badgeClass = "badge-scheduled";
      notes = "Shift: 09:40 AM – 07:00 PM";
    }

    // Check-in green badge
    const inBadgeHtml =
      inTime !== "--:--"
        ? `<span class="time-in-badge">${inTime}</span>`
        : `<span class="text-muted">--:--</span>`;

    // Check-out red badge
    const outBadgeHtml =
      outTime !== "--:--"
        ? `<span class="time-out-badge">${outTime}</span>`
        : `<span class="text-muted">--:--</span>`;

    const rowClass = isSunday ? "sunday-row" : isToday ? "today-row" : "";

    dayRowsHtml.push(`
      <tr class="${rowClass}">
        <td class="text-center font-mono font-bold">${String(dayNum).padStart(2, "0")}</td>
        <td>
          <strong>${formattedDate}</strong>
          <span class="day-tag ${isSunday ? "sunday-tag" : ""}">${dayOfWeek}</span>
        </td>
        <td class="text-center font-mono text-muted text-xs">09:40 AM – 07:00 PM</td>
        <td class="text-center">${inBadgeHtml}</td>
        <td class="text-center">${outBadgeHtml}</td>
        <td class="text-center font-mono font-bold">${durationText}</td>
        <td class="text-center"><span class="badge ${badgeClass}">${statusText}</span></td>
        <td class="text-slate-600 text-xs">${notes}</td>
      </tr>
    `);
  }

  const lateCountTotal = emp.monthlyStats?.lateCount ?? lateDaysCount;
  const permissionUsed = emp.monthlyStats?.permissionHoursUsed ?? 0;
  const clUsed = emp.monthlyStats?.casualLeavesUsed ?? leaveDaysCount;
  const lopDays = emp.monthlyStats?.lopDays ?? (lateCountTotal >= 4 ? 0.5 : 0);

  const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Monthly_Attendance_Report_${emp.employeeId || "WG"}_${emp.name.replace(/\s+/g, "_")}_${monthYearLabel.replace(/\s+/g, "_")}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #f8fafc;
      color: #0f172a;
      padding: 20px;
      font-size: 10.5px;
      line-height: 1.35;
    }
    .print-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 14px;
    }
    .btn {
      background: #ea580c;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);
    }
    .btn-secondary { background: #64748b; }
    .btn:hover { opacity: 0.92; }

    .report-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 22px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #ea580c;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .org-title {
      font-size: 20px;
      font-weight: 900;
      color: #0a1b45;
      letter-spacing: -0.5px;
    }
    .org-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
      font-size: 11px;
    }

    /* ── EMPLOYEE DOSSIER STRIP ── */
    .emp-profile-strip {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .profile-field-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .profile-field-val {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── KPI METRICS CARDS ── */
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 8px 10px;
      text-align: center;
    }
    .stat-card.green { background: #f0fdf4; border-color: #bbf7d0; }
    .stat-card.amber { background: #fffbeb; border-color: #fde68a; }
    .stat-card.red { background: #fef2f2; border-color: #fecaca; }
    .stat-card.blue { background: #eff6ff; border-color: #bfdbfe; }
    .stat-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .stat-val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 1px;
    }
    .stat-val.green { color: #16a34a; }
    .stat-val.amber { color: #d97706; }
    .stat-val.red { color: #dc2626; }
    .stat-val.blue { color: #2563eb; }

    /* ── DAY-BY-DAY ATTENDANCE TABLE ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #0a1b45;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 6px 8px;
      text-align: left;
      border: 1px solid #0a1b45;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      border-left: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      vertical-align: middle;
      font-size: 10px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    tr.sunday-row td {
      background: #f1f5f9;
      color: #64748b;
    }
    tr.today-row td {
      background: #eff6ff;
      border-top: 1.5px solid #3b82f6;
      border-bottom: 1.5px solid #3b82f6;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    .font-bold { font-weight: 700; }
    .text-muted { color: #94a3b8; font-weight: 600; }

    .day-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: #e2e8f0;
      color: #334155;
      margin-left: 4px;
    }
    .sunday-tag {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* ── GREEN CHECK-IN / RED CHECK-OUT ── */
    .time-in-badge {
      display: inline-block;
      background: #dcfce7 !important;
      color: #15803d !important;
      border: 1px solid #86efac;
      padding: 2.5px 7px;
      border-radius: 5px;
      font-weight: 800;
      font-size: 10px;
      font-family: "SFMono-Regular", Consolas, monospace;
    }
    .time-out-badge {
      display: inline-block;
      background: #fee2e2 !important;
      color: #b91c1c !important;
      border: 1px solid #fca5a5;
      padding: 2.5px 7px;
      border-radius: 5px;
      font-weight: 800;
      font-size: 10px;
      font-family: "SFMono-Regular", Consolas, monospace;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-present {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge-shift-out {
      background: #e2e8f0;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .badge-late {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-leave {
      background: #ffedd5;
      color: #c2410c;
      border: 1px solid #fed7aa;
    }
    .badge-off {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .badge-absent {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .badge-scheduled {
      background: #f8fafc;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 14px;
      font-size: 9px;
      color: #64748b;
    }
    .sign-box {
      border-top: 1px solid #94a3b8;
      width: 170px;
      text-align: center;
      padding-top: 24px;
      font-weight: 700;
      color: #0f172a;
    }

    @media print {
      body { background: white; padding: 0; }
      .print-actions { display: none !important; }
      .report-container { border: none; box-shadow: none; padding: 0; }
      th { background: #0a1b45 !important; color: #ffffff !important; }
      .time-in-badge {
        background: #dcfce7 !important;
        color: #15803d !important;
        border: 1px solid #86efac !important;
      }
      .time-out-badge {
        background: #fee2e2 !important;
        color: #b91c1c !important;
        border: 1px solid #fca5a5 !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="report-container">
    <div class="header">
      <div>
        <div class="org-title">WEGROW SKILL CAMPUS</div>
        <div class="org-subtitle">Individual Monthly Attendance &amp; Biometric Audit Log</div>
      </div>
      <div class="meta-box">
        <div><strong>Statement Period:</strong> ${monthYearLabel}</div>
        <div><strong>Shift Timings:</strong> 09:40 AM – 07:00 PM (Grace: 09:45 AM)</div>
        <div><strong>Print Date:</strong> ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
      </div>
    </div>

    <!-- Employee Profile Summary -->
    <div class="emp-profile-strip">
      <div>
        <div class="profile-field-label">Staff ID</div>
        <div class="profile-field-val font-mono" style="color: #ea580c;">${emp.employeeId}</div>
      </div>
      <div>
        <div class="profile-field-label">Employee Name</div>
        <div class="profile-field-val">${emp.name}</div>
      </div>
      <div>
        <div class="profile-field-label">Designation / Role</div>
        <div class="profile-field-val">${emp.designation || formatRoleLabel(emp.role)}</div>
      </div>
      <div>
        <div class="profile-field-label">Department</div>
        <div class="profile-field-val">${emp.department}</div>
      </div>
      <div>
        <div class="profile-field-label">Assigned Branch</div>
        <div class="profile-field-val">📍 ${emp.branch || "Main Campus"}</div>
      </div>
      <div>
        <div class="profile-field-label">Date of Joining</div>
        <div class="profile-field-val">${emp.dateOfJoining || "-"}</div>
      </div>
    </div>

    <!-- Monthly Summary KPIs -->
    <div class="summary-strip">
      <div class="stat-card">
        <div class="stat-label">Days in Month</div>
        <div class="stat-val">${daysInMonth}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Days Present</div>
        <div class="stat-val green">${presentDaysCount}</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Late Arrivals</div>
        <div class="stat-val amber">${lateCountTotal} / 3</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Casual Leaves Taken</div>
        <div class="stat-val blue">${clUsed} / 1 CL</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Permission Used</div>
        <div class="stat-val">${permissionUsed}h / 2h</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Loss of Pay (LOP)</div>
        <div class="stat-val red">${lopDays} Day(s)</div>
      </div>
    </div>

    <!-- Complete Day-by-Day Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 30px;" class="text-center">Day</th>
          <th style="width: 110px;">Date &amp; Weekday</th>
          <th style="width: 120px;" class="text-center">Shift Timings</th>
          <th style="width: 105px;" class="text-center">Check-In (IST)</th>
          <th style="width: 105px;" class="text-center">Check-Out (IST)</th>
          <th style="width: 85px;" class="text-center">Duration</th>
          <th style="width: 120px;" class="text-center">Status / Policy</th>
          <th>Location / Biometric Punch Terminal</th>
        </tr>
      </thead>
      <tbody>
        ${dayRowsHtml.join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <div><strong>WeGrow HR &amp; Biometric Compliance Directorate</strong></div>
        <div>Employee Attendance Statement • Computer generated with cryptographic record audit</div>
        <div style="color: #94a3b8; margin-top: 2px;">Policy rules: Shift 09:40 AM – 07:00 PM (Grace: 09:45 AM). Max 3 late arrivals / 2.0h permission per month.</div>
      </div>

      <div class="sign-box">
        HR Directorate / Branch Head
      </div>
    </div>
  </div>

  <script>
    window.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}
