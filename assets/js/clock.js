const JOBS_URL = "https://script.google.com/macros/s/AKfycbzlhM_-bpMUBEqYxMk4FyIyRmNmKh846QxME5zpnaYSo4PBBbCDb48pvXfgzkdoYN8qDg/exec";

let selectedJob = null;
const jobSelect = document.getElementById("jobSelect");

fetch(SHEET_URL)
  .then(res => res.json())
  .then(jobs => {
    jobs.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.name} ($${job.pay})`;
      opt.dataset.pay = job.pay;
      opt.dataset.name = job.name;
      jobSelect.appendChild(opt);
    });
  })
  .catch(err => console.error("Job load failed", err));

// Load jobs dynamically
fetch(JOBS_URL)
  .then(res => res.json())
  .then(jobs => {
    const select = document.getElementById("jobSelect");

    jobs.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.name} ($${job.pay})`;
      opt.dataset.pay = job.pay;
      opt.dataset.name = job.name;
      select.appendChild(opt);
    });
  });

document.getElementById("jobSelect").addEventListener("change", e => {
  const opt = e.target.selectedOptions[0];

  selectedJob = opt.value
    ? {
        id: opt.value,
        name: opt.dataset.name,
        pay: Number(opt.dataset.pay)
      }
    : null;
});

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

// 🔗 Google Apps Script Web App URL
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbzlhM_-bpMUBEqYxMk4FyIyRmNmKh846QxME5zpnaYSo4PBBbCDb48pvXfgzkdoYN8qDg/exec";

// 🔎 Read employee from URL
const params = new URLSearchParams(window.location.search);
const employeeId = params.get("emp");
const employeeName = employees[employeeId];

const display = document.getElementById("employee-display");

if (!employeeName) {
  display.textContent = "Unauthorized Access";
  throw new Error("Invalid employee ID");
}

display.textContent = `Welcome, ${employeeName}`;

// 🧠 Break state
let onBreak = sessionStorage.getItem("onBreak") === "true";

// 📍 Location helper
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

// 📝 Log event
function logEvent(action) {
  getLocation((coords, gpsDenied) => {
    fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        employeeName,
        action,
        jobId: selectedJob?.id || "",
        jobName: selectedJob?.name || "",
        jobPay: selectedJob?.pay || "",
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
