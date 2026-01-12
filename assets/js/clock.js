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
// 🔗 Google Apps Script Web App URL
// ==============================
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbx6SOLdLGz7Ttc9y1NF3NAvoB3bL4J63Dg03cjc5zQlGCjthizA_a5p-xcjs_-cuZcXgw/exec";

const JOBS_URL = SHEET_URL;

// ==============================
// 🔎 Read employee from URL
// ==============================
const params = new URLSearchParams(window.location.search);
const employeeId = params.get("emp");
const employeeName = employees[employeeId];

const display = document.getElementById("employee-display");
const jobSelect = document.getElementById("jobSelect");

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
// 📋 Job Dropdown (load + selection)
// ==============================
jobSelect.addEventListener("change", (e) => {
  const opt = e.target.selectedOptions[0];
  if (opt && opt.value) {
    selectedJob = {
      id: opt.value,
      name: opt.dataset.name || "",
      pay: Number(opt.dataset.pay || 0)
    };
  } else {
    selectedJob = null;
  }
});

fetch(JOBS_URL)
  .then(res => res.json())
  .then(jobs => {
    // Keep the first placeholder option, then add jobs
    jobs.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.name} ($${job.pay})`;
      opt.dataset.name = job.name;
      opt.dataset.pay = job.pay;
      jobSelect.appendChild(opt);
    });

    // Helpful debug
    console.log("Loaded jobs:", jobs);
  })
  .catch(err => {
    console.error("Job load failed", err);
    alert("Jobs failed to load. Check Apps Script /exec output.");
  });

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
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids some preflight headaches
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
    })
    .then(r => r.text())
    .then(t => console.log("POST result:", t))
    .catch(err => console.error("POST failed:", err));
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
