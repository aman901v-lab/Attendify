import { AttendanceRecord, Employee, AttendanceStatus, Holiday } from './types.ts';

export const formatTime = (time?: string) => time || '--:--';

/**
 * Generates a local date string (YYYY-MM-DD) correctly handling timezone offsets.
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateHours = (inTime: string, outTime: string): number => {
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  let diff = (outH * 60 + outM) - (inH * 60 + inM);
  if (diff < 0) diff += 24 * 60; 
  return parseFloat((diff / 60).toFixed(2));
};

/**
 * AS PER FORMULA: 
 * Worked Hours = Total Time - 0.5 hr (lunch)
 */
export const calculateWorkedHours = (inTime: string, outTime: string): number => {
  const total = calculateHours(inTime, outTime);
  // Only apply lunch break deduction if they worked enough for a shift
  return Math.max(0, total - 0.5); 
};

/**
 * AS PER FORMULA: 
 * OT Hours = Worked Hours - 8
 */
export const getOT = (workedHours: number): number => {
  return Math.max(0, workedHours - 8);
};

export const getAutoStatus = (dateStr: string, employee: Employee, holidays: Holiday[]): AttendanceStatus | null => {
  const isHoliday = holidays.find(h => h.date === dateStr);
  if (isHoliday) return 'Holiday';
  
  // Parse YYYY-MM-DD manually to avoid UTC conversion shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  if (employee.weeklyOffs.includes(dayOfWeek)) return 'Weekly Off';
  return null;
};

/**
 * ATTENDANCE SYSTEM LOGIC: 26 DAYS CYCLE
 * 
 * Logic Overview:
 * 1. Daily Salary = Monthly Salary / 26
 * 2. Hourly Salary = Daily Salary / 8
 * 3. OT Earnings = OT Hours * Hourly Salary
 * 4. Deductions: Absent = 1 full day deduction, Half-day = 0.5 day deduction
 */
export const calculateSalary = (records: AttendanceRecord[], employee: Employee) => {
  const workingCycleDays = employee.workingDaysPerMonth || 26;
  const dailySalary = employee.monthlySalary / workingCycleDays;
  const hourlySalary = dailySalary / 8;
  
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
        totalDeductionDays += 0.5; // Deduction for 50% shift
        break;
      case 'Absent':
      case 'Unpaid':
        absentDaysCount++;
        totalDeductionDays += 1.0; // Full day deduction
        break;
      case 'SL':
      case 'PL':
      case 'CL':
        paidLeavesUsed++;
        // Paid leaves don't deduct from fixed monthly salary
        break;
      default:
        // Weekly Off and Holidays are paid by default
        break;
    }
  });

  const totalDeductionAmount = totalDeductionDays * dailySalary;
  // Use calculated hourly salary for OT if rate is not specifically set
  const actualOTRate = employee.otRate > 0 ? employee.otRate : hourlySalary;
  const otEarnings = totalOTHours * actualOTRate;
  
  const netSalary = employee.monthlySalary - totalDeductionAmount + otEarnings;

  return {
    dailyRate: dailySalary,
    hourlyRate: hourlySalary,
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