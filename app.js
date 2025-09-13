// ----------------------
// Theme Toggle
// ----------------------
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

// ----------------------
// Attendance Calendar
// ----------------------
const calendarGrid = document.getElementById("calendar-grid");
const daysInMonth = 30;

// LocalStorage se attendance load karo
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

  // Save to LocalStorage
  localStorage.setItem("attendance", JSON.stringify(attendance));

  renderCalendar();
  updateSummary();
}

renderCalendar();

// ----------------------
// Notes System
// ----------------------
const addNoteBtn = document.getElementById("add-note");
const noteInput = document.getElementById("note-input");
const notesList = document.getElementById("notes-list");

// LocalStorage se notes load karo
let notes = JSON.parse(localStorage.getItem("notes")) || [];

function renderNotes() {
  notesList.innerHTML = "";
  notes.forEach((note, i) => {
    let li = document.createElement("li");
    li.innerText = note;

    // Delete button
    let delBtn = document.createElement("button");
    delBtn.innerText = "❌";
    delBtn.style.marginLeft = "10px";
    delBtn.onclick = () => {
      notes.splice(i, 1);
      localStorage.setItem("notes", JSON.stringify(notes));
      renderNotes();
    };

    li.appendChild(delBtn);
    notesList.appendChild(li);
  });
}
renderNotes();

addNoteBtn.addEventListener("click", () => {
  if (noteInput.value.trim() !== "") {
    notes.push(noteInput.value.trim());
    localStorage.setItem("notes", JSON.stringify(notes));
    renderNotes();
    noteInput.value = "";
  }
});

// ----------------------
// Salary Summary
// ----------------------
const dutySpan = document.getElementById("duty-days");
const leaveSpan = document.getElementById("leave-days");
const otSpan = document.getElementById("ot-hours");
const salarySpan = document.getElementById("calculated-salary");

let baseSalary = 26000; // Example salary
let perDay = baseSalary / 26;
let otRate = 100; // per hour

function updateSummary() {
  let duty = attendance.filter((s) => s === "duty").length;
  let leave = attendance.filter((s) => s === "leave").length;
  let half = attendance.filter((s) => s === "half").length * 0.5;
  let weekoff = attendance.filter((s) => s === "weekoff").length;

  let totalDuty = duty + half;
  let salary = totalDuty * perDay;

  // OT random na ho, user ke liye save rahe
  let ot = JSON.parse(localStorage.getItem("otHours")) || 0;

  salary += ot * otRate;

  dutySpan.innerText = totalDuty;
  leaveSpan.innerText = leave;
  otSpan.innerText = ot;
  salarySpan.innerText = Math.round(salary);
}

// Demo ke liye OT set karna
if (!localStorage.getItem("otHours")) {
  let randomOT = Math.floor(Math.random() * 20);
  localStorage.setItem("otHours", randomOT);
}
updateSummary();
