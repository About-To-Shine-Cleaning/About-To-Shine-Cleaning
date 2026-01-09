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

// 🔗 Google Apps Script Web App URL (REPLACE THIS)
const SHEET_URL = "https://script.google.com/macros/s/16Fx2ZYhyRQq6LsG05LqRpTOJ8iz9A64PVURtmeZXsLA/edit?gid/exec";

const params = new URLSearchParams(window.location.search);
const employeeId = params.get('emp');
const employeeName = employees[employeeId];

if (!employeeName) {
  document.getElementById('employee-display').innerText = "Unauthorized Access";
  throw new Error("Invalid employee");
}

document.getElementById('employee-display').innerText =
  `Welcome, ${employeeName}`;

let onBreak = false;

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

function clockIn() {
  onBreak = false;
  logEvent("Clock In");
  alert("Clocked In");
}

function startBreak() {
  onBreak = true;
  logEvent("Break Start");
  alert("Break Started");
}

function clockOut() {
  if (onBreak) {
    logEvent("Break End");
    onBreak = false;
  }
  logEvent("Clock Out");
  alert("Clocked Out");
}
