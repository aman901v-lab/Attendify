import { AttendanceRecord, Employee, AttendanceStatus, Holiday } from './types.ts';

export const formatTime = (time?: string) => time || '--:--';

export const calculateHours = (inTime: string, outTime: string): number => {
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  let diff = (outH * 60 + outM) - (inH * 60 + inM);
  if (diff < 0) diff += 24 * 60; 
  return parseFloat((diff / 60).toFixed(2));
};

export const getOT = (hours: number, dailyTarget: number = 8.5): number => {
  return Math.max(0, hours - dailyTarget);
};

export const getAutoStatus = (dateStr: string, employee: Employee, holidays: Holiday[]): AttendanceStatus | null => {
  const isHoliday = holidays.find(h => h.date === dateStr);
  if (isHoliday) return 'Holiday';
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  if (employee.weeklyOffs.includes(dayOfWeek)) return 'Weekly Off';
  return null;
};

/**
 * ATTENDANCE SYSTEM LOGIC: 26 DAYS CYCLE
 * 
 * Logic Overview:
 * 1. Base Salary is divided by 26 to find the Daily Rate.
 * 2. Deductions are triggered by 'Absent', 'Unpaid', or 'Half-Day' statuses.
 * 3. Weekly Offs and Holidays do not count as absent days (they are paid/included).
 * 
 * Calculation:
 * Net Salary = Base Salary - (Deduction Days * Daily Rate) + (OT Hours * OT Rate)
 */
export const calculateSalary = (records: AttendanceRecord[], employee: Employee) => {
  const workingCycleDays = employee.workingDaysPerMonth || 26;
  const dailyRate = employee.monthlySalary / workingCycleDays;
  
  let totalOTHours = 0;
  let totalDeductionDays = 0;
  let presentDays = 0;
  let halfDaysCount = 0;
  let absentDaysCount = 0;
  let paidLeavesUsed = 0;

  records.forEach(r => {
    switch (r.status) {
      case 'Duty':
        presentDays++;
        if (r.otHours) totalOTHours += r.otHours;
        break;
      case 'Half-Day':
        halfDaysCount++;
        totalDeductionDays += 0.5; // Deduction of half-day pay
        break;
      case 'Absent':
      case 'Unpaid':
        absentDaysCount++;
        totalDeductionDays += 1.0; // Deduction of full-day pay
        break;
      case 'SL':
      case 'PL':
      case 'CL':
        paidLeavesUsed++;
        // Paid leaves are part of the quota and do not deduct salary
        break;
      default:
        // Weekly Off, Holidays, etc. are not deducted
        break;
    }
  });

  const totalDeductionAmount = totalDeductionDays * dailyRate;
  const otEarnings = totalOTHours * (employee.otRate || 0);
  const netSalary = employee.monthlySalary - totalDeductionAmount + otEarnings;

  return {
    dailyRate,
    totalOTHours,
    otEarnings,
    deductions: totalDeductionAmount,
    netSalary: Math.max(0, netSalary),
    presentDays,
    halfDays: halfDaysCount,
    absentDays: absentDaysCount,
    paidLeavesUsed,
  };
};

export const downloadCSV = (data: string, filename: string) => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};