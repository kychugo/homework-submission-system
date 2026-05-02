# 帙雲 — 技術人員及系統監察指南

> **語言：** 粵語（繁體中文） | [English version → technician-guide-en.md](./technician-guide-en.md)

---

## 目錄

1. [系統架構概覽](#1-系統架構概覽)
2. [主要檔案及功能](#2-主要檔案及功能)
3. [觸發器健康檢查](#3-觸發器健康檢查)
4. [常見問題診斷](#4-常見問題診斷)
5. [查閱 Apps Script 執行日誌](#5-查閱-apps-script-執行日誌)
6. [管理系統屬性](#6-管理系統屬性)
7. [重新初始化系統](#7-重新初始化系統)
8. [Drive API 配額及限制](#8-drive-api-配額及限制)
9. [電郵域名設定](#9-電郵域名設定)
10. [安全性注意事項](#10-安全性注意事項)
11. [備份及復原](#11-備份及復原)
12. [監察核對清單](#12-監察核對清單)

---

## 1. 系統架構概覽

```
┌────────────────────────────────────────────────────────┐
│                  Google Apps Script                    │
│                                                        │
│  code.gs        — 主要邏輯（觸發器、Web App 入口）     │
│  setup.gs       — 安裝嚮導（installZhiyun）           │
│  record.gs      — 繳交紀錄數據提供者                  │
│  Index.html     — 老師控制面板介面                    │
│  homework.html  — 布置課業表格介面                    │
│  student.html   — 學生繳交介面                       │
│  record.html    — 繳交狀況儀表板介面                  │
│  config.html    — 類別/科目設定介面                   │
│  autoshare.html — 自動共用管理介面                    │
└──────────────────────────┬─────────────────────────────┘
                           │ 讀取 / 寫入
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼───────┐
    │  Google     │ │  Google     │ │  Google     │
    │  Drive      │ │  Sheets     │ │  Sheets     │
    │  （4個資料夾）│ │ 繳交紀錄表  │ │ 自動共用表  │
    └─────────────┘ └─────────────┘ └─────────────┘
                            │
                    ┌───────▼───────┐
                    │  Google       │
                    │  Sheets       │
                    │  逾期名單     │
                    └───────────────┘
```

### 數據流程摘要

1. **學生上傳**檔案至 `1. 上傳課業Link（學生）`（上傳資料夾）。
2. `sortStudentAssignments`（每 1 分鐘）讀取檔案名稱，匹配班別及關鍵詞，將檔案移至 `2. 待批改課業` 嘅對應子資料夾。
3. 老師批改後，將檔案放入 `3. 老師回饋區`。
4. `distributeHomework`（每 15 分鐘）讀取老師回饋區嘅檔案名稱，匹配學生、班別及關鍵詞，將檔案移至 `4. 已發還課業/{班別}/{學生}/`。
5. `createFoldersAndUpdateSheet`（每 5 分鐘）比對 Drive 資料夾與試算表，建立缺失資料夾，更新繳交狀況儲存格（顏色及文字）。
6. `autoShareStudentFolders`（每 5 分鐘）讀取自動共用試算表，使用 Drive API v3 將學生資料夾共用至 `{學號}@ccckyc.edu.hk`。
7. `generateOverdueAssignments`（每 1 分鐘）比對繳交狀況及截止日期，將逾期紀錄寫入逾期名單試算表。

---

## 2. 主要檔案及功能

| 檔案 | 功能 |
|------|------|
| `code.gs` | 所有業務邏輯、觸發器、`doGet()` Web App 入口、`installZhiyun()` |
| `setup.gs` | 安裝邏輯參考版本（可能與 `code.gs` 合併） |
| `record.gs` | 為繳交紀錄儀表板模板提供 `classData` |
| `Index.html` | 老師控制面板 — Web App 根網址渲染 |
| `homework.html` | 布置課業表格 — 在 `?page=homework` 渲染 |
| `student.html` | 學生繳交介面 — 在 `?page=submit` 渲染 |
| `record.html` | 繳交狀況表格 — 在 `?page=record` 渲染 |
| `config.html` | 類別/科目設定面板 — 在 `?page=config` 渲染 |
| `autoshare.html` | 自動共用管理面板 — 在 `?page=autoshare` 渲染 |

### 使用者屬性（按 Google 帳號儲存）

安裝時設定，所有自動化功能均依賴以下屬性：

| 屬性鍵 | 值 |
|--------|---|
| `IS_INSTALLED` | 安裝完成後為 `"true"` |
| `UPLOAD_FOLDER_ID` | `1. 上傳課業Link（學生）` 嘅 Drive ID |
| `PENDING_FOLDER_ID` | `2. 待批改課業` 嘅 Drive ID |
| `FEEDBACK_FOLDER_ID` | `3. 老師回饋區` 嘅 Drive ID |
| `RETURNED_FOLDER_ID` | `4. 已發還課業` 嘅 Drive ID |
| `AUTO_SHARE_SHEET_ID` | 自動共用試算表嘅試算表 ID |
| `RECORD_SHEET_ID` | 繳交紀錄試算表嘅試算表 ID |
| `OVERDUE_SHEET_ID` | 逾期名單試算表嘅試算表 ID |

---

## 3. 觸發器健康檢查

1. 打開安裝檔試算表。
2. 點擊 **「擴充功能」 → 「Apps Script」**。
3. 在 Apps Script 編輯器中，點擊左側邊欄嘅**時鐘圖示**（觸發器）。
4. 應見到 **5 個有效觸發器**：

   | 函數 | 類型 | 頻率 |
   |------|------|------|
   | `sortStudentAssignments` | 時間驅動 | 每 1 分鐘 |
   | `distributeHomework` | 時間驅動 | 每 15 分鐘 |
   | `createFoldersAndUpdateSheet` | 時間驅動 | 每 5 分鐘 |
   | `generateOverdueAssignments` | 時間驅動 | 每 1 分鐘 |
   | `autoShareStudentFolders` | 時間驅動 | 每 5 分鐘 |

若有觸發器缺失，從試算表選單執行 **「☁️ 帙雲系統」 → 「🗑️ 清除所有自動觸發器」**，然後重新安裝，或直接在 Apps Script 編輯器執行 `setupTriggers()` 函數。

---

## 4. 常見問題診斷

### 檔案未從上傳資料夾移動

**症狀：** 學生檔案停留在 `1. 上傳課業Link（學生）`，未被移動。

**檢查清單：**
- [ ] `sortStudentAssignments` 觸發器是否有效？（查閱觸發器面板）
- [ ] 檔案名稱是否包含有效班別（例如 `1A`、`2B`）？沒有匹配班別嘅檔案會被跳過。
- [ ] `2. 待批改課業` 內是否有對應名稱嘅班別資料夾？
- [ ] 查閱 Apps Script 執行日誌有否錯誤（見第 5 節）。

---

### 繳交狀況未更新

**症狀：** 學生已上傳檔案，但試算表仍顯示 🔴 未繳交。

**檢查清單：**
- [ ] `createFoldersAndUpdateSheet` 觸發器是否有效？
- [ ] 檔案是否出現在 `2. 待批改課業` 嘅正確子資料夾？
- [ ] 試算表第 3 行嘅資料夾 ID 是否與實際 Drive 資料夾一致？
- [ ] A 欄嘅學生姓名是否與檔案名稱中嘅姓名完全一致？

---

### 學生資料夾未能共用

**症狀：** 自動共用試算表 C 欄仍為空白或顯示 `"共用失敗"`。

**檢查清單：**
- [ ] Drive API v3 進階服務是否已啟用？（Apps Script → 服務）
- [ ] A 欄嘅學號是否正確（有否多餘空格）？
- [ ] 學生嘅 Google 帳號是否在 `ccckyc.edu.hk` 域名下有效存在？
- [ ] `4. 已發還課業/{班別}/{學生}/` 內嘅學生資料夾是否已建立？

---

### 課業未能發還至學生

**症狀：** 老師已將檔案放入 `3. 老師回饋區`，但學生資料夾未見到。

**檢查清單：**
- [ ] 檔案名稱是否包含班別名稱及學生姓名？
- [ ] `distributeHomework` 觸發器是否有效？
- [ ] `4. 已發還課業` 中是否存在對應嘅學生資料夾？
- [ ] 從控制面板執行**手動發還課業**，查看是否有錯誤訊息。

---

### Web App 顯示「系統尚未初始化」

**原因：** `UPLOAD_FOLDER_ID` 使用者屬性遺失——安裝未完成。

**解決方法：** 從試算表選單執行 `installZhiyun()`（如需要先重置）。

---

## 5. 查閱 Apps Script 執行日誌

1. 打開 Apps Script 編輯器。
2. 點擊左側邊欄嘅**「執行」**圖示（播放 ▶ 加時鐘）。
3. 可見最近觸發器執行記錄（已完成 / 失敗）。
4. 點擊任何一次執行以展開，查看完整日誌輸出及錯誤訊息。

**常見錯誤類型：**

| 錯誤 | 可能原因 |
|------|---------|
| `Exception: No item with the given ID` | 儲存嘅資料夾／試算表 ID 無效（已被刪除或移動） |
| `Exception: DriveApp access not granted` | 腳本需要重新授權 |
| `Exception: Access denied` | Drive API v3 未啟用，或權限問題 |
| `RangeError: Maximum call stack` | 遞歸資料夾掃描層數過深 |

---

## 6. 管理系統屬性

如需以程式碼查看儲存嘅屬性值，在 Apps Script 控制台執行：

```javascript
function debugProps() {
  const p = PropertiesService.getUserProperties().getProperties();
  console.log(JSON.stringify(p, null, 2));
}
```

如需手動修改屬性（例如資料夾意外刪除後重新建立）：

```javascript
function fixProp() {
  PropertiesService.getUserProperties().setProperty('UPLOAD_FOLDER_ID', '新資料夾_ID');
}
```

---

## 7. 重新初始化系統

如系統需要完全重新安裝（例如核心檔案意外刪除）：

1. 打開安裝檔試算表。
2. 點擊 **「☁️ 帙雲系統」 → 「⚠️ 重置安裝狀態 (出錯時使用)」**。
3. 所有使用者屬性被清除。
4. 點擊 **「🚀 一鍵初始化系統」** 重新安裝。

> ⚠️ **警告：** 重新安裝會建立全新嘅 Google Drive 資料夾及試算表，舊有嘅課業記錄及學生資料夾連結不會自動遷移。重置前請先備份舊有資料。

---

## 8. Drive API 配額及限制

系統依賴 Google Drive API，Google 設有以下限制：

| 限制 | 數值 |
|------|------|
| 每日 Drive API 呼叫次數 | 10 億（消費者帳號） |
| 每次執行建議最大檔案移動數 | 約 500 個 |
| 觸發器每次執行時間上限 | 6 分鐘 |
| 觸發器最小間隔 | 1 分鐘（不可再短） |

**本系統的實際限制：**
- 班級規模較大時（100+ 名學生），`createFoldersAndUpdateSheet` 函數可能偶爾超出 6 分鐘執行上限。請監察執行日誌中嘅 `Exceeded maximum execution time` 錯誤。
- `autoShareStudentFolders` 對每位未共用嘅學生呼叫 `Drive.Permissions.create`，如有大量新學生，可能需要多個 5 分鐘週期才能完成。

---

## 9. 電郵域名設定

系統目前設定使用 `ccckyc.edu.hk` 域名。

如需為其他學校部署，請在 `code.gs` 中更新以下位置：

| 位置 | 目前值 | 更新至 |
|------|--------|--------|
| `autoShareStudentFolders()` | `` `${studentId}@ccckyc.edu.hk` `` | 目標學校嘅域名 |
| `generateOverdueAssignments()` | `` `${row[0]}@ccckyc.edu.hk` `` | 目標學校嘅域名 |

修改後，請儲存並重新部署 Web App（新增部署版本）。

---

## 10. 安全性注意事項

| 範疇 | 目前設定 | 建議 |
|------|---------|------|
| 控制面板存取 | 「任何人」或「網域」 | 使用「網域內人員」限制至學校帳號 |
| 學生繳交存取 | 「任何人（包含匿名）」 | 可接受（方便學生使用） |
| 老師控制面板網址 | 共用連結 | 勿公開，只分享給老師 |
| 腳本授權 | 單一老師帳號 | 如有可能，使用學校專用服務帳號 |
| 試算表中嘅學生資料 | 儲存於 Drive | 確保試算表未被公開共用 |

---

## 11. 備份及復原

### 需要備份嘅項目

| 項目 | 備份方法 |
|------|---------|
| `帙雲 - 繳交紀錄及課業佈置` | 定期下載為 `.xlsx` |
| `帙雲 - 自動共用、收集位址` | 下載為 `.xlsx`（包含所有學號及資料夾連結） |
| `帙雲 - OverdueAssignments` | 按需下載 |
| Apps Script 程式碼 | 從 Apps Script 編輯器匯出 → **專案概覽 → 下載** |

### 如果資料夾意外刪除

1. 查閱 Google Drive **垃圾桶** — 檔案保留 30 天。
2. 若資料夾 ID 已更改（例如已刪除並重新建立），使用第 6 節嘅 `fixProp()` 技巧更新對應嘅使用者屬性。
3. 手動執行 `createFoldersAndUpdateSheet()` 重新建立缺失嘅子資料夾。

---

## 12. 監察核對清單

每週執行以下核對清單：

- [ ] 打開 Apps Script 觸發器面板——確認 5 個觸發器均有效
- [ ] 查閱執行日誌——檢查過去 7 天是否有「失敗」執行記錄
- [ ] 打開「帙雲 - 自動共用、收集位址」——確認 C 欄沒有持續嘅「共用失敗」記錄
- [ ] 打開「帙雲 - 繳交紀錄及課業佈置」——抽查繳交狀況顏色是否正常更新
- [ ] 打開「帙雲 - OverdueAssignments」——確認名單有定期更新
- [ ] 確認 Drive 儲存空間未接近上限（Google Drive → 設定 → 儲存空間）
- [ ] 確認 Web App 網址仍可正常存取（以無痕瀏覽器開啟測試）

---

*安裝設定指南：[setup-yue.md](./setup-yue.md)*  
*老師使用指南：[teacher-guide-yue.md](./teacher-guide-yue.md)*  
*學生使用指南：[student-guide-yue.md](./student-guide-yue.md)*
