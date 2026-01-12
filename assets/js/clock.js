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
// DOM
// ==============================
const display = document.getElementById("employee-display");
const statusEl = document.getElementById("clock-status");
const jobSelect = document.getElementById("jobSelect");
const notesEl = document.getElementById("jobNotes");

const btnClockIn = document.getElementById("btnClockIn");
const btnBreakStart = document.getElementById("btnBreakStart");
const btnBreakEnd = document.getElementById("btnBreakEnd");
const btnClockOut = document.getElementById("btnClockOut");

// ==============================
// Employee from URL
// ==============================
const params = new URLSearchParams(window.location.search);
const employeeId = params.get("emp");
const employeeName = employees[employeeId];

if (!employeeName) {
  display.textContent = "Unauthorized Access";
  throw new Error("Invalid employee ID");
}
display.textContent = `Welcome, ${employeeName}`;

// ==============================
// State (persisted)
// ==============================
let onBreak = sessionStorage.getItem("onBreak") === "true";
let isClockedIn = sessionStorage.getItem("isClockedIn") === "true";
let selectedJob = null;

// Remember last job selection per employee
const lastJobKey = `lastJob_${employeeId}`;

// ==============================
// UI helpers
// ==============================
function setStatus(msg, kind = "info") {
  // kind: info | ok | warn | err
  const styles = {
    info: "background:#fff;border:1px solid rgba(0,0,0,0.15);padding:10px 12px;border-radius:10px;",
    ok: "background:#eaffea;border:1px solid rgba(0,0,0,0.15);padding:10px 12px;border-radius:10px;",
    warn: "background:#fff7db;border:1px solid rgba(0,0,0,0.15);padding:10px 12px;border-radius:10px;",
    err: "background:#ffeaea;border:1px solid rgba(0,0,0,0.15);padding:10px 12px;border-radius:10px;"
  };
  statusEl.setAttribute("style", styles[kind] + "margin:12px 0;");
  statusEl.textContent = msg;
}

function updateButtons() {
  // Must pick a job to clock in (and we also enforce job picked to break/clock out)
  const hasJob = !!selectedJob;

  // Prevent double clock-in
  btnClockIn.disabled = isClockedIn || !hasJob;

  // Break buttons only when clocked in
  btnBreakStart.disabled = !isClockedIn || onBreak || !hasJob;
  btnBreakEnd.disabled = !isClockedIn || !onBreak || !hasJob;

  // Clock out only when clocked in
  btnClockOut.disabled = !isClockedIn || !hasJob;

  // Notes only when clocked in (optional)
  notesEl.disabled = !isClockedIn;
}

// ==============================
// Job dropdown
// ==============================
jobSelect.addEventListener("change", (e) => {
  const opt = e.target.selectedOptions[0];
  if (opt && opt.value) {
    selectedJob = {
      id: opt.value,
      name: opt.dataset.name || "",
      pay: Number(opt.dataset.pay || 0)
    };
    sessionStorage.setItem(lastJobKey, selectedJob.id);
    setStatus(`Selected: ${selectedJob.name}`, "info");
  } else {
    selectedJob = null;
    sessionStorage.removeItem(lastJobKey);
    setStatus("Please select a job to continue.", "warn");
  }
  updateButtons();
});

// Load jobs
fetch(JOBS_URL)
  .then(res => res.json())
  .then(jobs => {
    // Populate dropdown (NO pay shown)
    jobs.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.name}`; // ✅ pay hidden in dropdown
      opt.dataset.name = job.name;
      opt.dataset.pay = job.pay; // ✅ still stored for logging/payroll
      jobSelect.appendChild(opt);
    });

    // Restore last job selection if it exists
    const lastJobId = sessionStorage.getItem(lastJobKey);
    if (lastJobId) {
      jobSelect.value = lastJobId;
      const opt = jobSelect.selectedOptions[0];
      if (opt && opt.value) {
        selectedJob = {
          id: opt.value,
          name: opt.dataset.name || "",
          pay: Number(opt.dataset.pay || 0)
        };
      }
    }

    // Initial status
    if (!selectedJob) {
      setStatus("Select the current job to enable clock actions.", "info");
    } else {
      setStatus(`Selected: ${selectedJob.name}`, "info");
    }

    updateButtons();
  })
  .catch(err => {
    console.error("Job load failed", err);
    setStatus("Jobs failed to load. Check Apps Script deployment /exec output.", "err");
    updateButtons();
  });

// ==============================
// GPS helper
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
// POST helper (form + no-cors)
// ==============================
function postLog(payload) {
  const formBody = new URLSearchParams();
  formBody.append("payload", JSON.stringify(payload));

  fetch(SHEET_URL, {
    method: "POST",
    body: formBody,
    mode: "no-cors"
  }).catch(err => console.error("POST failed:", err));
}

// ==============================
// Log event
// ==============================
function logEvent(action) {
  getLocation((coords, gpsDenied) => {
    const payload = {
      employeeId,
      employeeName,
      action,
      jobId: selectedJob?.id || "",
      jobName: selectedJob?.name || "",
      jobPay: selectedJob?.pay || "",
      notes: "", // default
      latitude: coords?.latitude || "",
      longitude: coords?.longitude || "",
      accuracy: coords?.accuracy || "",
      gpsDenied,
      timestamp: new Date().toISOString()
    };

    // Only attach notes on Clock Out (tweak #7)
    if (action === "Clock Out") {
      payload.notes = (notesEl.value || "").trim();
    }

    postLog(payload);
  });
}

// ==============================
// Actions
// ==============================
function clockIn() {
  if (!selectedJob) {
    setStatus("Please select a job before clocking in.", "warn");
    return;
  }
  if (isClockedIn) {
    setStatus("You are already clocked in.", "warn");
    return;
  }

  onBreak = false;
  isClockedIn = true;
  sessionStorage.setItem("onBreak", "false");
  sessionStorage.setItem("isClockedIn", "true");

  logEvent("Clock In");
  setStatus(`Clocked In ✅ (${selectedJob.name})`, "ok");
  updateButtons();
}

function startBreak() {
  if (!selectedJob) {
    setStatus("Select a job before starting break.", "warn");
    return;
  }
  if (!isClockedIn) {
    setStatus("You must Clock In before starting break.", "warn");
    return;
  }
  if (onBreak) {
    setStatus("Break is already active.", "warn");
    return;
  }

  onBreak = true;
  sessionStorage.setItem("onBreak", "true");

  logEvent("Break Start");
  setStatus("Break Started 🟡", "ok");
  updateButtons();
}

function endBreak() {
  if (!selectedJob) {
    setStatus("Select a job before ending break.", "warn");
    return;
  }
  if (!isClockedIn) {
    setStatus("You must Clock In before ending break.", "warn");
    return;
  }
  if (!onBreak) {
    setStatus("No active break to end.", "warn");
    return;
  }

  onBreak = false;
  sessionStorage.setItem("onBreak", "false");

  logEvent("Break End");
  setStatus("Break Ended ✅", "ok");
  updateButtons();
}

function clockOut() {
  if (!selectedJob) {
    setStatus("Please select a job before clocking out.", "warn");
    return;
  }
  if (!isClockedIn) {
    setStatus("You are not clocked in.", "warn");
    return;
  }

  // Auto-end break on clock out
  if (onBreak) {
    logEvent("Break End");
    onBreak = false;
    sessionStorage.setItem("onBreak", "false");
  }

  logEvent("Clock Out");

  // Reset state
  isClockedIn = false;
  sessionStorage.setItem("isClockedIn", "false");

  setStatus("Clocked Out ✅ (Notes saved if entered)", "ok");

  // Clear notes after clock out (optional)
  notesEl.value = "";

  updateButtons();
}
