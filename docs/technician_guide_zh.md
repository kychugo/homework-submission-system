# 帙雲作業提交系統 — 平台監控及技術維護指南（廣東話）

## 目錄
1. [系統架構概覽](#1-系統架構概覽)
2. [自動觸發器監控](#2-自動觸發器監控)
3. [錯誤日誌查閱](#3-錯誤日誌查閱)
4. [Google Drive 資料夾健康檢查](#4-google-drive-資料夾健康檢查)
5. [試算表監控](#5-試算表監控)
6. [常見故障及解決方法](#6-常見故障及解決方法)
7. [系統重置程序](#7-系統重置程序)
8. [安全注意事項](#8-安全注意事項)
9. [系統屬性參考表](#9-系統屬性參考表)

---

## 1. 系統架構概覽

### 主系統（老師用）
- **平台：** Google Apps Script（.gs 檔案 + HTML 範本）
- **觸發器：** 5 個時間型自動觸發器（詳見第 2 節）
- **儲存：** Google Drive（資料夾）+ Google Sheets（試算表）+ UserProperties（系統設定）

### 學生提交系統（獨立部署）
- **平台：** 獨立 Google Apps Script 網頁應用程式
- **觸發器：** 無（純按需執行）
- **儲存：** 使用主系統的 Google Drive UPLOAD_FOLDER_ID 資料夾

### 數據流
```
學生上傳 → 上傳資料夾 → [sortStudentAssignments 每1分鐘] → 待批改課業
老師批改後 → 老師回饋區 → [distributeHomework 每15分鐘] → 已發還課業
繳交紀錄試算表 → [createFoldersAndUpdateSheet 每5分鐘] → 更新資料夾結構 + 繳交狀態
自動共用試算表 → [autoShareStudentFolders 每5分鐘] → 共用學生資料夾
繳交紀錄 → [generateOverdueAssignments 每1分鐘] → 逾期名單試算表
```

---

## 2. 自動觸發器監控

### 如何查看觸發器狀態

1. 前往 [script.google.com](https://script.google.com) → 開啟主系統的 Apps Script 專案
2. 左側欄點擊「⏱ 觸發器」圖示（時鐘圖示）
3. 頁面會列出所有正在執行的觸發器

### 正常狀態下應有的觸發器

| 函數名稱 | 執行頻率 | 功能 |
|---------|---------|------|
| `sortStudentAssignments` | 每 1 分鐘 | 將學生上傳的檔案移至待批改資料夾 |
| `distributeHomework` | 每 15 分鐘 | 將批改好的課業發還給學生 |
| `createFoldersAndUpdateSheet` | 每 5 分鐘 | 建立/更新資料夾結構及繳交狀態 |
| `generateOverdueAssignments` | 每 1 分鐘 | 更新逾期名單 |
| `autoShareStudentFolders` | 每 5 分鐘 | 自動共用學生資料夾 |

### 觸發器失效的症狀
- 繳交紀錄停止更新
- 上傳的作業停留在「上傳課業Link（學生）」資料夾，不被移動
- 批改後的課業不被自動發還

### 解決方法
1. 在試算表選單點擊「**☁️ 帙雲系統**」→「**🗑️ 清除所有自動觸發器**」
2. 然後點擊「**🚀 一鍵初始化系統**」→「已安裝」→ 在試算表選單重新執行 `setupTriggers()`

> **替代方法：** 在 Apps Script 中手動執行 `setupTriggers()` 函數。

---

## 3. 錯誤日誌查閱

### 在 Apps Script 查看執行日誌

1. 前往 [script.google.com](https://script.google.com) → 開啟主系統專案
2. 左側欄點擊「**⚡ 執行項目**」
3. 可查看所有觸發器及手動執行的歷史記錄，包括：
   - 執行時間
   - 執行結果（成功 / 失敗）
   - 錯誤訊息（如有）

### 常見錯誤代碼

| 錯誤訊息 | 可能原因 |
|---------|---------|
| `DriveApp: Access denied` | 資料夾已被刪除或移動 |
| `Spreadsheet ... not found` | 試算表 ID 不正確或已被刪除 |
| `Service invoked too many times` | 觸發器執行過於頻繁，Google 限制 |
| `Cannot read property ... of null` | 系統屬性遺失，需重新初始化 |
| `Drive.Permissions.create ... failed` | Drive API 未啟用或帳號不存在 |

---

## 4. Google Drive 資料夾健康檢查

### 定期檢查項目

| 資料夾 | 正常情況 | 異常情況 |
|--------|---------|---------|
| 1. 上傳課業Link（學生） | 通常應為空（檔案會被自動移走） | 如持續積累檔案 → 觸發器失效 |
| 2. 待批改課業 | 有學生作業，按班別分類 | 如無分類 → 班別設定問題 |
| 3. 老師回饋區 | 批改後暫存，通常為空 | 如持續積累 → distributeHomework 觸發器失效 |
| 4. 已發還課業 | 有按班別/學生/類別分類的資料夾 | 如學生找不到 → 自動共用問題 |

### 資料夾 ID 確認
如懷疑資料夾 ID 已失效，可在 Apps Script 中執行以下代碼確認：
```javascript
function checkFolderIds() {
  const props = PropertiesService.getUserProperties();
  ['UPLOAD_FOLDER_ID','PENDING_FOLDER_ID','FEEDBACK_FOLDER_ID','RETURNED_FOLDER_ID'].forEach(k => {
    try {
      const name = DriveApp.getFolderById(props.getProperty(k)).getName();
      Logger.log(k + ': OK (' + name + ')');
    } catch(e) {
      Logger.log(k + ': ERROR - ' + e.message);
    }
  });
}
```

---

## 5. 試算表監控

### 主要試算表

| 試算表名稱 | 用途 | 監控重點 |
|-----------|------|---------|
| 帙雲 - 繳交紀錄及課業佈置 | 記錄課業及繳交狀態 | 每班一個分頁，A1 有班別名稱，A4 起有學生名單 |
| 帙雲 - 自動共用、收集位址 | 學生帳號及資料夾連結 | C 欄應有資料夾網址，若顯示「共用失敗」需處理 |
| 帙雲 - OverdueAssignments | 逾期作業名單 | 定期核查，確認觸發器有更新 |

---

## 6. 常見故障及解決方法

### 問題 1：系統完全停止運作
**症狀：** 所有功能無反應，控制面板顯示「系統尚未初始化」  
**解決：** 
1. 前往 Apps Script → 執行 `checkFolderIds()`（見第 4 節）
2. 如資料夾 ID 失效，在試算表選單執行「重置安裝狀態」然後重新初始化

### 問題 2：觸發器配額用盡
**症狀：** Apps Script 執行項目顯示大量「Service invoked too many times」  
**解決：** 觸發器頻率可能需要調整。前往 Apps Script → `setupTriggers()` 函數，適當增加間隔（例如將 `everyMinutes(1)` 改為 `everyMinutes(5)`）

### 問題 3：Drive API 配額用盡
**症狀：** 自動共用功能停止，日誌顯示 Drive API 錯誤  
**解決：** Google 對 Drive API 有每日配額限制。如學生人數多，可在 `autoShareStudentFolders()` 中加入批次處理，避免一次共用太多資料夾。

### 問題 4：部署後學生看到舊版本
**解決：** 在 Apps Script → 部署 → 管理部署 → 編輯 → 將版本改為「新版本」

---

## 7. 系統重置程序

### 輕度重置（僅重置屬性）
1. 試算表選單 → 「⚠️ 重置安裝狀態」
2. 重新執行初始化
3. **影響：** 重新生成系統屬性；原有 Drive 資料夾和試算表不受影響

### 完整重置（謹慎操作）
1. 在 Apps Script 中執行 `deleteAllTriggers()`
2. 在 Apps Script 中執行 `forceReset()`
3. 手動刪除 Google Drive 中的「📁 帙雲」資料夾（**所有資料將遺失**）
4. 重新執行初始化

---

## 8. 安全注意事項

- **老師控制面板 URL** 應妥善保管，不可分享給學生
- **學生提交 URL** 可以分享給學生（沒有老師功能）
- 系統不設密碼保護，主要依賴 URL 保密性
- 如懷疑 URL 外洩，在 Apps Script 重新部署並選「新版本」，可獲得新的 URL

---

## 9. 系統屬性參考表

以下屬性儲存於 `UserProperties`（主系統 Apps Script 專案）：

| 屬性名稱 | 說明 |
|---------|------|
| `IS_INSTALLED` | `"true"` 表示已初始化 |
| `UPLOAD_FOLDER_ID` | 學生上傳資料夾 ID |
| `PENDING_FOLDER_ID` | 待批改課業資料夾 ID |
| `FEEDBACK_FOLDER_ID` | 老師回饋區資料夾 ID |
| `RETURNED_FOLDER_ID` | 已發還課業資料夾 ID |
| `AUTO_SHARE_SHEET_ID` | 自動共用試算表 ID |
| `RECORD_SHEET_ID` | 繳交紀錄試算表 ID |
| `OVERDUE_SHEET_ID` | 逾期名單試算表 ID |
| `SUBJECT_CONFIG` | 科目與類別設定（JSON 格式） |

以下屬性儲存於**學生提交系統**的 `UserProperties`：

| 屬性名稱 | 說明 |
|---------|------|
| `UPLOAD_FOLDER_ID` | 同主系統的 UPLOAD_FOLDER_ID |
| `RECORD_SHEET_ID` | 同主系統的 RECORD_SHEET_ID |
