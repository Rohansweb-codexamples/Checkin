const HOTEL={SHEET_NAME:'Sheet1',REASONS:['Lunch','Break','Fresh air','Dinner','Breakfast']};

function onOpen(){
  SpreadsheetApp.getUi().createMenu("Rohan's Hotel")
    .addItem('Check / prepare staff sheet','setupStaffMovement')
    .addToUi();
}

function setupStaffMovement(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('Open Apps Script from your Staff Movement spreadsheet.');
  let sh=ss.getSheetByName(HOTEL.SHEET_NAME);
  if(!sh)sh=ss.getSheets()[0];
  const headers=sh.getRange(1,1,1,2).getDisplayValues()[0].map(v=>String(v).trim().toUpperCase());
  if(headers[0]!=='MEMBER'||headers[1]!=='WHERE'){
    throw new Error('Row 1 must contain MEMBER in A1 and WHERE in B1.');
  }
  if(sh.getName()!==HOTEL.SHEET_NAME)sh.setName(HOTEL.SHEET_NAME);
  sh.setFrozenRows(1);
  sh.getRange('A1:B1').setFontWeight('bold');
  PropertiesService.getScriptProperties().setProperty('HOTEL_SHEET_ID',ss.getId());
  SpreadsheetApp.getUi().alert('Connected. Add staff names in column A. A blank WHERE cell means the person is in.');
}

function doGet(e){
  const p=(e&&e.parameter)||{};
  const callback=/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(p.callback||''))?String(p.callback):'hotelCallback';
  let result;
  try{
    const action=String(p.action||'admin');
    if(action==='staff')result={ok:true,staff:readStaff_().map(x=>x.name)};
    else if(action==='admin')result={ok:true,staff:readStaff_()};
    else if(action==='status')result=status_(p.name);
    else if(action==='signout')result=signOut_(p.name,p.reason);
    else if(action==='signin')result=signIn_(p.name);
    else throw new Error('Unknown request.');
  }catch(err){
    result={ok:false,error:err&&err.message?err.message:String(err)};
  }
  return ContentService.createTextOutput(callback+'('+JSON.stringify(result)+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function readStaff_(){
  const sh=getSheet_();
  const last=sh.getLastRow();
  if(last<2)return[];
  return sh.getRange(2,1,last-1,2).getDisplayValues()
    .map((r,i)=>({row:i+2,name:String(r[0]).trim(),where:String(r[1]).trim()}))
    .filter(r=>r.name)
    .map(r=>({name:r.name,where:r.where,status:r.where?'Out':'In'}));
}

function status_(name){
  const row=findMemberRow_(name);
  const where=String(getSheet_().getRange(row,2).getDisplayValue()).trim();
  return{ok:true,isOut:!!where,where:where};
}

function signOut_(name,reason){
  name=clean_(name,120);
  reason=clean_(reason,80);
  if(HOTEL.REASONS.indexOf(reason)===-1)throw new Error('Please choose one of the listed reasons.');
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try{
    const row=findMemberRow_(name);
    const cell=getSheet_().getRange(row,2);
    if(String(cell.getDisplayValue()).trim())throw new Error('You are already signed out. Tap your name to sign back in.');
    cell.setValue(reason);
    SpreadsheetApp.flush();
    return{ok:true,message:'Signed out for '+reason+'.'};
  }finally{
    lock.releaseLock();
  }
}

function signIn_(name){
  name=clean_(name,120);
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try{
    const row=findMemberRow_(name);
    const cell=getSheet_().getRange(row,2);
    if(!String(cell.getDisplayValue()).trim())throw new Error('You are already marked as in.');
    cell.clearContent();
    SpreadsheetApp.flush();
    return{ok:true,message:'You are signed back in. Welcome back!'};
  }finally{
    lock.releaseLock();
  }
}

function findMemberRow_(name){
  name=clean_(name,120);
  if(!name)throw new Error('Please tap your name.');
  const sh=getSheet_();
  const last=sh.getLastRow();
  if(last<2)throw new Error('No staff names have been added yet.');
  const names=sh.getRange(2,1,last-1,1).getDisplayValues();
  for(let i=0;i<names.length;i++){
    if(String(names[i][0]).trim().toLowerCase()===name.toLowerCase())return i+2;
  }
  throw new Error('That name was not found. Please refresh the kiosk.');
}

function getSheet_(){
  const id=PropertiesService.getScriptProperties().getProperty('HOTEL_SHEET_ID');
  const ss=id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('Spreadsheet not connected. Run setupStaffMovement() from the bound spreadsheet.');
  const sh=ss.getSheetByName(HOTEL.SHEET_NAME);
  if(!sh)throw new Error('Could not find the Sheet1 tab.');
  const headers=sh.getRange(1,1,1,2).getDisplayValues()[0].map(v=>String(v).trim().toUpperCase());
  if(headers[0]!=='MEMBER'||headers[1]!=='WHERE')throw new Error('The first row must be MEMBER in A1 and WHERE in B1.');
  return sh;
}

function clean_(value,max){
  return String(value==null?'':value).trim().replace(/[<>]/g,'').slice(0,max);
}