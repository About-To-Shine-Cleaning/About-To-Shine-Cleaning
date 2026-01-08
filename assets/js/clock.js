// 👷 EMPLOYEES (linked via NFC URL)
const employees = {
  "E01": { name: "Employee One" },
  "E02": { name: "Employee Two" },
  "E03": { name: "Employee Three" }
};

// 🔗 Google Apps Script URL
const SHEET_URL = "https://docs.google.com/spreadsheets/d/16Fx2ZYhyRQq6LsG05LqRpTOJ8iz9A64PVURtmeZXsLA/edit?gid=0#gid=0";

let breakActive = false;

// 🔎 Get employee from URL
const params = new URLSearchParams(window.location.search);
const empId = params.get("emp");
const employee = employees[empId];

const status = document.getElementById("status");
const nameDisplay = document.getElementById("employeeName");

if (!employee) {
  nameDisplay.textContent = "Unauthorized Access";
  throw new Error("Invalid employee");
}

nameDisplay.textContent = employee.name;

function logAction(action) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      // Auto-end break if clocking out
      if (action === "Clock Out" && breakActive) {
        sendLog("Break End", pos.coords, false);
        breakActive = false;
      }

      if (action === "Break Start") breakActive = true;
      if (action === "Break End") breakActive = false;

      sendLog(action, pos.coords, false);
      status.textContent = `${action} recorded`;
      status.style.color = "green";
    },
    err => {
      // GPS denied but still log
      sendLog(action, null, true);
      status.textContent = "GPS denied — action logged";
      status.style.color = "orange";
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function sendLog(action, coords, gpsDenied) {
  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      employee: employee.name,
      employeeId: empId,
      action,
      latitude: coords?.latitude || "",
      longitude: coords?.longitude || "",
      accuracy: coords?.accuracy || "",
      gpsDenied
    })
  });
}
