# 評量偵探室 — 投影片同步版 v2

本版以 **《特殊教育學生評量：語言、溝通與知覺動作評量》15頁簡報** 為唯一題目依據，網站不額外發明案例。已把你提供的 Apps Script `/exec` 網址填進 `site/config.js`。**但這不代表你的雲端 Apps Script 程式已由我們更新**：需要按下列方式把新後端程式部署出去，GitHub 網站才能把答案寫入 Google Sheet。

## 投影片與網站對照

| 網站任務 | 簡報頁碼 | 內容及作答 |
|---|---|---|
| 1．暖身觀察 | 02 | 三種情境擇一，寫「我會先確認哪一件事？」 |
| 2．小安｜語言溝通 | 07–08 | **選項與第07頁完全一致**，A 是否理解老師的問題／B 有哪些可用的表達方式／C 不同對象是否有主動溝通／D 以上都需要確認；寫理由 |
| 3．小芸｜知覺動作 | 10–11 | **選項與第10頁完全一致**，A 圖形配對／B 手指沿線／C 比較剪直線、固定紙張後剪線／D 以上皆有線索；寫理由 |
| 4．小組評量設計 | 13–14 | 小沐／小晨／小晴三擇一，填觀察事實、待釐清能力、兩種蒐證方式、紀錄指標 |
| 5．課堂出口票 | 15 | 「我最想回到班上觀察＿＿；我會用＿＿來蒐集證據。」 |

## 檔案目錄

- `site/index.html`：遊戲首頁，放 GitHub Pages 根目錄
- `site/style.css`：頁面設計
- `site/app.js`：題目、答題、統計、教師看板
- `site/config.js`：**已含你給的 Apps Script /exec URL**；可公開，但不可以放教師密碼
- `backend/Code.gs`：新版 Google Apps Script 後端，**必須貼回既有 Apps Script 並重新部署版本**
- `VERSION.txt`：用來確認本次版本

## 部署一｜更新 Google Apps Script（這步不可省略）

**你目前已經有 Apps Script 網址，因此建議更新現有的部署，不必新建。**

1. 開啟原本 Apps Script 專案，在現有 `Code.gs` 頂端先複製並保留你個人的 `SPREADSHEET_ID` 與 `HOST_PIN`（密碼不要貼給學員）。
2. 用這次壓縮檔 `backend/Code.gs` 的**全部內容**取代舊版程式。
3. 把剛才保留的 **純試算表 ID** 與 **教師密碼** 放回 `var SETTINGS = {...}`。請保留 `ROOM_CODE: 'assessment-lab-2026'` 與網站一致。
4. 儲存後，從 Apps Script 上方函式清單選 `setup` → 執行。第一次授權時依指示核准。
5. 既有 Google Sheet 會新增 `SlidesAnswers`、`SlidesHistory` 兩個分頁。**舊版 `Answers`、`History` 不會被刪掉或混用**。原本的 `Participants`、`Settings` 繼續使用。
6. 點 **部署 → 管理部署作業 → 編輯既有 Web App → 版本選擇「新增版本」→ 部署**。這步才會讓原 `/exec` 網址執行新的題目。單純按 Apps Script「儲存」不會更新 `/exec` 正式部署版本。
7. 開啟下面的連線檢查網址（把它完整貼到瀏覽器）。成功時應看到 `"ok":true` 與 `"version":"slidesync-2026-11-v2"`。

```
https://script.google.com/macros/s/AKfycbySeOSaKYMSDem6ItsI4ErfK7qIxgpIzMFNUu53xg7td7kZVzmvQM28w-RysXXml-zvHQ/exec?action=health&room=assessment-lab-2026
```

若 `version` 不符，表示仍在執行舊部署版。若出現權限錯誤，請回到 Web App 相關部署設定（通常執行身分＝我、存取者＝任何人；實際以學校政策為準）。

## 部署二｜更新 GitHub Pages

1. 解壓縮 `github_pages_slide_sync_v2.zip`，取出四個檔案 `index.html`、`style.css`、`app.js`、`config.js`。
2. 在你 GitHub repository 的**根目錄**，把這四個檔案上傳並覆蓋舊版本。
3. Settings → Pages 使用 `Deploy from a branch`、`main`、`/(root)`，確認已完成發布。
4. 開啟 GitHub Pages 網址；因前端檔案可能快取，建議強制重新整理。如果顯示「Apps Script 還是舊版」，請先完成上方「部署一」。
5. **學員網址**：一般 GitHub Pages 網址；**教師網址**：一般網址後方接 `?mode=host`。

## 上課使用

- 老師輸入自己的姓名（2–30字），相同姓名可以跨裝置重新登入並修改最新回答。同名人士請加個人識別字，因只用姓名並不是真正帳號驗證。
- 每個任務儲存最新答案於 `SlidesAnswers`，每次修改紀錄於 `SlidesHistory`。
- 教師看板可看完成名單、公布每關統計、獨立開放文字回應，以及匯出 CSV。
- **建議預計人數設 0**，由你每題講解前手動公布。若填特定人數則當該題人數達標時自動開放。
- 只有當學員勾選願意公開、**且**教師同意開放文字，其他學員才看到姓名與該題文字。
- 正式上課前以兩個不同瀏覽器／裝置用兩個測試姓名試作答，再回教師看板確認記錄、結果公布及重登入更新流程。
- 請使用虛構幼兒案例，不要讓學員輸入可識別真實幼兒的個資。GitHub Pages 與公開 Web App 配合姓名辨識，適合課堂練習，不適合儲存正式評量個資。

## 容易遇到的錯誤

- **網頁顯示 404**：檢查 `index.html` 是否真的在 GitHub repository 根目錄，以及 Pages 的分支／根目錄設定。
- **Google Apps Script 還是舊版**：新版前端會檢查 `version`，避免新舊題目資料混用。回 Apps Script 管理部署作業選 **新增版本**。
- **找不到 SlidesAnswers**：忘了執行新版 `setup()`。
- **SPREADSHEET_ID 格式錯誤**：只能複製試算表網址中 `/d/` 與 `/edit` 間的純 ID。
- **寫入逾時**：檢查 Apps Script 的網頁應用程式公開權限，或 Google Apps Script 執行紀錄；不要假設 POST 無回應就一定儲存失敗。
- **姓名相同被覆蓋**：同名老師需要加上識別字，系統用同姓名讀取同一筆最新回答。

## 測試限制

前端介面與模擬試算表的後端邏輯可在本機測試。實際使用者提供的 Apps Script 雲端專案、Google Sheet 及 GitHub repository 尚無登入權限可以直接變更，因此必須由你依上述步驟更新與核准；在完成前不能宣稱雲端寫入已通過實測。
