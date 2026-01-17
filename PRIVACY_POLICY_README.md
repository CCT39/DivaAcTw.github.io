# 隱私權政策實施說明

## 已完成的工作

### 1. 創建隱私權政策頁面
- **檔案位置**：`privacy-policy.html`
- **功能特點**：
  - 完整的三語支援（繁體中文、英文、日文）
  - 響應式設計，適配各種裝置
  - 獨立的語言切換功能
  - 清晰的版面設計和排版

### 2. 隱私權政策內容

根據 Google 的政策要求，隱私權政策包含以下關鍵部分：

#### A. Google Analytics 4 (GA4) 數據收集
- 明確說明使用 GA4 分析流量
- 列出收集的數據類型（頁面瀏覽、停留時間、裝置資訊等）
- 強調數據為匿名且不包含個人識別資訊

#### B. Google 信號 (Google Signals)
- **重要**：目前未啟用 Google 信號廣告功能
- 若將來要啟用，須解釋可能收集的資訊（性別、年齡層、興趣、跨裝置活動）
- 若將來要啟用，須提供管理和退出的方式

#### C. GitHub Pages 託管
- 說明 GitHub Pages 可能收集的伺服器日誌
- 連結到 GitHub 隱私權聲明

#### D. 使用者權利與選擇（Opt-out）
- 提供 Google Analytics 不顯示瀏覽器外掛連結
- 說明 Cookie 管理方式
- 提供 Google 廣告設定連結

#### E. 其他法律要求
- 資料安全說明
- 兒童隱私保護
- 政策變更通知
- 聯絡資訊

### 3. 主頁面整合
- 在主頁面 `index.html` 的資訊按鈕區域新增隱私權政策按鈕
- 使用盾牌圖示（🛡️）作為視覺標識
- 按鈕會在新視窗開啟隱私權政策頁面

### 4. 多語言支援
已更新以下語言文件：
- `i18n/zh-TW.json` - 繁體中文
- `i18n/en.json` - 英文
- `i18n/ja.json` - 日文

## 符合 Google 政策的關鍵點

### ✅ GA4 必須揭露的資訊
1. 明確告知使用 Google Analytics
2. 說明收集的數據類型
3. 解釋數據用途（改善網站體驗）
4. 提供退出機制

### ✅ Google Signals 必須揭露的資訊 （目前未啟用）
1. **須明確說明啟用 Google 信號功能**
2. **說明可能收集與 Google 帳號關聯的資訊**
3. **列出可能收集的人口統計資訊**
4. **提供退出方式（Google 廣告設定）**

### ✅ 第三方服務揭露
1. 提供 Google 隱私權政策連結
2. 說明 GitHub Pages 資料處理
3. 提供相關隱私權聲明連結

### ✅ 使用者控制權
1. 提供 Google Analytics Opt-out 外掛連結
2. 說明 Cookie 管理方式
3. 提供 Google 廣告設定連結

## 使用方式

### 對訪客
1. 訪客可以在主頁面右下角看到三個圖示按鈕
2. 點擊盾牌圖示（🛡️）即可查看隱私權政策
3. 隱私權政策頁面支援語言切換

### 對管理員
1. **部署**：將 `privacy-policy.html` 一起推送到 GitHub Pages
2. **更新日期**：如需更新隱私權政策，記得修改頁面中的「最後更新日期」
3. **Google Analytics 設定**：
   - 確認已在 GA4 中啟用 Google 信號
   - 確認已配置所需的資料收集設定

## Google Signals 啟用步驟

若欲啟用 Google Signals，請按照以下步驟：

1. 登入 Google Analytics 4
2. 進入「管理」→「資料設定」→「資料收集」
3. 啟用「Google 信號資料收集」
4. 閱讀並同意條款

## 重要連結

- [Google Analytics Opt-out 外掛](https://tools.google.com/dlpage/gaoptout)
- [Google 隱私權政策](https://policies.google.com/privacy)
- [Google Analytics 服務條款](https://support.google.com/analytics/answer/6004245)
- [Google 廣告設定](https://adssettings.google.com/)
- [GitHub 隱私權聲明](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

## 維護建議

1. **定期檢查**：每 6–12 個月檢查一次隱私權政策是否需要更新
2. **政策變更**：如果 Google 或 GitHub 的政策有重大變更，應更新對應內容
3. **新功能**：如果網站增加新的追蹤或分析功能，必須更新隱私權政策
4. **法規遵循**：注意相關地區的隱私保護法規（如 GDPR、CCPA 等）

## 檔案清單

```
/
├── index.html (已修改 - 新增隱私權政策按鈕)
├── privacy-policy.html (新增)
├── style.css (已修改 - 更新按鈕樣式)
├── i18n/
│   ├── zh-TW.json (已修改)
│   ├── en.json (已修改)
│   └── ja.json (已修改)
└── PRIVACY_POLICY_README.md (本文件)
```

## 問題排查

### 按鈕沒有顯示？
- 檢查 `i18n/*.json` 檔案是否正確更新
- 確認瀏覽器快取已清除

### 樣式不正確？
- 確認 `style.css` 已正確更新
- 清除瀏覽器快取並重新載入

### 隱私權政策頁面無法開啟？
- 確認 `privacy-policy.html` 已部署到 GitHub Pages
- 檢查檔案路徑是否正確

---

**最後更新日期**：2026年01月17日
**建立者**：CCT
