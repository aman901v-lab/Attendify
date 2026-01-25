
import { AttendanceRecord, Employee, AttendanceStatus, Holiday } from './types.ts';

export const formatTime = (time?: string) => time || '--:--';

export const calculateHours = (inTime: string, outTime: string): number => {
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  
  let diff = (outH * 60 + outM) - (inH * 60 + inM);
  if (diff < 0) diff += 24 * 60; // Crosses midnight
  
  return parseFloat((diff / 60).toFixed(2));
};

export const getOT = (hours: number, dailyTarget: number = 8.5): number => {
  return Math.max(0, hours - dailyTarget);
};

export const getAutoStatus = (dateStr: string, employee: Employee, holidays: Holiday[]): AttendanceStatus | null => {
  const isHoliday = holidays.some(h => h.date === dateStr);
  if (isHoliday) return 'Holiday';

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  if (employee.weeklyOffs.includes(dayOfWeek)) return 'Weekly Off';

  return null;
};

export const calculateSalary = (records: AttendanceRecord[], employee: Employee) => {
  const dailyRate = employee.monthlySalary / 26;
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
      deductions += dailyRate * 0.5;
    } else if (r.status === 'Absent' || r.status === 'Unpaid') {
      absentDays++;
      deductions += dailyRate;
    } else if (['SL', 'PL', 'CL'].includes(r.status)) {
      paidLeavesUsed++;
    }
  });

  const otEarnings = totalOTHours * employee.otRate;
  const netSalary = employee.monthlySalary + otEarnings - deductions;

  return {
    dailyRate,
    totalOTHours,
    otEarnings,
    deductions,
    netSalary,
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
