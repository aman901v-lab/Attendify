# 📅 Routinely – Attendance & Salary PWA

**Routinely (Fair Dealing Dhulagarh)** ek Progressive Web App (PWA) hai jo attendance, overtime, leave management aur salary calculation ko simple aur digital banata hai.  
Ye app specially mobile-first design ke sath banaya gaya hai aur GitHub Pages pe host hoga → directly aapke phone me "Add to Home Screen" option ke through native app jaisa experience.

---

## 🚀 Features

### 🔐 Login System
- Secure **Email/Password Login** (Firebase Auth).
- Future ready: Google Sign-in support.
- User-specific data storage (each user apna attendance & salary data dekh sakta hai).

### 🕑 Attendance Management
- **Quick Punch:**  
  - Duty In → ek click me current time capture.  
  - Duty Out → end time capture + worked hours auto-calc.  
- **Manual Entry:**  
  - Duty In / Out manually set karne ka option (agar punch bhool gaye).  

### ⏱ Overtime (OT)
- Automatic OT calculation.  
- OT hours = Worked hours – 8.5 (agar extra kaam).  
- OT pay = OT hours × per-hour rate.

### 🌴 Leave Management
- Yearly quota set kar sakte ho (SL, PL, CL).  
- Leave apply karne par absent ke bajaye leave bucket use hoga.  
- Paid leave = salary deduction nahi, unpaid leave = deduction.

### 💰 Salary Calculation
- Salary aap settings me set/update kar sakte ho.  
- System auto-calc karega:  
  - Present days × per-day rate  
  - Half-day = 50% rate  
  - Absent = full deduction  
  - OT = per-hour × OT hours  
  - **Final Net Salary** = Salary – Deductions + OT  

### 📊 Dashboard
- Attendance summary: Present / Absent / Half-day.  
- Overtime summary.  
- Current month net payable salary.  
- Leave balance (SL/PL/CL).

### 📑 Reports
- **Monthly Excel Report**: day-wise log (date, in, out, worked hours, OT, status).  
- **Yearly Excel Summary**: total salary, OT, leave usage.  

---

## 🛠 Tech Stack
- **Frontend:** HTML, CSS, JavaScript (mobile-first, glassmorphism UI).  
- **Backend & Auth:** Firebase Auth + Firestore.  
- **Reports:** SheetJS for Excel download.  
- **Hosting:** GitHub Pages (free).  
- **PWA:** Manifest + Service Worker for Add-to-Home-Screen & offline support.

---

## 📲 Installation & Setup
1. Clone this repo:
   ```bash
   git clone https://github.com/your-username/routinely.git
   cd routinely