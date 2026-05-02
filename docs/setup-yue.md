# 帙雲 — 開發者安裝設定指南

> **語言：** 粵語（繁體中文） | [English version → setup-en.md](./setup-en.md)

本指南帶領開發者完成複製代碼庫、將專案部署至 Google Apps Script，以及完成系統初始化安裝的每個步驟。請按順序執行。

---

## 目錄

1. [前置條件](#1-前置條件)
2. [代碼庫結構](#2-代碼庫結構)
3. [方法一 — 透過 Apps Script 編輯器手動設定](#3-方法一--透過-apps-script-編輯器手動設定)
4. [方法二 — clasp（命令行工作流）](#4-方法二--clasp命令行工作流)
5. [啟用 Drive API v3 進階服務](#5-啟用-drive-api-v3-進階服務)
6. [部署為 Web App](#6-部署為-web-app)
7. [執行安裝嚮導](#7-執行安裝嚮導)
8. [初始設定](#8-初始設定)
9. [自訂電郵域名](#9-自訂電郵域名)
10. [驗證部署](#10-驗證部署)
11. [修改及重新部署](#11-修改及重新部署)
12. [常見問題](#12-常見問題)

---

## 1. 前置條件

| 需求 | 備注 |
|------|------|
| Google 帳號 | 必須擁有用於安裝系統嘅 Google Drive |
| Google Workspace（可選） | 建議學校部署時使用；Drive API v3 進階服務在所有帳號上均可使用 |
| Node.js ≥ 18 | 僅**方法二（clasp）**工作流需要 |
| `git` | 用於複製代碼庫 |
| GitHub 訪問權限 | 用於複製 `kychugo/homework-submission-system` |

> 系統完全運行於 Google Apps Script 之上——無需服務器、數據庫或任何付費基礎設施。

---

## 2. 代碼庫結構

```
homework-submission-system/
├── code.gs          主腳本：Web App 入口、觸發器、所有業務邏輯
├── setup.gs         安裝嚮導函數（onOpen 選單、installZhiyun）
├── record.gs        繳交紀錄儀表板嘅服務器端數據提供者
├── Index.html       老師控制面板（根目錄 URL）
├── homework.html    布置課業表格（?page=homework）
├── student.html     學生繳交介面（?page=submit）
├── record.html      繳交狀況儀表板（?page=record）
├── config.html      類別/科目設定面板（?page=config）
├── autoshare.html   自動共用管理面板（?page=autoshare）
└── docs/            文件（本文件存放於此）
```

### 安裝時建立嘅 Google 資源

| 資源 | 名稱 |
|------|------|
| Drive 根資料夾 | `📁 帙雲` |
| 上傳資料夾 | `1. 上傳課業Link（學生）` |
| 待批改資料夾 | `2. 待批改課業` |
| 老師回饋資料夾 | `3. 老師回饋區` |
| 已發還資料夾 | `4. 已發還課業` |
| 繳交紀錄試算表 | `帙雲 - 繳交紀錄及課業佈置` |
| 自動共用試算表 | `帙雲 - 自動共用、收集位址` |
| 逾期名單試算表 | `帙雲 - OverdueAssignments` |

---

## 3. 方法一 — 透過 Apps Script 編輯器手動設定

此方法最簡單，只需要瀏覽器，無需任何本地工具。

### 第一步 — 建立 Google 試算表（安裝檔）

1. 前往 [Google Sheets](https://sheets.google.com) 並建立一個**新的空白試算表**。
2. 為其命名，例如 `帙雲 安裝檔`。

### 第二步 — 開啟 Apps Script 編輯器

1. 在試算表中，點擊 **「擴充功能」 → 「Apps Script」**。
2. Apps Script IDE 將在新分頁中開啟。

### 第三步 — 複製源碼文件

對代碼庫中嘅每個文件，在 Apps Script 專案中建立對應文件：

#### 腳本文件（`.gs`）

專案預設有一個腳本文件（`Code.gs`），需要增加更多。

1. **替換 `Code.gs`** 為代碼庫中 `code.gs` 嘅內容：
   - 點擊默認嘅 `Code.gs` 文件。
   - 全選（Ctrl+A / Cmd+A）並刪除所有內容。
   - 貼上 `code.gs` 嘅完整內容。

2. **新增 `setup.gs`**：
   - 點擊「文件」旁嘅 **「+」 → 「腳本」**。
   - 命名為 `setup`（Apps Script 會自動加上 `.gs`）。
   - 貼上 `setup.gs` 嘅完整內容。

3. **新增 `record.gs`**：
   - 重複上述步驟，命名為 `record`，貼上 `record.gs` 嘅內容。

#### HTML 文件

對每個 `.html` 文件，點擊「文件」旁嘅 **「+」 → 「HTML」**，輸入名稱（不含 `.html` 副檔名），並貼上對應內容：

| Apps Script 文件名 | 源碼文件 |
|-------------------|---------|
| `Index` | `Index.html` |
| `homework` | `homework.html` |
| `student` | `student.html` |
| `record` | `record.html` |
| `config` | `config.html` |
| `autoshare` | `autoshare.html` |

> ⚠️ Apps Script 中文件名**區分大小寫**。請使用上表所示嘅確切名稱。

### 第四步 — 儲存專案

點擊 **💾 儲存**按鈕（或按 Ctrl+S / Cmd+S）。部署前必須儲存所有文件。

---

## 4. 方法二 — clasp（命令行工作流）

[clasp](https://github.com/google/clasp) 是 Google 官方嘅 Apps Script 命令行工具。若你想在本地開發並透過 Git 推送更改，請使用此方法。

### 第一步 — 安裝 clasp

```bash
npm install -g @google/clasp
```

### 第二步 — 啟用 Apps Script API

1. 前往 [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)。
2. 將 **"Google Apps Script API"** 切換為 **開啟**。

### 第三步 — 登入

```bash
clasp login
```

瀏覽器會開啟 Google OAuth 授權頁面，使用用於部署嘅 Google 帳號進行授權。

### 第四步 — 複製代碼庫

```bash
git clone https://github.com/kychugo/homework-submission-system.git
cd homework-submission-system
```

### 第五步 — 建立連結至試算表嘅 Apps Script 專案

1. 建立一個空白 Google 試算表（同方法一第一步）。
2. 從 URL 中複製試算表 ID：
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. 建立 Apps Script 專案：
   ```bash
   clasp create --type sheets --parentId SPREADSHEET_ID --title "帙雲 安裝檔"
   ```
   此命令會在當前目錄建立 `.clasp.json` 文件。

### 第六步 — 設定 `.clasp.json`

確保 `.clasp.json` 內容如下（`scriptId` 由 clasp 自動填入）：

```json
{
  "scriptId": "<YOUR_SCRIPT_ID>",
  "rootDir": "."
}
```

### 第七步 — 推送文件至 Apps Script

```bash
clasp push
```

clasp 使用 `appsscript.json` 清單文件。若代碼庫未包含此文件，在專案根目錄建立一個最小化嘅 `appsscript.json`：

```json
{
  "timeZone": "Asia/Hong_Kong",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Drive",
        "version": "v3",
        "serviceId": "drive"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

然後再次推送：

```bash
clasp push
```

> **提示：** 開發期間可執行 `clasp push --watch`，在每次保存文件時自動推送。

---

## 5. 啟用 Drive API v3 進階服務

自動共用功能需要 Drive API v3 進階服務。無論使用哪種設定方法，都必須在 Apps Script 編輯器中**手動**啟用。

1. 打開 Apps Script 編輯器。
2. 在左側邊欄，點擊 **「服務」**（`+` 圖示）。
3. 在列表中找到 **"Drive API"**。
4. 確認版本設為 **`v3`**。
5. 點擊 **「新增」**。

若跳過此步驟，資料夾共用將失敗，報錯：`Exception: Drive is not defined`。

---

## 6. 部署為 Web App

1. 在 Apps Script 編輯器中，點擊 **「部署」 → 「新增部署作業」**。
2. 點擊「選取類型」旁嘅 **⚙️ 齒輪圖示**，選擇 **「網頁應用程式」**。
3. 配置以下設定：

   | 設定 | 建議值 |
   |------|--------|
   | 說明 | `v1`（或任何版本標籤） |
   | 執行身分 | **我（Me）** — 即擁有試算表嘅帳號 |
   | 有權存取的使用者 | **所有人（Anyone）** — 學生無需登入即可提交 |

4. 點擊 **「部署」**。
5. **複製 Web App URL** — 老師控制面板及學生繳交連結均需要此 URL。

> ⚠️ **「執行身分：我」**設定意味著腳本以你嘅 Google 帳號權限執行。若之後刪除或移動資料夾，可能需要更新使用者屬性（詳見[技術人員指南](./technician-guide-yue.md)）。

---

## 7. 執行安裝嚮導

安裝嚮導會自動建立所有所需嘅 Drive 資料夾及試算表。

1. 返回安裝檔試算表（第一步/第五步建立嘅試算表）。
2. 重新整理頁面，菜單欄會出現 **「☁️ 帙雲系統」** 選單。
3. 點擊 **「☁️ 帙雲系統」 → 「🚀 一鍵初始化系統 (僅初次執行)」**。
4. 出現權限提示時，點擊 **「審查權限」** 並授予所有所需權限。
5. 點擊確認對話框中嘅 **「確定」**。
6. 等待約 60 秒讓嚮導完成。
7. 成功後，試算表將填入所有已建立資源嘅連結。

### 嚮導建立嘅資源

```
📁 帙雲/
├── 1. 上傳課業Link（學生）/
├── 2. 待批改課業/
├── 3. 老師回饋區/
├── 4. 已發還課業/
├── 帙雲 - 繳交紀錄及課業佈置  （Google 試算表）
├── 帙雲 - 自動共用、收集位址   （Google 試算表）
├── 帙雲 - OverdueAssignments   （Google 試算表）
└── [安裝檔試算表]             （自動移入此資料夾）
```

同時會設定 **5 個時間驅動觸發器**：

| 函數 | 頻率 |
|------|------|
| `sortStudentAssignments` | 每 1 分鐘 |
| `distributeHomework` | 每 15 分鐘 |
| `createFoldersAndUpdateSheet` | 每 5 分鐘 |
| `generateOverdueAssignments` | 每 1 分鐘 |
| `autoShareStudentFolders` | 每 5 分鐘 |

---

## 8. 初始設定

### 在繳交紀錄試算表中新增學生

1. 打開 `帙雲 - 繳交紀錄及課業佈置`。
2. 第一個頁籤已命名為 `1A`，A4 儲存格有測試學生（`陳大文`）。替換或擴充此資料：
   - **A1**：班別名稱（例如 `1A`）
   - **A4 起**：每行一個學生姓名
3. 如需新增班別，點擊底部 **+** 新增頁籤，以班別名稱命名（例如 `2B`），在 **A1** 填入 `2B`，然後從 A4 開始列出學生名單。

### 登記學生以自動共用資料夾

1. 打開 `帙雲 - 自動共用、收集位址`。
2. 從第 2 行起，每行填入一個學生：
   - **A 欄**：學號（例如 `s001`）
   - **B 欄**：學生全名（必須與繳交紀錄試算表中嘅名稱完全一致）
   - **C 欄**：留空——系統會自動填入資料夾 URL

### 分享學生繳交連結

使用第六步中複製嘅 Web App URL，加上 `?page=submit`：
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=submit
```

將此 URL 分享給學生。根目錄 URL（`…/exec`）僅供老師使用，請勿公開。

---

## 9. 自訂電郵域名

系統預設使用 `ccckyc.edu.hk` 域名。如需為其他學校部署，請在 `code.gs` 中更新兩個位置：

```javascript
// 在 autoShareStudentFolders() 中：
const email = `${studentId}@YOUR_SCHOOL_DOMAIN`;

// 在 generateOverdueAssignments() 中：
// 更新電郵欄位嘅值以使用你的域名
```

修改後，**儲存**並**重新部署 Web App**（建立新版本）：
1. 點擊 **「部署」 → 「管理部署作業」**。
2. 點擊現有部署旁嘅 **✏️ 鉛筆圖示**。
3. 將版本改為 **「新版本」**。
4. 點擊 **「部署」**。

---

## 10. 驗證部署

完成設定後，執行以下核對清單：

- [ ] 在瀏覽器中開啟**老師控制面板 URL** — 應正常載入，不出現「系統尚未初始化」錯誤
- [ ] 確認 `📁 帙雲` 資料夾內有全部 4 個子資料夾
- [ ] 打開 **Apps Script 觸發器面板**，確認列出 5 個觸發器
- [ ] 在無痕視窗中開啟**學生繳交連結**（`?page=submit`） — 繳交表格應正常載入
- [ ] 確認**「帙雲 - 繳交紀錄及課業佈置」**有正確嘅班別頁籤及學生名單
- [ ] 透過控制面板 → **「課業設置」** 布置一份測試課業，等待 5 分鐘 — 對應資料夾應出現於 `2. 待批改課業` 中

---

## 11. 修改及重新部署

### clasp 工作流

```bash
# 在本地編輯文件
clasp push           # 推送更改至 Apps Script
# 然後在 Apps Script 編輯器介面中重新部署
```

### 純瀏覽器工作流

1. 直接在 Apps Script 編輯器中編輯文件。
2. 儲存（Ctrl+S / Cmd+S）。
3. 建立新版本重新部署（步驟見第 9 節）。

> ⚠️ 現有嘅 Web App URL **不會**自動使用新代碼，直至你建立新嘅部署版本。每次部署功能性更改時，務必建立新版本。

### 手動執行函數進行測試

在 Apps Script 編輯器中，從函數下拉選單中選擇函數名稱，然後點擊 **「執行」** 即可立即執行。這對測試 `sortStudentAssignments`、`distributeHomework` 等函數（無需等待觸發器）非常有用。

---

## 12. 常見問題

| 問題 | 可能原因 | 解決方法 |
|------|---------|--------|
| Web App 顯示「系統尚未初始化」 | 安裝嚮導未執行 | 透過試算表選單執行 `installZhiyun()` |
| 重新執行後提示已安裝 | `IS_INSTALLED` 標誌仍存在 | 先執行 **「⚠️ 重置安裝狀態」**，再重新安裝 |
| 報錯 `Drive is not defined` | Drive API v3 服務未啟用 | 在 Apps Script → 服務 中啟用（見第 5 節） |
| 觸發器未執行 | 觸發器面板為空 | 在編輯器中手動執行 `setupTriggers()` |
| 上傳後文件未被分類 | 檔案命名格式錯誤 | 文件名必須包含有效班別（例如 `1A`） |
| 自動共用顯示「共用失敗」 | 學生電郵不存在 | 確認學號及域名正確 |
| clasp push 報授權錯誤 | 登入會話已過期 | 重新執行 `clasp login` |
| Web App 返回 403 | 「有權存取的使用者」設定錯誤 | 以「所有人」訪問權限重新部署 |

---

*老師日常使用指南：[teacher-guide-yue.md](./teacher-guide-yue.md)*  
*學生使用指南：[student-guide-yue.md](./student-guide-yue.md)*  
*系統持續監察指南：[technician-guide-yue.md](./technician-guide-yue.md)*
