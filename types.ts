
export type AttendanceStatus = 'Duty' | 'SL' | 'PL' | 'CL' | 'Unpaid' | 'Half-Day' | 'Weekly Off' | 'Holiday' | 'Absent';
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserRole = 'admin' | 'employee';
export type AppTheme = 'obsidian' | 'nordic' | 'midnight';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  accessibleTabs: string[];
  linkedEmployeeId?: string;
  provider: 'google' | 'facebook' | 'apple' | 'email' | 'phone' | 'credentials';
}

export interface LeaveQuotas {
  SL: number;
  PL: number;
  CL: number;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  monthlySalary: number;
  otRate: number;
  dailyWorkHours: number;
  quotas: LeaveQuotas;
  role: string;
  joinedDate: string;
  weeklyOffs: number[];
  notes?: string;
}

export interface AttendanceRecord {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes: string;
  totalHours?: number;
  otHours?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'SL' | 'PL' | 'CL' | 'Unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: string;
}

export interface UserSettings {
  theme: AppTheme;
  monthlySalary: number;
  otRate: number;
  dailyWorkHours: number;
  quotas: LeaveQuotas;
  weeklyOffs: number[];
  holidays: Holiday[];
}
