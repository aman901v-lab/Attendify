
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
 * DYNAMIC SALARY LOGIC
 * Monthly Salary / configured working days = Per Day Rate.
 * Total Salary = Monthly Salary - (Absent Days * Per Day Rate) - (Half Days * 0.5 * Per Day Rate) + OT.
 * Holidays and Weekly Offs are NOT deducted (Paid).
 */
export const calculateSalary = (records: AttendanceRecord[], employee: Employee) => {
  // Use employee's specific working day configuration, fallback to 26 if not set
  const daysPerMonth = employee.workingDaysPerMonth || 26;
  const dailyRate = employee.monthlySalary / daysPerMonth;
  
  let totalOTHours = 0;
  let deductions = 0;
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let paidLeavesUsed = 0;

  records.forEach(r => {
    if (r.status === 'Duty') {
      presentDays++;
      if (r.otHours) totalOTHours += r.otHours;
    } else if (r.status === 'Half-Day') {
      halfDays++;
      // Deduct half day (0.5 * dailyRate)
      deductions += dailyRate * 0.5;
    } else if (r.status === 'Absent' || r.status === 'Unpaid') {
      absentDays++;
      // Deduct full day
      deductions += dailyRate;
    } else if (['SL', 'PL', 'CL'].includes(r.status)) {
      // These are paid leave types, no deduction
      paidLeavesUsed++;
    }
  });

  const otEarnings = totalOTHours * employee.otRate;
  
  // Final Net = Monthly Base - Deductions + OT
  const netSalary = employee.monthlySalary - deductions + otEarnings;

  return {
    dailyRate,
    totalOTHours,
    otEarnings,
    deductions,
    netSalary: Math.max(0, netSalary),
    presentDays,
    halfDays,
    absentDays,
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
