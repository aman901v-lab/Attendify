// =========================
// THEME TOGGLE SYSTEM
// =========================
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

// =========================
// ATTENDANCE CALENDAR
// =========================
const calendarGrid = document.getElementById("calendar-grid");
const daysInMonth = 30;

// Load attendance from storage
let attendance = JSON.parse(localStorage.getItem("attendance")) || Array(daysInMonth).fill("duty");

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
  localStorage.setItem("attendance", JSON.stringify(attendance));
  renderCalendar();
  updateSummary();
}

renderCalendar();

// =========================
// NOTES SYSTEM
// =========================
const addNoteBtn = document.getElementById("add-note");
const noteInput = document.getElementById("note-input");
const notesList = document.getElementById("notes-list");

// Load saved notes
let savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
savedNotes.forEach(note => {
  let li = document.createElement("li");
  li.innerText = note;
  notesList.appendChild(li);
});

addNoteBtn.addEventListener("click", () => {
  if (noteInput.value.trim() !== "") {
    let li = document.createElement("li");
    li.innerText = noteInput.value;
    notesList.appendChild(li);

    savedNotes.push(noteInput.value);
    localStorage.setItem("notes", JSON.stringify(savedNotes));

    noteInput.value = "";
  }
});

// =========================
// SALARY SUMMARY
// =========================
const dutySpan = document.getElementById("duty-days");
const leaveSpan = document.getElementById("leave-days");
const otSpan = document.getElementById("ot-hours");
const salarySpan = document.getElementById("calculated-salary");

let baseSalary = 26000; // Example
let perDay = baseSalary / 26;
let otRate = 100; // per hour

function updateSummary() {
  let duty = attendance.filter((s) => s === "duty").length;
  let leave = attendance.filter((s) => s === "leave").length;
  let half = attendance.filter((s) => s === "half").length * 0.5;

  let totalDuty = duty + half;
  let salary = totalDuty * perDay;

  // OT hours ko localStorage me bhi save karna
  let ot = JSON.parse(localStorage.getItem("otHours")) || 0;
  salary += ot * otRate;

  dutySpan.innerText = totalDuty;
  leaveSpan.innerText = leave;
  otSpan.innerText = ot;
  salarySpan.innerText = salary.toFixed(0);
}

updateSummary();

// =========================
// QUICK PUNCH SYSTEM
// =========================
const dutyInBtn = document.getElementById("duty-in");
const dutyOutBtn = document.getElementById("duty-out");
const punchStatus = document.getElementById("punch-status");

dutyInBtn.addEventListener("click", () => {
  let time = new Date().toLocaleTimeString();
  punchStatus.innerText = `✅ Duty In at ${time}`;
  localStorage.setItem("lastPunch", `In: ${time}`);
});

dutyOutBtn.addEventListener("click", () => {
  let time = new Date().toLocaleTimeString();
  punchStatus.innerText = `❌ Duty Out at ${time}`;
  localStorage.setItem("lastPunch", `Out: ${time}`);

  // Random OT add for demo
  let ot = JSON.parse(localStorage.getItem("otHours")) || 0;
  ot += Math.floor(Math.random() * 3); // 0-2 hrs
  localStorage.setItem("otHours", ot);
  updateSummary();
});

// Restore last punch
if (localStorage.getItem("lastPunch")) {
  punchStatus.innerText = localStorage.getItem("lastPunch");
}
