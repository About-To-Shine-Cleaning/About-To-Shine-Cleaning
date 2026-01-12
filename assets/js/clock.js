// ==============================
// 👷 Employees
// ==============================
const employees = {
  E01: "Shannon Kovecses",
  E02: "Shauna Bari",
  E03: "Caprea Kovecses",
  E04: "Matthew Bari",
  E05: "Employee Five",
  E06: "Employee Six",
  E07: "Employee Seven",
  E08: "Employee Eight",
  E09: "Employee Nine",
  E10: "Employee Ten"
};

// ==============================
// 🔗 Google Apps Script URLs
// ==============================
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbx6SOLdLGz7Ttc9y1NF3NAvoB3bL4J63Dg03cjc5zQlGCjthizA_a5p-xcjs_-cuZcXgw/exec";

// (same endpoint returns jobs via GET)
const JOBS_URL = SHEET_URL;

// ==============================
// 🔎 Read employee from URL
// ==============================
const params = new URLSearchParams(window.location.search);
const employeeId = params.get("emp");
const employeeName = employees[employeeId];

const display = document.getElementById("employee-display");

if (!employeeName) {
  display.textContent = "Unauthorized Access";
  throw new Error("Invalid employee ID");
}

display.textContent = `Welcome, ${employeeName}`;

// ==============================
// 🧠 State
// ==============================
let onBreak = sessionStorage.getItem("onBreak") === "true";
let selectedJob = null;

// ==============================
// 📋 Job Dropdown
// ==============================
const jobSelect = document.getElementById("jobSelect");

fetch(JOBS_URL)
  .then(res => res.json())
  .then(jobs => {
    jobs.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.name} ($${job.pay})`;
      opt.dataset.name = job.name;
      opt.dataset.pay = job.pay;
      jobSelect.appendChild(opt);
    });
    
    // After populating the jobSelect dropdown
jobSelect.addEventListener("change", (e) => {
  const selectedOption = e.target.selectedOptions[0];
  if (selectedOption && selectedOption.value) {
    selectedJob = {
      id: selectedOption.value,
      name: selectedOption.dataset.name,
      pay: selectedOption.dataset.pay
    };
  } else {
    selectedJob = null;
  }
});

  })
  .catch(err => console.error("Job load failed", err));


// ==============================
// 📍 GPS Helper
// ==============================
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

// ==============================
// 📝 Log Event
// ==============================
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

// ==============================
// ⏱ Actions
// ==============================
function clockIn() {
  if (!selectedJob) {
    alert("Please select a job before clocking in");
    return;
  }

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
