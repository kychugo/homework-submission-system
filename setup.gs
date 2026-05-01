// 在試算表開啟時加入選單
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('☁️ 帙雲系統')
    .addItem('🚀 一鍵初始化系統 (僅初次執行)', 'installZhiyun')
    .addItem('🗑️ 清除所有自動觸發器', 'deleteAllTriggers')
    .addItem('⚠️ 重置安裝狀態 (出錯時使用)', 'forceReset')
    .addToUi();
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
    // 1. 建立一個最大的主資料夾
    const rootFolder = DriveApp.createFolder("📁 帙雲");
    
    // 2. 在主資料夾內建立四個子資料夾
    const uploadFolder = rootFolder.createFolder("1. 上傳課業Link（學生）");
    const pendingFolder = rootFolder.createFolder("2. 待批改課業");
    const feedbackFolder = rootFolder.createFolder("3. 老師回饋區");
    const returnedFolder = rootFolder.createFolder("4. 已發還課業");

    // 3. 建立三個試算表
    const autoShareSheet = SpreadsheetApp.create("帙雲 - 自動共用、收集位址");
    const recordSheet = SpreadsheetApp.create("帙雲 - 繳交紀錄及課業佈置");
    const overdueSheet = SpreadsheetApp.create("帙雲 - OverdueAssignments");

    // 4. ✨ 將三個新建的試算表，以及當前的「安裝檔」，全部搬進「📁 帙雲」主資料夾
    moveFileToFolder(autoShareSheet.getId(), rootFolder.getId());
    moveFileToFolder(recordSheet.getId(), rootFolder.getId());
    moveFileToFolder(overdueSheet.getId(), rootFolder.getId());
    moveFileToFolder(SpreadsheetApp.getActiveSpreadsheet().getId(), rootFolder.getId());

    // 5. 初始化試算表內容
    recordSheet.getSheets()[0].setName("1A").getRange("A1").setValue("1A");
    recordSheet.getSheets()[0].getRange("A4").setValue("陳大文"); // 測試用學生
    autoShareSheet.getSheets()[0].getRange("A1:C1").setValues([["學號", "姓名", "專屬文件夾位址"]]);

    // 6. 將所有 ID 存入系統紀錄中
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

    // 7. 設定自動觸發器
    setupTriggers();

    // 8. 寫入連結供老師點擊
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

// 建立觸發器
function setupTriggers() {
  deleteAllTriggers();
  ScriptApp.newTrigger('sortStudentAssignments').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('distributeHomework').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('createFoldersAndUpdateSheet').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('generateOverdueAssignments').timeBased().everyMinutes(1).create();
}

function deleteAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

function forceReset() {
  PropertiesService.getUserProperties().deleteAllProperties();
  SpreadsheetApp.getUi().alert("✅ 系統狀態已完全重置！\n請重新點擊選單的「🚀 一鍵初始化系統」。");
}

// ✨ 正確的移動檔案方法
function moveFileToFolder(fileId, folderId) {
  const file = DriveApp.getFileById(fileId);
  const targetFolder = DriveApp.getFolderById(folderId);
  file.moveTo(targetFolder);
}
