/**
 * 帙雲 學生交作業系統 (獨立 Apps Script 專案)
 * =====================================================
 * 部署說明：
 *   1. 在 Google Apps Script 建立一個「全新獨立」的專案
 *   2. 將此檔案 (student.gs) 和 student_submit.html 複製進去
 *   3. 在「專案設定」→「指令碼屬性」中填入以下三個屬性：
 *        UPLOAD_FOLDER_ID  — 帙雲「1. 上傳課業Link（學生）」資料夾 ID
 *        RECORD_SHEET_ID   — 帙雲「繳交紀錄及課業佈置」試算表 ID
 *   4. 以「部署為網頁應用程式」發布，存取權設為「任何人（包括匿名）」
 *   5. 將產生的網址分享給學生，老師主系統的網址不要分享給學生
 *
 * 注意：此專案不含「布置課業」等老師功能，學生無法存取任何老師資料。
 */

// ── Web App 入口 ─────────────────────────────────────────────────────────────
function doGet() {
  const uploadFolderId = PropertiesService.getUserProperties().getProperty('UPLOAD_FOLDER_ID');
  if (!uploadFolderId) {
    return HtmlService.createHtmlOutput(
      '<div style="text-align:center;margin-top:60px;font-family:sans-serif;">' +
      '<h2 style="color:#d9534f;">⚠️ 系統尚未設定</h2>' +
      '<p>請聯絡老師或技術人員設定 UPLOAD_FOLDER_ID 屬性。</p></div>'
    );
  }
  return HtmlService.createTemplateFromFile('student_submit')
    .evaluate()
    .setTitle('帙雲 - 學生交作業')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── 取得表單所需資料（班別、學生名單、課業列表） ────────────────────────────────
function getStudentFormData() {
  try {
    const recordSheetId = PropertiesService.getUserProperties().getProperty('RECORD_SHEET_ID');
    if (!recordSheetId) return { error: '系統尚未設定，請聯絡老師。' };

    const data = { classes: [], students: {}, homeworks: {} };

    SpreadsheetApp.openById(recordSheetId).getSheets().forEach(function(sheet) {
      const className = sheet.getRange('A1').getValue().toString().trim();
      if (!className) return;
      data.classes.push(className);

      const lastRow = sheet.getLastRow();
      const students = lastRow >= 4
        ? sheet.getRange('A4:A' + lastRow).getValues().flat().filter(String)
        : [];
      data.students[className] = students;

      const lastCol = sheet.getLastColumn();
      const hwNames = lastCol >= 2
        ? sheet.getRange(1, 2, 1, lastCol - 1).getValues()[0].filter(String)
        : [];
      data.homeworks[className] = hwNames;
    });

    return data;
  } catch(e) {
    return { error: '讀取資料失敗：' + e.message };
  }
}

// ── 處理學生提交作業 ──────────────────────────────────────────────────────────
/**
 * payload: {
 *   className:    string   班別 (e.g. "1A")
 *   studentName:  string   學生姓名
 *   homeworkName: string   課業名稱（含「」【】格式）
 *   files: [{ name: string, base64: string, mimeType: string }]
 * }
 */
function submitHomework(payload) {
  try {
    const uploadFolderId = PropertiesService.getUserProperties().getProperty('UPLOAD_FOLDER_ID');
    if (!uploadFolderId) return { success: false, message: '❌ 系統尚未設定，請聯絡老師。' };

    const { className, studentName, homeworkName, files } = payload;

    if (!className || !studentName || !homeworkName || !files || files.length === 0) {
      return { success: false, message: '❌ 資料不完整，請重試。' };
    }

    // Extract keyword from homework name (supports 【keyword】 or plain name)
    const keywordMatch = homeworkName.match(/【(.*?)】/);
    const keyword = keywordMatch ? keywordMatch[1] : homeworkName.replace(/「.*?」/g, '').trim().substring(0, 8);

    const folder = DriveApp.getFolderById(uploadFolderId);
    const uploaded = [];

    files.forEach(function(fileData, index) {
      // Build filename matching the sorting logic: className_studentName_keyword_N.ext
      const originalName = fileData.name || ('file_' + (index + 1));
      const dotIdx = originalName.lastIndexOf('.');
      const ext = dotIdx > 0 ? originalName.substring(dotIdx) : '';
      const fileName = `${className}_${studentName}_${keyword}_${index + 1}${ext}`;

      const bytes = Utilities.base64Decode(fileData.base64);
      const blob  = Utilities.newBlob(bytes, fileData.mimeType || 'application/octet-stream', fileName);
      folder.createFile(blob);
      uploaded.push(fileName);
    });

    return {
      success: true,
      message: `✅ 成功上傳 ${uploaded.length} 個檔案！`,
      files: uploaded
    };
  } catch(e) {
    return { success: false, message: '❌ 上傳失敗：' + e.message };
  }
}
