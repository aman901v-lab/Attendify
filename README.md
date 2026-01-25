Attendify 🚀

Attendify is a modern Attendance, Leave, and Salary Management Progressive Web App (PWA) designed for individuals and small teams who want precise attendance tracking with accurate salary and overtime calculations.

The app follows real-world Indian payroll logic (26 working days, fixed lunch break, overtime rules) and works both online and offline.

---

✨ Key Features

📅 Attendance Management

26 working days per month (fixed)
One-click Duty In / Duty Out
Manual time entry using time picker
Fixed lunch break: 30 minutes (0.5 hr)
Daily duty standard: 8 hours
Overtime auto-calculated after standard hours

Attendance Status Options:

Duty

Leave (SL / PL / CL)
Half-Day
Weekly Off
Holiday
Notes per day

---

🏖 Leave Management

Leave types: SL, PL, CL
User-defined yearly leave quota
Automatic leave balance deduction
Paid leave does not reduce salary
Unpaid leave reduces salary automatically

---

💰 Salary & OT Calculation

Salary calculation is fully automatic and rule-based.

Rules:

Absent = full day salary deduction
Half-day = 50% salary deduction
Overtime = per-hour OT rate × OT hours

Salary Formula Logic

1. Total Time = Out Time − In Time
2. Worked Hours = Total Time − 0.5 hr (lunch)
3. OT Hours = Worked Hours − 8 (if > 8, else 0)
4. Daily Salary = Monthly Salary ÷ 26
5. Per-Hour Salary = Daily Salary ÷ 8
6. Daily Earnings = Worked Hours × Per-Hour Salary
7. OT Earnings = OT Hours × OT Rate
8. Monthly Salary = Base Salary + Total OT Earnings

---

📊 Dashboard

Present days
Absent days
Half-days
OT hours
Paid leaves used
Remaining leave balance
Monthly salary preview
Quick punch buttons
Notes section
Color-coded monthly calendar

---

📑 Reports

📥 Monthly Excel report

Daily In/Out time
Worked hours
OT hours
Attendance status
Notes
Salary breakdown


📥 Yearly Excel summary

Month-wise attendance & salary

---

🔐 Authentication

Users can later log in using Username/Password given by admin.

---

🎨 UI / UX

Neon blue premium theme
Glassmorphism cards
Smooth animations
Dark Mode & Light Mode
Fully responsive (mobile-first)

---

📱 Progressive Web App (PWA)

Installable on mobile & desktop
Add to Home Screen
Works offline
Service Worker enabled
App-like experience

---

🛠 Setup Instructions

1. Clone the repository
2. Configure Firebase credentials
3. Enable Authentication providers in Firebase
4. Deploy to GitHub Pages
5. Install as PWA from browser

---

📌 Future Enhancements

Multi-user support
Admin panel
Export to PDF
Cloud backup
Company payroll mode

---

👨‍💻 Author

Aman Verma
emai: aman901v@hotmail.com
Built with precision, logic, and real-world payroll needs in mind.
