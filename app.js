// === Theme Toggle ===
const toggle = document.getElementById("toggle-theme");
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  toggle.checked = true;
}
toggle.addEventListener("change", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
});

// === Quick Punch ===
const dutyInBtn = document.getElementById("duty-in");
const dutyOutBtn = document.getElementById("duty-out");
const punchStatus = document.getElementById("punch-status");

let dutyStart = null;
let otRate = 100; // per hour OT rate
let workedHours = 0;

dutyInBtn.addEventListener("click", () => {
  dutyStart = new Date();
  punchStatus.innerText = `Duty started at ${dutyStart.toLocaleTimeString()}`;
});

dutyOutBtn.addEventListener("click", () => {
  if (!dutyStart) {
    punchStatus.innerText = "You must punch in first!";
    return;
  }
  let dutyEnd = new Date();
  let diff = (dutyEnd - dutyStart) / (1000 * 60 * 60); // hours
  workedHours = diff.toFixed(2);
  punchStatus.innerText = `Duty ended at ${dutyEnd.toLocaleTimeString()} (Worked: ${workedHours} hrs)`;

  // Auto OT calc
  if (workedHours > 8.5) {
    let ot = workedHours - 8.5;
    otHours += ot;
  }
  dutyStart = null;
  updateSummary();
});

// === Attendance Calendar ===
const calendarGrid = document.getElementById("calendar-grid");
const daysInMonth = 30; // fixed for now
let attendance = Array(daysInMonth).fill("duty"); // default all duty

function renderCalendar() {
  calendarGrid.innerHTML = "";
  attendance.forEach((status, i) => {
    const day = document.createElement("div");
    day.classList.add("calendar-day", status);
    day.innerText = i + 1;
    day.title = `Day ${i + 1}: ${status}`;
    day.addEventListener("click", () => cycleStatus(i));
    calendarGrid.appendChild(day);
  });
}

function cycleStatus(index) {
  const states = ["duty", "leave", "half", "weekoff"];
  let current = states.indexOf(attendance[index]);
  attendance[index] = states[(current + 1) % states.length];
  renderCalendar();
  updateSummary();
}

renderCalendar();

// === Notes System ===
const addNoteBtn = document.getElementById("add-note");
const noteInput = document.getElementById("note-input");
const notesList = document.getElementById("notes-list");

addNoteBtn.addEventListener("click", () => {
  if (noteInput.value.trim() !== "") {
    let li = document.createElement("li");
    li.innerText = noteInput.value;
    notesList.appendChild(li);
    noteInput.value = "";
  }
});

// === Salary Summary ===
const dutySpan = document.getElementById("duty-days");
const leaveSpan = document.getElementById("leave-days");
const otSpan = document.getElementById("ot-hours");
const salarySpan = document.getElementById("calculated-salary");

let baseSalary = 26000; // Example default
let perDay = baseSalary / 26;
let otHours = 0;

function updateSummary() {
  let duty = attendance.filter((s) => s === "duty").length;
  let leave = attendance.filter((s) => s === "leave").length;
  let half = attendance.filter((s) => s === "half").length * 0.5;
  let weekoff = attendance.filter((s) => s === "weekoff").length;

  let totalDuty = duty + half;
  let salary = totalDuty * perDay;

  // Add overtime pay
  salary += otHours * otRate;

  dutySpan.innerText = totalDuty;
  leaveSpan.innerText = leave;
  otSpan.innerText = otHours.toFixed(1);
  salarySpan.innerText = Math.round(salary);
}

updateSummary();
