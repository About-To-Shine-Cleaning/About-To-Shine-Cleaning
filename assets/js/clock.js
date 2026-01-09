// 👷 Employees
const employees = {
  E01: "Matthew Bari",
  E02: "Employee Two",
  E03: "Employee Three",
  E04: "Employee Four",
  E05: "Employee Five",
  E06: "Employee Six",
  E07: "Employee Seven",
  E08: "Employee Eight",
  E09: "Employee Nine",
  E10: "Employee Ten"
};

// 🔗 Google Apps Script Web App URL (TEMP PLACEHOLDER)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyXZ5teAObHjeSHCe8E8zG6ZsYjS8wlhU-ps7AJkVEIqL3cAe5lZ6l_VeT_Oy9nqZbSiQ/execmf7JvwqK3F9_1ELQ8pUhFDZBdndSEi67JJMbU1JMKqQ/exec";

// 🔎 Get employee from URL
const params = new URLSearchParams(window.location.search);
const employeeId = params.get("emp");
const employeeName = employees[employeeId];

const display = document.getElementById("employee-display");

if (!employeeName) {
  display.innerText = "Unauthorized Access";
  throw new Error("Invalid employee");
}

display.innerText = `Welcome, ${employeeName}`;

// 🧠 Restore break state
let onBreak = sessionStorage.getItem("onBreak") === "true";

// 📍 GPS helper
function getLocation(callback) {
  if (!navigator.geolocation) {
    callback(null, true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => callback(pos.coords, false),
    () => callback(null, true),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// 📝 Log action
function logEvent(action) {
  getLocation((coords, gpsDenied) => {
    fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        employeeName,
        action,
        latitude: coords?.latitude || "",
        longitude: coords?.longitude || "",
        accuracy: coords?.accuracy || "",
        gpsDenied,
        timestamp: new Date().toISOString()
      })
    });
  });
}

// ⏱ Actions
function clockIn() {
  onBreak = false;
  sessionStorage.setItem("onBreak", "false");
  logEvent("Clock In");
  alert("Clocked In");
}

function startBreak() {
  if (onBreak) return;
  onBreak = true;
  sessionStorage.setItem("onBreak", "true");
  logEvent("Break Start");
  alert("Break Started");
}

function endBreak() {
  if (!onBreak) return;
  onBreak = false;
  sessionStorage.setItem("onBreak", "false");
  logEvent("Break End");
  alert("Break Ended");
}

function clockOut() {
  if (onBreak) {
    logEvent("Break End");
    onBreak = false;
    sessionStorage.setItem("onBreak", "false");
  }

  logEvent("Clock Out");
  alert("Clocked Out");
}
