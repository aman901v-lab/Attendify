import { AttendanceRecord, Employee, AttendanceStatus, Holiday } from './types.ts';

export const formatTime = (time?: string) => time || '--:--';

export const formatTime12h = (time24?: string): string => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

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
  return Math.round((diff / 60) * 100) / 100;
};

export const calculateWorkedHours = (inTime: string, outTime: string): number => {
  const total = calculateHours(inTime, outTime);
  const worked = Math.max(0, total - 0.5);
  return Math.round(worked * 100) / 100;
};

export const getOT = (workedHours: number): number => {
  const ot = Math.max(0, workedHours - 8);
  return Math.round(ot * 100) / 100;
};

export const getAutoStatus = (dateStr: string, employee: Employee, holidays: Holiday[]): AttendanceStatus | null => {
  const isHoliday = holidays.find(h => h.date === dateStr);
  if (isHoliday) return 'Holiday';
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  if (employee.weeklyOffs.includes(dayOfWeek)) return 'Weekly Off';
  return null;
};

export const calculateSalary = (records: AttendanceRecord[], employee: Employee) => {
  const workingCycleDays = Number(employee.workingDaysPerMonth) || 26;
  const monthlySalary = Number(employee.monthlySalary) || 0;
  const dailySalary = monthlySalary / workingCycleDays;
  const hourlyBaseSalary = dailySalary / 8;
  
  // Custom OT rate from staff profile or default to hourly base
  const otRate = (Number(employee.otRate) > 0) ? Number(employee.otRate) : hourlyBaseSalary;
  
  let totalOTHours = 0;
  let totalDeductionDays = 0;
  let presentDaysCount = 0;
  let absentDaysCount = 0;
  let halfDaysCount = 0;

  records.forEach(r => {
    if (r.status === 'Duty') {
      presentDaysCount++;
      if (r.otHours) totalOTHours += Number(r.otHours);
    } else if (r.status === 'Half-Day') {
      halfDaysCount++;
      totalDeductionDays += 0.5;
      if (r.otHours) totalOTHours += Number(r.otHours);
    } else if (r.status === 'Absent' || r.status === 'Unpaid') {
      absentDaysCount++;
      totalDeductionDays += 1;
    } else if (['SL', 'PL', 'CL', 'Holiday', 'Weekly Off'].includes(r.status)) {
        // These are typically paid, so no deduction, but also no present day count increment for salary purposes
    }
  });

  const roundedOTHours = Math.round(totalOTHours * 100) / 100;
  const otEarnings = roundedOTHours * otRate;
  const deductions = totalDeductionDays * dailySalary;
  
  const netSalary = monthlySalary - deductions + otEarnings;

  return {
    dailyRate: Math.round(dailySalary * 100) / 100,
    totalOTHours: roundedOTHours,
    otEarnings: Math.round(otEarnings * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    netSalary: Math.max(0, Math.round(netSalary)),
    presentDays: presentDaysCount,
    absentDays: absentDaysCount,
    halfDays: halfDaysCount,
    appliedOTRate: Math.round(otRate * 100) / 100
  };
};

export const downloadCSV = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};