const props = PropertiesService.getUserProperties();

// Web App 入口
function doGet(e) {
  const props = PropertiesService.getUserProperties();
  const uploadFolderId = props.getProperty('UPLOAD_FOLDER_ID');
  
  if (!uploadFolderId) {
    return HtmlService.createHtmlOutput(
      '<div style="text-align:center; margin-top:50px; font-family:sans-serif;">' +
      '<h2 style="color:#d9534f;">⚠️ 系統尚未初始化</h2>' +
      '<p>請先回到 Google 試算表，點擊上方選單的「☁️ 帙雲系統」>「🚀 一鍵初始化系統」。</p></div>'
    );
  }

  const page = (e && e.parameter) ? e.parameter.page : null;

  if (page === 'record') {
    const template = HtmlService.createTemplateFromFile('record');
    template.classData = getClassData();
    return template.evaluate().setTitle('作業繳交紀錄查閱');
  } else if (page === 'homework') {
    const template = HtmlService.createTemplateFromFile('homework');
    return template.evaluate().setTitle('布置課業');
  } else if (page === 'config') {
    const template = HtmlService.createTemplateFromFile('config');
    return template.evaluate().setTitle('科目與類別設定');
  } else if (page === 'autoshare') {
    const template = HtmlService.createTemplateFromFile('autoshare');
    return template.evaluate().setTitle('自動共用管理');
  } else {
    const template = HtmlService.createTemplateFromFile('Index');
    
    // 動態傳遞資料夾連結到前端
    template.urls = {
      appUrl: ScriptApp.getService().getUrl(), 
      upload: DriveApp.getFolderById(props.getProperty('UPLOAD_FOLDER_ID')).getUrl(),
      pending: DriveApp.getFolderById(props.getProperty('PENDING_FOLDER_ID')).getUrl(),
      feedback: DriveApp.getFolderById(props.getProperty('FEEDBACK_FOLDER_ID')).getUrl(),
      returned: DriveApp.getFolderById(props.getProperty('RETURNED_FOLDER_ID')).getUrl(),
      autoShareSheet: SpreadsheetApp.openById(props.getProperty('AUTO_SHARE_SHEET_ID')).getUrl(),
      recordSheet: SpreadsheetApp.openById(props.getProperty('RECORD_SHEET_ID')).getUrl()
    };
    
    return template.evaluate().setTitle('帙雲 - 控制面板');
  }
}

// ================== 科目與類別設定 ==================
function getSubjectConfig() {
  const stored = PropertiesService.getUserProperties().getProperty('SUBJECT_CONFIG');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  // Default config
  return {
    subjects: ['中文'],
    categories: {
      '中文': ['閱讀', '寫作（長文）', '寫作（實用文）']
    }
  };
}

function saveSubjectConfig(config) {
  try {
    PropertiesService.getUserProperties().setProperty('SUBJECT_CONFIG', JSON.stringify(config));
    return { success: true, message: '✅ 設定已儲存！' };
  } catch(e) {
    return { success: false, message: '❌ 儲存失敗：' + e.message };
  }
}

// ================== 截止日期格式化 ==================
function formatDeadline(date) {
  if (!date) return '';
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

// ================== 自動共用管理 (Web App CRUD) ==================
function getAutoShareData() {
  const autoShareId = PropertiesService.getUserProperties().getProperty('AUTO_SHARE_SHEET_ID');
  if (!autoShareId) return [];
  const sheet = SpreadsheetApp.openById(autoShareId).getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 3).getValues().map(row => ({
    studentId: String(row[0]).trim(),
    name: String(row[1]).trim(),
    folderUrl: String(row[2]).trim()
  })).filter(r => r.studentId || r.name);
}

function saveAutoShareRow(studentId, name) {
  try {
    const autoShareId = PropertiesService.getUserProperties().getProperty('AUTO_SHARE_SHEET_ID');
    if (!autoShareId) return { success: false, message: '系統尚未初始化' };
    const sheet = SpreadsheetApp.openById(autoShareId).getSheets()[0];
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === String(studentId).trim()) {
          sheet.getRange(i + 2, 1, 1, 2).setValues([[studentId, name]]);
          return { success: true, message: '✅ 已更新學生資料' };
        }
      }
    }
    sheet.appendRow([studentId, name, '']);
    return { success: true, message: '✅ 已新增學生' };
  } catch(e) {
    return { success: false, message: '❌ 錯誤：' + e.message };
  }
}

function deleteAutoShareRow(studentId) {
  try {
    const autoShareId = PropertiesService.getUserProperties().getProperty('AUTO_SHARE_SHEET_ID');
    if (!autoShareId) return { success: false, message: '系統尚未初始化' };
    const sheet = SpreadsheetApp.openById(autoShareId).getSheets()[0];
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, message: '找不到學生' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = ids.length - 1; i >= 0; i--) {
      if (String(ids[i][0]).trim() === String(studentId).trim()) {
        sheet.deleteRow(i + 2);
        return { success: true, message: '✅ 已刪除' };
      }
    }
    return { success: false, message: '找不到該學號的學生' };
  } catch(e) {
    return { success: false, message: '❌ 錯誤：' + e.message };
  }
}

function triggerAutoShare() {
  try {
    autoShareStudentFolders();
    return { success: true, message: '✅ 自動共用已執行完畢！請查看表格中的 C 欄。' };
  } catch(e) {
    return { success: false, message: '❌ 發生錯誤：' + e.message };
  }
}

// 在試算表開啟時加入選單
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('☁️ 帙雲系統')
    .addItem('🚀 一鍵初始化系統 (僅初次執行)', 'installZhiyun')
    .addSeparator()
    .addItem('📤 手動立即發還課業', 'manualDistribute')
    .addItem('🔗 手動執行自動共用', 'manualShare') 
    .addSeparator()
    .addItem('🗑️ 清除所有自動觸發器', 'deleteAllTriggers')
    .addItem('⚠️ 重置安裝狀態 (出錯時使用)', 'forceReset')
    .addToUi();
}

// 手動發還課業
function manualDistribute() {
  const ui = SpreadsheetApp.getUi();
  ui.alert("⏳ 系統正在為您手動發還課業，視乎檔案數量可能需要數十秒，請按「確定」並稍候...");
  try {
    distributeHomework(); 
    ui.alert("✅ 課業已發還完畢！\n您現在可以去「4. 已發還課業」檢查學生的資料夾了。");
  } catch (e) {
    ui.alert("❌ 發生錯誤：" + e.message);
  }
}

// 手動執行共用權限
function manualShare() {
  const ui = SpreadsheetApp.getUi();
  ui.alert("⏳ 系統正在為尚未設定的學生共用資料夾，並填寫位址，請按「確定」並稍候...");
  try {
    autoShareStudentFolders(); 
    ui.alert("✅ 共用權限已更新完畢！\n請查看「自動共用、收集位址」表中的C欄。");
  } catch (e) {
    ui.alert("❌ 發生錯誤：" + e.message);
  }
}

// 給 Web App 呼叫的手動發還函數
function triggerManualDistribute() {
  try {
    distributeHomework();
    return { success: true, message: "✅ 課業已成功發還！您可以前往「已發還課業」資料夾查看。" };
  } catch (e) {
    return { success: false, message: "❌ 發生錯誤：" + e.message };
  }
}

// 一鍵安裝主程式
function installZhiyun() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getUserProperties();
  
  if (props.getProperty('IS_INSTALLED') === 'true') {
    ui.alert("系統似乎已經安裝過。如要重新安裝，請先點擊「重置安裝狀態」。");
    return;
  }

  ui.alert("即將開始建構「帙雲」系統，所有檔案將集中在一個主資料夾中，請耐心等候約 1 分鐘...");

  try {
    const rootFolder = DriveApp.createFolder("📁 帙雲");
    
    const uploadFolder = rootFolder.createFolder("1. 上傳課業Link（學生）");
    const pendingFolder = rootFolder.createFolder("2. 待批改課業");
    const feedbackFolder = rootFolder.createFolder("3. 老師回饋區");
    const returnedFolder = rootFolder.createFolder("4. 已發還課業");

    const autoShareSheet = SpreadsheetApp.create("帙雲 - 自動共用、收集位址");
    const recordSheet = SpreadsheetApp.create("帙雲 - 繳交紀錄及課業佈置");
    const overdueSheet = SpreadsheetApp.create("帙雲 - OverdueAssignments");

    moveFileToFolder(autoShareSheet.getId(), rootFolder.getId());
    moveFileToFolder(recordSheet.getId(), rootFolder.getId());
    moveFileToFolder(overdueSheet.getId(), rootFolder.getId());
    moveFileToFolder(SpreadsheetApp.getActiveSpreadsheet().getId(), rootFolder.getId());

    recordSheet.getSheets()[0].setName("1A").getRange("A1").setValue("1A");
    recordSheet.getSheets()[0].getRange("A4").setValue("陳大文"); 
    autoShareSheet.getSheets()[0].getRange("A1:C1").setValues([["學號", "姓名", "專屬文件夾位址"]]);

    props.setProperties({
      'IS_INSTALLED': 'true',
      'UPLOAD_FOLDER_ID': uploadFolder.getId(),
      'PENDING_FOLDER_ID': pendingFolder.getId(),
      'FEEDBACK_FOLDER_ID': feedbackFolder.getId(),
      'RETURNED_FOLDER_ID': returnedFolder.getId(),
      'AUTO_SHARE_SHEET_ID': autoShareSheet.getId(),
      'RECORD_SHEET_ID': recordSheet.getId(),
      'OVERDUE_SHEET_ID': overdueSheet.getId()
    });

    setupTriggers();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clear();
    sheet.getRange("A1:B1").setValues([["項目", "連結"]]).setFontWeight("bold");
    const links = [
      ["📁 帙雲 主資料夾", rootFolder.getUrl()],
      ["上傳課業Link（學生）", uploadFolder.getUrl()],
      ["待批改課業", pendingFolder.getUrl()],
      ["老師回饋區", feedbackFolder.getUrl()],
      ["已發還課業", returnedFolder.getUrl()],
      ["繳交紀錄及課業佈置 (Sheet)", recordSheet.getUrl()]
    ];
    sheet.getRange(2, 1, links.length, 2).setValues(links);
    sheet.setColumnWidth(2, 500);

    ui.alert("✅ 系統建構成功！\n\n請去您的 Google Drive 看看，現在多了一個「📁 帙雲」的資料夾，裡面裝著所有的東西了！");

  } catch (e) {
    ui.alert("❌ 發生錯誤：" + e.message);
  }
}

function setupTriggers() {
  deleteAllTriggers();
  ScriptApp.newTrigger('sortStudentAssignments').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('distributeHomework').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('createFoldersAndUpdateSheet').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('generateOverdueAssignments').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('autoShareStudentFolders').timeBased().everyMinutes(5).create(); 
}

function deleteAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

function forceReset() {
  PropertiesService.getUserProperties().deleteAllProperties();
  SpreadsheetApp.getUi().alert("✅ 系統狀態已完全重置！\n請重新點擊選單的「🚀 一鍵初始化系統」。");
}

function moveFileToFolder(fileId, folderId) {
  const file = DriveApp.getFileById(fileId);
  const targetFolder = DriveApp.getFolderById(folderId);
  file.moveTo(targetFolder);
}

// ================== 自動共用與收集位址 ==================
function autoShareStudentFolders() {
  const props = PropertiesService.getUserProperties();
  const autoShareId = props.getProperty('AUTO_SHARE_SHEET_ID');
  const returnedFolderId = props.getProperty('RETURNED_FOLDER_ID');
  if(!autoShareId || !returnedFolderId) return;

  const sheet = SpreadsheetApp.openById(autoShareId).getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; 
  
  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const returnedFolder = DriveApp.getFolderById(returnedFolderId);

  const classFolders = returnedFolder.getFolders();
  const studentFoldersMap = {};
  while (classFolders.hasNext()) {
    const cFolder = classFolders.next();
    const sFolders = cFolder.getFolders();
    while (sFolders.hasNext()) {
      const sFolder = sFolders.next();
      const cleanName = sFolder.getName().replace(/【|】/g, '').trim(); 
      studentFoldersMap[cleanName] = sFolder;
    }
  }

  data.forEach((row, index) => {
    const studentId = String(row[0]).trim();
    const studentName = String(row[1]).trim();
    let folderUrl = row[2];

    if (studentId && studentName && (!folderUrl || String(folderUrl).includes("共用失敗"))) {
      const sFolder = studentFoldersMap[studentName];
      if (sFolder) {
        // ✨ 已依據參考代碼修正：移除 ms. ，改為正確的學校 Google 網域 ccckyc.edu.hk
        const email = `${studentId}@ccckyc.edu.hk`;
        
        try {
          // 保留進階 Drive API (v3) 寫法：繞過學校通知信件
          Drive.Permissions.create(
            {
              'role': 'writer',
              'type': 'user',
              'emailAddress': email
            },
            sFolder.getId(),
            {
              'sendNotificationEmail': false
            }
          );
          
          folderUrl = sFolder.getUrl();
          sheet.getRange(index + 2, 3).setValue(folderUrl); 
        } catch(e) {
          sheet.getRange(index + 2, 3).setValue("共用失敗: " + e.message);
        }
      }
    }
  });
}

// ================== 1. 收集功課 ==================
function sortStudentAssignments() {
  const sourceFolderId = props.getProperty('UPLOAD_FOLDER_ID');
  const targetFolderId = props.getProperty('PENDING_FOLDER_ID');
  if(!sourceFolderId || !targetFolderId) return;

  const supportedMimeTypes = [MimeType.PDF, MimeType.JPEG, MimeType.PNG, MimeType.GIF, MimeType.BMP, MimeType.WEBP];
  const classFolders = getClassFoldersRecursive(targetFolderId);
  const sourceFolder = DriveApp.getFolderById(sourceFolderId);
  const allFiles = sourceFolder.getFiles();
  
  while (allFiles.hasNext()) {
    const file = allFiles.next();
    const fileName = file.getName();
    if (!supportedMimeTypes.includes(file.getMimeType())) continue;
    
    const classMatch = fileName.match(/(\d+[A-Z])/);
    if (!classMatch) continue;
    
    const className = classMatch[0];
    const classInfo = classFolders[className];
    if (!classInfo) continue;
    
    let targetSubfolderId = null;
    for (const keyword in classInfo.keywordFolders) {
      if (fileName.includes(keyword)) {
        targetSubfolderId = classInfo.keywordFolders[keyword];
        break;
      }
    }
    if (!targetSubfolderId) targetSubfolderId = classInfo.rootFolderId;
    
    try { file.moveTo(DriveApp.getFolderById(targetSubfolderId)); } catch (e) {}
  }
}

function getClassFoldersRecursive(parentFolderId) {
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const classFolders = parentFolder.getFolders();
  const result = {};
  while (classFolders.hasNext()) {
    const classFolder = classFolders.next();
    const keywordFolders = {};
    collectKeywordsRecursive(classFolder, keywordFolders);
    result[classFolder.getName()] = { rootFolderId: classFolder.getId(), keywordFolders: keywordFolders };
  }
  return result;
}

function collectKeywordsRecursive(folder, keywordFolders) {
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const keywordMatch = subfolder.getName().match(/【(.*?)】/);
    if (keywordMatch) keywordFolders[keywordMatch[1]] = subfolder.getId();
    collectKeywordsRecursive(subfolder, keywordFolders);
  }
}

// ================== 2. 自動發還課業 ==================
function distributeHomework() {
  const uploadFolderId = props.getProperty('FEEDBACK_FOLDER_ID');
  const returnFolderId = props.getProperty('RETURNED_FOLDER_ID');
  if(!uploadFolderId || !returnFolderId) return;

  const uploadFolder = DriveApp.getFolderById(uploadFolderId);
  const returnFolder = DriveApp.getFolderById(returnFolderId);

  var classFolders = returnFolder.getFolders();
  var classMap = {};
  while (classFolders.hasNext()) {
    var classFolder = classFolders.next();
    classMap[classFolder.getName().replace(/【|】/g, '')] = classFolder;
  }

  var studentMap = {}, assignmentMap = {};
  for (var classKey in classMap) {
    var studentFolders = classMap[classKey].getFolders();
    while (studentFolders.hasNext()) {
      var studentFolder = studentFolders.next();
      var studentKey = studentFolder.getName().replace(/【|】/g, '');
      if (!studentMap[classKey]) studentMap[classKey] = {};
      studentMap[classKey][studentKey] = studentFolder;
      
      var writingFolders = studentFolder.getFoldersByName('寫作（長文）');
      if (writingFolders.hasNext()) {
        var assignmentFolders = writingFolders.next().getFolders();
        while (assignmentFolders.hasNext()) {
          var assignmentFolder = assignmentFolders.next();
          var match = assignmentFolder.getName().match(/【(.*?)】/);
          if (match) assignmentMap[`${classKey}_${studentKey}_${match[1]}`] = assignmentFolder;
        }
      }
    }
  }

  var files = uploadFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var fileName = file.getName();
    var classKey = Object.keys(classMap).find(ck => fileName.includes(ck));
    var studentKey = classKey && studentMap[classKey] ? Object.keys(studentMap[classKey]).find(sk => fileName.includes(sk)) : null;
    
    var assignmentKeyword = null;
    if (classKey && studentKey) {
      for (var key in assignmentMap) {
        if (key.startsWith(`${classKey}_${studentKey}_`) && fileName.includes(key.split('_')[2])) {
          assignmentKeyword = key.split('_')[2]; break;
        }
      }
    }

    if (classKey && studentKey && assignmentKeyword) file.moveTo(assignmentMap[`${classKey}_${studentKey}_${assignmentKeyword}`]);
    else if (classKey && studentKey) file.moveTo(studentMap[classKey][studentKey]);
    else if (classKey) file.moveTo(classMap[classKey]);
  }
}

// ================== 3. 繳交紀錄更新與創建資料夾 ==================
// Parses a homework name and returns { category, title } supporting both:
//   Old format: 「category」title【keyword】
//   New format: 「subject」「category」title【keyword】
function parseHomeworkName(name) {
  if (!name) return null;
  const nameStr = name.toString();
  const matches = [...nameStr.matchAll(/「(.*?)」/g)];
  if (matches.length >= 2) {
    // New format: 「subject」「category」title【keyword】
    // Remove both matched 「...」 tokens using their exact matched strings
    const prefix = matches[0][0] + matches[1][0];
    const title = nameStr.startsWith(prefix)
      ? nameStr.slice(prefix.length).trim()
      : nameStr.replace(matches[0][0], '').replace(matches[1][0], '').trim();
    return { category: matches[1][1], title: title };
  } else if (matches.length === 1) {
    // Old format: 「category」title【keyword】
    const title = nameStr.startsWith(matches[0][0])
      ? nameStr.slice(matches[0][0].length).trim()
      : nameStr.replace(matches[0][0], '').trim();
    return { category: matches[0][1], title: title };
  }
  return null;
}

function createFoldersAndUpdateSheet() {
  const spreadsheetId = props.getProperty('RECORD_SHEET_ID');
  const pendingFolderId = props.getProperty('PENDING_FOLDER_ID');
  const returnedFolderId = props.getProperty('RETURNED_FOLDER_ID');
  if(!spreadsheetId) return;

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  spreadsheet.getSheets().forEach(sheet => {
    const className = sheet.getRange('A1').getValue().toString().trim();
    if (!className) return;

    const lastRow = sheet.getLastRow();
    let studentNames = [];
    if (lastRow >= 4) {
      studentNames = sheet.getRange('A4:A' + lastRow).getValues().flat().filter(String);
    }

    const classReturnFolder = getOrCreateFolder(returnedFolderId, `【${className}】`);
    if (classReturnFolder && studentNames.length > 0) {
      studentNames.forEach(student => {
        if (className === "1A" && student === "陳大文") return;
        getOrCreateFolder(classReturnFolder.getId(), `【${student}】`);
      });
    }

    const lastColumn = sheet.getLastColumn();
    if (lastColumn < 2) return;
      
    const homeworkValues = sheet.getRange(1, 2, 2, lastColumn - 1).getValues();
    const homeworkNames = homeworkValues[0];
    const deadlines = homeworkValues[1];
    
    const homeworkByCategory = {};
    const homeworkFolderIds = new Array(homeworkNames.length).fill('');
    const homeworkInfos = [];
    
    homeworkNames.forEach(name => {
      const info = parseHomeworkName(name);
      if (info) {
        if (!homeworkByCategory[info.category]) homeworkByCategory[info.category] = [];
        homeworkByCategory[info.category].push(info.title);
        homeworkInfos.push(info);
      } else {
        homeworkInfos.push(null);
      }
    });
    
    const classPendingFolder = getOrCreateFolder(pendingFolderId, className);
    if (classPendingFolder) {
      const catFolders = {};
      homeworkInfos.forEach((info, index) => {
        if (!info) return;
        if (!catFolders[info.category]) {
          catFolders[info.category] = getOrCreateFolder(classPendingFolder.getId(), info.category);
        }
        if (catFolders[info.category]) {
          const hwFolder = getOrCreateFolder(catFolders[info.category].getId(), info.title);
          if (hwFolder) homeworkFolderIds[index] = hwFolder.getId();
        }
      });
    }
    
    if (homeworkFolderIds.length > 0) sheet.getRange(3, 2, 1, homeworkFolderIds.length).setValues([homeworkFolderIds]);
    
    if (classReturnFolder && studentNames.length > 0) {
      studentNames.forEach(student => {
        if (className === "1A" && student === "陳大文") return;

        const sFolder = getOrCreateFolder(classReturnFolder.getId(), `【${student}】`);
        Object.keys(homeworkByCategory).forEach(cat => {
          const catFolder = getOrCreateFolder(sFolder.getId(), cat);
          if (catFolder) homeworkByCategory[cat].forEach(hw => getOrCreateFolder(catFolder.getId(), hw));
        });
      });
    }
    
    updateSubmissionStatus(sheet, className, studentNames, homeworkNames, deadlines, homeworkFolderIds);
  });
}

function getOrCreateFolder(parentId, folderName) {
  try {
    const parentFolder = DriveApp.getFolderById(parentId);
    const existing = parentFolder.getFoldersByName(folderName);
    return existing.hasNext() ? existing.next() : parentFolder.createFolder(folderName);
  } catch (e) { return null; }
}

function updateSubmissionStatus(sheet, className, studentNames, homeworkNames, deadlines, homeworkFolderIds) {
  if (studentNames.length === 0 || homeworkNames.length === 0) return;
  const submissionData = Array.from({length: studentNames.length}, () => Array(homeworkNames.length).fill({background: '#ffffff', value: ''}));
  
  homeworkFolderIds.forEach((folderId, colIndex) => {
    if (!folderId) return;
    try {
      const files = DriveApp.getFolderById(folderId).getFiles();
      const fileMap = {};
      while (files.hasNext()) { const f = files.next(); fileMap[f.getName()] = f; }
      
      studentNames.forEach((student, rowIndex) => {
        if (className === "1A" && student === "陳大文") return;

        const fileKey = Object.keys(fileMap).find(n => n.includes(student));
        if (fileKey) {
          const late = fileMap[fileKey].getDateCreated() > new Date(deadlines[colIndex]);
          submissionData[rowIndex][colIndex] = { background: late ? '#fff2cc' : '#d9ead3', value: late ? '遲交' : '已繳交' };
        } else {
          submissionData[rowIndex][colIndex] = { background: '#f4cccc', value: '未繳交' };
        }
      });
    } catch(e) {}
  });
  
  const range = sheet.getRange(4, 2, studentNames.length, homeworkNames.length);
  range.setValues(submissionData.map(r => r.map(c => c.value)));
  range.setBackgrounds(submissionData.map(r => r.map(c => c.background)));
}

// ================== 4. 逾期名單 ==================
function generateOverdueAssignments() {
  const recordId = props.getProperty('RECORD_SHEET_ID');
  const autoShareId = props.getProperty('AUTO_SHARE_SHEET_ID');
  const overdueId = props.getProperty('OVERDUE_SHEET_ID');
  if(!recordId || !autoShareId || !overdueId) return;

  const studentSheet = SpreadsheetApp.openById(autoShareId).getSheets()[0];
  const studentMap = {};
  studentSheet.getRange('A2:B' + studentSheet.getLastRow()).getValues().forEach(row => {
    if(row[0] && row[1]) studentMap[row[1]] = `${row[0]}@ccckyc.edu.hk`; // 這裡順便幫您把逾期名單搜集的電郵也改正過來了
  });

  const overdueSpreadsheet = SpreadsheetApp.openById(overdueId);
  let overdueSheet = overdueSpreadsheet.getSheetByName('Overdue Assignments') || overdueSpreadsheet.insertSheet('Overdue Assignments');
  overdueSheet.clear().appendRow(['班別', '學生姓名', '學生電郵', '課業名稱', '截止日期']);
  
  const currentDate = new Date();
  SpreadsheetApp.openById(recordId).getSheets().forEach(sheet => {
    const className = sheet.getRange('A1').getValue().toString().trim();
    if (!className) return;
    const lastCol = sheet.getLastColumn();
    if (lastCol < 2) return;
    
    const assignments = sheet.getRange(1, 2, 2, lastCol - 1).getValues();
    const students = sheet.getRange('A4:A' + sheet.getLastRow()).getValues().flat().filter(String);
    const statuses = sheet.getRange(4, 2, students.length, lastCol - 1).getValues();
    
    students.forEach((student, rIdx) => {
      if (className === "1A" && student === "陳大文") return;

      assignments[0].forEach((assignment, cIdx) => {
        if (statuses[rIdx][cIdx] === '未繳交' && currentDate > new Date(assignments[1][cIdx])) {
          if (studentMap[student]) overdueSheet.appendRow([className, student, studentMap[student], assignment, assignments[1][cIdx]]);
        }
      });
    });
  });
}

// ================== Web App 需要的數據函數 ==================
function getClassData() {
  const classData = [];
  const spreadsheetId = props.getProperty('RECORD_SHEET_ID');
  if(!spreadsheetId) return classData;
  SpreadsheetApp.openById(spreadsheetId).getSheets().forEach(sheet => {
    const className = sheet.getRange('A1').getValue().toString().trim();
    if (!className) return;
    
    const lastCol = sheet.getLastColumn();
    const hws = lastCol >= 2 ? sheet.getRange(1, 2, 2, lastCol - 1).getValues() : [[],[]];
    const students = sheet.getRange('A4:A' + sheet.getLastRow()).getValues().flat().filter(String);
    const hwData = hws[0].map((name, i) => ({ name: name, deadline: formatDeadline(hws[1][i]), folderId: sheet.getRange(3, 2 + i).getValue() }));
    
    classData.push({
      className: className,
      homework: hwData,
      students: students.map((s, r) => ({
        name: s,
        submissions: hwData.map((hw, c) => ({ homework: hw.name, color: sheet.getRange(4 + r, 2 + c).getBackground() }))
      }))
    });
  });
  return classData;
}

function getSpreadsheetData() {
  const data = { classes: [], homeworks: {}, subjectConfig: getSubjectConfig() };
  SpreadsheetApp.openById(props.getProperty('RECORD_SHEET_ID')).getSheets().forEach(sheet => {
    const className = sheet.getRange('A1').getValue().toString().trim();
    if (!className) return;
    data.classes.push(className);
    const lastCol = sheet.getLastColumn();
    const values = lastCol >= 2 ? sheet.getRange(1, 2, 2, lastCol - 1).getValues() : [[],[]];
    data.homeworks[className] = { names: values[0].filter(String), deadlines: values[1].map(d => d.toString()) };
  });
  return data;
}

function updateSpreadsheet(className, homeworkName, deadline) {
  const sheet = SpreadsheetApp.openById(props.getProperty('RECORD_SHEET_ID')).getSheets().find(s => s.getRange('A1').getValue().toString().trim() === className);
  const row1 = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
  const nextCol = row1.findIndex((v, i) => i > 0 && !v) + 1 || row1.length + 1;
  sheet.getRange(1, nextCol).setValue(homeworkName);
  sheet.getRange(2, nextCol).setValue(deadline);
}
