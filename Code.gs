/** Rohan's Staff Movement — Google Sheets + Apps Script
 * Create this project from Extensions > Apps Script in the bound spreadsheet.
 * Run setupStaffMovement() once, then deploy as a Web app.
 */
const CONFIG = {
  SHEETS: {
    STAFF: 'Staff',
    LOCATIONS: 'Locations',
    LOG: 'Movement Log'
  },
  HEADERS: {
    STAFF: ['Staff Name', 'Email', 'Active'],
    LOCATIONS: ['Destination', 'Active'],
    LOG: ['Record ID', 'Staff Name', 'Email', 'Action', 'Destination', 'Reason', 'Notes', 'Expected Return', 'Time Out', 'Time In', 'Duration (minutes)', 'Status']
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Staff Movement")
    .addItem("Set up / repair sheets", "setupStaffMovement")
    .addItem("Open web app instructions", "showDeploymentHelp")
    .addToUi();
}

/** Run once from the spreadsheet-bound Apps Script editor. */
function setupStaffMovement() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open Apps Script from the Google Sheet using Extensions > Apps Script.');

  const staff = getOrCreateSheet_(ss, CONFIG.SHEETS.STAFF, CONFIG.HEADERS.STAFF);
  const locations = getOrCreateSheet_(ss, CONFIG.SHEETS.LOCATIONS, CONFIG.HEADERS.LOCATIONS);
  const log = getOrCreateSheet_(ss, CONFIG.SHEETS.LOG, CONFIG.HEADERS.LOG);

  if (staff.getLastRow() < 2) {
    staff.getRange(2, 1, 1, 3).setValues([['Example Staff Member', '', true]]);
    staff.getRange(2, 1, 1, 3).setFontColor('#999999');
  }
  if (locations.getLastRow() < 2) {
    locations.getRange(2, 1, 7, 2).setValues([
      ['Staff Room', true], ['Classroom', true], ['Office', true],
      ['Playground', true], ['School Grounds', true], ['Off Site', true], ['Other', true]
    ]);
  }

  [staff, locations, log].forEach(sh => {
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setBackground('#F28C28')
      .setFontColor('#FFFFFF').setFontWeight('bold');
    sh.autoResizeColumns(1, sh.getLastColumn());
  });
  staff.getRange('C2:C').insertCheckboxes();
  locations.getRange('B2:B').insertCheckboxes();
  log.getRange('H:H').setNumberFormat('dd mmm yyyy hh:mm');
  log.getRange('I:J').setNumberFormat('dd mmm yyyy hh:mm');
  log.getRange('K:K').setNumberFormat('0');
  PropertiesService.getScriptProperties().setProperty('STAFF_MOVEMENT_SHEET_ID', ss.getId());

  SpreadsheetApp.getUi().alert(
    'Setup complete',
    'Add your real staff names on the Staff tab and remove the grey example row. Edit destinations on the Locations tab. Then deploy the Apps Script as a web app.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function showDeploymentHelp() {
  SpreadsheetApp.getUi().alert(
    'Deploy the staff movement app',
    'In Apps Script choose Deploy > New deployment > Web app. Execute as: Me. Who has access: your school Google Workspace users (recommended). Deploy, authorise, then share the web app URL with staff.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle("Staff Movement | Rohan's Staff Hub")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getAppData() {
  const ss = getSpreadsheet_();
  const staffRows = readRows_(ss.getSheetByName(CONFIG.SHEETS.STAFF));
  const locationRows = readRows_(ss.getSheetByName(CONFIG.SHEETS.LOCATIONS));
  const logRows = readRows_(ss.getSheetByName(CONFIG.SHEETS.LOG));

  const staff = staffRows
    .filter(r => r[0] && isActive_(r[2]))
    .map(r => ({ name: String(r[0]).trim(), email: String(r[1] || '').trim() }))
    .sort((a,b) => a.name.localeCompare(b.name));

  const locations = locationRows
    .filter(r => r[0] && isActive_(r[1]))
    .map(r => String(r[0]).trim());

  const out = logRows
    .filter(r => String(r[11] || '').toLowerCase() === 'out')
    .map(r => ({
      id: String(r[0]),
      name: String(r[1] || ''),
      email: String(r[2] || ''),
      destination: String(r[4] || ''),
      reason: String(r[5] || ''),
      notes: String(r[6] || ''),
      expectedReturn: r[7] ? new Date(r[7]).toISOString() : '',
      timeOut: r[8] ? new Date(r[8]).toISOString() : '',
      minutesOut: r[8] ? Math.max(0, Math.floor((Date.now() - new Date(r[8]).getTime()) / 60000)) : 0
    }))
    .sort((a,b) => (a.timeOut || '').localeCompare(b.timeOut || ''));

  return {
    staff,
    locations,
    out,
    totals: { staff: staff.length, out: out.length, onSite: Math.max(0, staff.length - out.length) },
    updatedAt: new Date().toISOString()
  };
}

/** Record a member of staff leaving their current location. */
function signOut(payload) {
  payload = payload || {};
  const name = clean_(payload.name, 120);
  const destination = clean_(payload.destination, 120);
  const reason = clean_(payload.reason, 160);
  const notes = clean_(payload.notes, 500);
  const expectedReturn = payload.expectedReturn ? new Date(payload.expectedReturn) : null;
  if (!name || !destination || !reason) throw new Error('Choose your name, destination and reason.');
  if (expectedReturn && isNaN(expectedReturn.getTime())) throw new Error('The expected return time is not valid.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = getSpreadsheet_();
    const staff = findStaff_(ss, name);
    if (!staff) throw new Error('That staff member is not active. Refresh the page and try again.');
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG);
    const rows = readRows_(sheet);
    const alreadyOut = rows.some(r => String(r[1]).toLowerCase() === name.toLowerCase() && String(r[11]).toLowerCase() === 'out');
    if (alreadyOut) throw new Error(name + ' is already marked as out. Sign back in first.');

    const now = new Date();
    sheet.appendRow([Utilities.getUuid(), staff.name, staff.email, 'Sign out', destination, reason, notes,
      expectedReturn || '', now, '', '', 'Out']);
    return { ok: true, message: 'You are signed out. Have a good trip!' };
  } finally {
    lock.releaseLock();
  }
}

/** Sign a staff member back in by closing their latest open movement. */
function signIn(payload) {
  payload = payload || {};
  const name = clean_(payload.name, 120);
  if (!name) throw new Error('Choose your name first.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG);
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = values.length - 1; i >= 1; i--) {
      if (String(values[i][1]).toLowerCase() === name.toLowerCase() &&
          String(values[i][11]).toLowerCase() === 'out') {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex < 0) throw new Error(name + ' is not currently marked as out.');
    const now = new Date();
    const timeOut = new Date(sheet.getRange(rowIndex, 9).getValue());
    const duration = Math.max(0, Math.round((now.getTime() - timeOut.getTime()) / 60000));
    sheet.getRange(rowIndex, 10, 1, 3).setValues([[now, duration, 'In']]);
    return { ok: true, message: 'Welcome back, ' + name + '!' };
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('STAFF_MOVEMENT_SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Spreadsheet not found. Run setupStaffMovement() from the bound spreadsheet first.');
  return active;
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

function readRows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function findStaff_(ss, name) {
  const rows = readRows_(ss.getSheetByName(CONFIG.SHEETS.STAFF));
  const row = rows.find(r => String(r[0]).trim().toLowerCase() === name.toLowerCase() && isActive_(r[2]));
  return row ? { name: String(row[0]).trim(), email: String(row[1] || '').trim() } : null;
}

function isActive_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes';
}

function clean_(value, max) {
  return String(value == null ? '' : value).trim().replace(/[<>]/g, '').slice(0, max);
}


/** Set or change the manager PIN from the bound spreadsheet's Apps Script editor. */
function setAdminPin() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Set Rohan\'s Hotel admin PIN', 'Enter a new PIN (at least 6 characters). Keep it private.', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const pin = String(response.getResponseText() || '').trim();
  if (pin.length < 6) throw new Error('The admin PIN must be at least 6 characters.');
  PropertiesService.getScriptProperties().setProperty('STAFF_MOVEMENT_ADMIN_PIN', pin);
  ui.alert('Admin PIN saved. Open admin.html and use this PIN to sign in.');
}

function verifyAdmin_(pin) {
  const saved = PropertiesService.getScriptProperties().getProperty('STAFF_MOVEMENT_ADMIN_PIN');
  if (!saved) throw new Error('Admin PIN has not been set. Run setAdminPin() from the spreadsheet Apps Script editor.');
  if (String(pin || '') !== saved) throw new Error('Incorrect admin PIN.');
}

function adminGetData(pin) {
  verifyAdmin_(pin);
  const ss = getSpreadsheet_();
  const staff = readRows_(ss.getSheetByName(CONFIG.SHEETS.STAFF)).map((r, i) => ({
    row: i + 2, name: String(r[0] || ''), email: String(r[1] || ''), active: isActive_(r[2])
  }));
  const locations = readRows_(ss.getSheetByName(CONFIG.SHEETS.LOCATIONS)).map((r, i) => ({
    row: i + 2, name: String(r[0] || ''), active: isActive_(r[1])
  }));
  const log = readRows_(ss.getSheetByName(CONFIG.SHEETS.LOG)).slice(-100).reverse().map(r => ({
    id: String(r[0] || ''), name: String(r[1] || ''), email: String(r[2] || ''),
    action: String(r[3] || ''), destination: String(r[4] || ''), reason: String(r[5] || ''),
    notes: String(r[6] || ''), expectedReturn: r[7] ? new Date(r[7]).toISOString() : '',
    timeOut: r[8] ? new Date(r[8]).toISOString() : '', timeIn: r[9] ? new Date(r[9]).toISOString() : '',
    duration: r[10] === '' ? '' : Number(r[10]), status: String(r[11] || '')
  }));
  return { staff, locations, log, live: getAppData() };
}

function adminSaveStaff(pin, payload) {
  verifyAdmin_(pin);
  payload = payload || {};
  const name = clean_(payload.name, 120), email = clean_(payload.email, 180);
  if (!name) throw new Error('Enter a staff name.');
  const sh = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.STAFF);
  const rows = readRows_(sh);
  const existing = rows.findIndex(r => String(r[0]).trim().toLowerCase() === name.toLowerCase());
  const values = [name, email, payload.active !== false];
  if (existing >= 0) sh.getRange(existing + 2, 1, 1, 3).setValues([values]);
  else sh.appendRow(values);
  return adminGetData(pin);
}

function adminSaveLocation(pin, payload) {
  verifyAdmin_(pin);
  payload = payload || {};
  const name = clean_(payload.name, 120);
  if (!name) throw new Error('Enter a destination.');
  const sh = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.LOCATIONS);
  const rows = readRows_(sh);
  const existing = rows.findIndex(r => String(r[0]).trim().toLowerCase() === name.toLowerCase());
  const values = [name, payload.active !== false];
  if (existing >= 0) sh.getRange(existing + 2, 1, 1, 2).setValues([values]);
  else sh.appendRow(values);
  return adminGetData(pin);
}

function adminCloseMovement(pin, recordId) {
  verifyAdmin_(pin);
  const sh = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.LOG);
  const values = sh.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(recordId) && String(values[i][11]).toLowerCase() === 'out') {
      const now = new Date(), start = new Date(values[i][8]);
      sh.getRange(i + 1, 10, 1, 3).setValues([[now, Math.max(0, Math.round((now - start) / 60000)), 'In']]);
      return adminGetData(pin);
    }
  }
  throw new Error('That open movement could not be found. Refresh the dashboard.');
}
