const params = new URLSearchParams(window.location.search);
const employeeId = params.get('emp') || 'Unknown';

document.getElementById('employee-display').innerText =
  `Employee ID: ${employeeId}`;

let onBreak = false;

function getLocation(callback) {
  if (!navigator.geolocation) {
    callback(null, 'denied');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      callback(
        `${pos.coords.latitude},${pos.coords.longitude}`,
        'allowed'
      );
    },
    () => callback(null, 'denied')
  );
}

function logEvent(type) {
  getLocation((gps, gpsStatus) => {
    fetch('https://script.google.com/macros/s/"https://docs.google.com/spreadsheets/d/16Fx2ZYhyRQq6LsG05LqRpTOJ8iz9A64PVURtmeZXsLA/edit?gid=0#gid=0"/exec' , {
      method: 'POST',
      body: JSON.stringify({
        employee: employeeId,
        action: type,
        gps: gps,
        gpsStatus: gpsStatus,
        timestamp: new Date().toISOString()
      })
    });
  });
}

function clockIn() {
  onBreak = false;
  logEvent('Clock In');
  alert('Clocked In');
}

function startBreak() {
  onBreak = true;
  logEvent('Break Start');
  alert('Break Started');
}

function endBreak() {
  onBreak = true;
  logEvent('End Start');
  alert('End Started');
}
function clockOut() {
  if (onBreak) {
    logEvent('Break End');
    onBreak = false;
  }
  logEvent('Clock Out');
  alert('Clocked Out');
}
