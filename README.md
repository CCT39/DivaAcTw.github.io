# 臺灣「初音未來 Project DIVA Arcade Future Tone」機台傾向分布圖

[English](#english) | [日本語](#japanese)

## 專案簡介

這是一個互動式地圖應用程式，用於展示臺灣「初音未來 Project DIVA Arcade Future Tone」機台的傾向分布。「機台差」是指與機況（如按鍵好壞、會不會卡鍵等）無關的筐體固有屬性，會影響不同歌曲在不同機台的寬或窄（即容不容易出FINE），甚至是影響 Score Attack（SA）路線是否能夠成功完走的決定性因素；而「機台傾向」是指機台差的分類光譜。

本專案旨在測試、蒐集並整理全臺各地機台的傾向，將測試結果以視覺化方式呈現於互動式地圖及光譜圖表上，方便玩家查詢各店家的機台特性。

## 主要功能

- 🗺️ **互動式地圖**：使用 Leaflet.js 顯示臺灣各地機台位置
- 📊 **光譜圖表**：使用 D3.js 視覺化呈現機台傾向分類
- 🌐 **多語言支援**：支援正體中文、英文、日文三種語言
- 📱 **響應式設計**：適配各種螢幕尺寸
- 🎨 **分類標籤**：將機台分為 13 種傾向類型（Acute、Saturator、DYE、Nyanko、愛言葉、MOP、警察、LNGN、Odds、Sound等），各類型範圍可能互有重疊
- 🎥 **影片證據**：每個機台可附上測試影片連結

## 技術架構

### 前端框架與函式庫

- **Vue 3**：主要應用框架
- **Leaflet.js**：地圖互動功能
- **D3.js**：資料視覺化圖表
- **Bootstrap 5**：UI 元件與樣式
- **Font Awesome**：圖示
- **[霞鶩文楷 TC](https://github.com/lxgw/LxgwWenkaiTC)**：中文字型（作者：[lxgw](https://github.com/lxgw)）

### 專案結構

```
DivaAcTw.github.io/
├── index.html          # 主要 HTML 頁面
├── style.css           # 樣式表
├── data.json           # 機台資料（位置、傾向、影片等）
├── js/
│   └── app.js          # Vue 3 應用程式邏輯
└── i18n/               # 國際化語言檔案
    ├── zh-TW.json      # 正體中文
    ├── en.json         # 英文
    ├── ja.json         # 日文
    └── flags/          # 語言旗幟圖示
```

## 資料格式

### data.json 結構

```json
{
  "metadata": {
    "members": {
      "admin": "計畫主導者",
      "testers": ["測試者1", "測試者2"],
      "techSupport": ["技術支援者"]
    },
    "lastUpdated": "2025-12-31"
  },
  "range": [
    {
      "from": 0,
      "to": 14.77,
      "label": "Acute台",
      "labelKey": "acute"
    }
    // ……其他範圍定義
  ],
  "data": [
    {
      "name": "店家名稱",
      "latitude": 25.0330,
      "longitude": 121.5654,
      "type": 42.5,
      "videos": [
        // 目前這裡考慮UI簡潔而不直接放影片連結，而是採因應要求個別提供影片的模式
        {
          "title": "影片標題",
          "url": "https://..."
        }
      ],
      "evidences": [
        {
          "song": "歌曲名稱",
          "info": "測試資訊"
        }
      ]
    }
  ]
}
```

## 如何使用

### 線上瀏覽

直接訪問 GitHub Pages 網址即可使用（若已部署）。

### 本地執行

1. 複製本專案
```bash
git clone https://github.com/CCT39/DivaAcTw.github.io.git
cd DivaAcTw.github.io
```

2. 選擇以下任一方式啟動本地伺服器（因為需要載入外部 JSON 檔案）：

   **方式 A：使用 Python**
   ```bash
   python -m http.server 8000
   ```
   然後在瀏覽器開啟 `http://localhost:8000`

   **方式 B：使用 Node.js http-server**
   ```bash
   npx http-server
   ```
   然後在瀏覽器開啟 `http://localhost:8000`

   **方式 C：使用 VS Code Live Server（推薦）**
   - 在 VS Code 中安裝「Live Server」擴充功能
   - 在 VS Code 中開啟專案資料夾
   - 右鍵點擊 `index.html` → 選擇「Open with Live Server」
   - 瀏覽器會自動開啟，且修改檔案時會自動重新整理

## 資料更新

若要新增或修改機台資料：

1. 編輯 `data.json`
2. 在 `data` 陣列中新增店家資訊
3. 確保經緯度正確
4. 設定機台傾向數值（0–100，數值越小越偏 DYE 傾向，越大越偏 Freely 傾向）
5. 列出判定資料以佐證前述數值（判定資料如何對應數值請透過「聯絡方式」聯絡我）
6. 可選：附上測試影片連結

## 語言切換

語言檔案位於 `i18n/` 目錄下，包含：

- `zh-TW.json`：正體中文（預設）
- `en.json`：英文
- `ja.json`：日文

使用者選擇的語言會儲存在 localStorage 中，下次訪問時會自動載入。

## 貢獻

歡迎提供機台測試資料或技術改進建議！

## 聯絡方式

如有任何疑問請洽：CCT（[Eternal∞DIVA]CCT，X: @CCT_39）

## 授權

本專案採用 MIT 授權條款。

本專案可以被 fork 或修改。任何修改版本必須清楚標示並非作者的原始作品。

## 致謝

本專案使用了以下優秀的開源資源：
- **[霞鶩文楷 TC](https://github.com/lxgw/LxgwWenkaiTC)** by [lxgw](https://github.com/lxgw) - 優雅的開源中文字型

感謝所有提供測試資料的玩家與社群成員

---

<a name="japanese"></a>

# 台湾「初音ミク Project DIVA Arcade Future Tone」台傾向分布図

[正體中文](#top) | [English](#english)

## プロジェクト概要

これは、台湾全土の「初音ミク Project DIVA Arcade Future Tone」の台傾向分布を表示するインタラクティブマップアプリケーションです。「台差」とは、メンテの良さ（例：ボタンの反応の良さなど）とは関係なく筐体の固有属性を指し、これにより異なる曲が異なる筐体で判定が広くまたは狭くなる（つまりFINEが出やすいかどうか）、さらにはスコアタルートが完走できるかどうかに決定的な影響を与える要因となります。「台傾向」とは、台差の分類スペクトルを指す。

本プロジェクトは台湾全土の筐体の台傾向をテスト・収集・整理し、テスト結果をインタラクティブマップとスペクトルチャートで視覚化することで、プレイヤーが各店舗の筐体特性を確認できるようにすることを目的としています。

## 主要機能

- 🗺️ **インタラクティブマップ**：Leaflet.js を使用して台湾全土の筐体位置を表示
- 📊 **スペクトルチャート**：D3.js を使用して台傾向分類を視覚化
- 🌐 **多言語対応**：中国語（繁体字）、英語、日本語の3言語をサポート
- 📱 **レスポンシブデザイン**：様々な画面サイズに対応
- 🎨 **分類ラベル**：13種類の傾向タイプに分類（あきうと、サチュ、ダイ、にゃんこ、愛言葉、ますぱぺ、警察、ラスナイ、オッズ、サウンドなど）、各タイプの範囲は重複する可能性があります
- 🎥 **動画証拠**：各筐体にテスト動画リンクを添付可能

## 技術スタック

### フロントエンドフレームワーク＆ライブラリ

- **Vue 3**：メインアプリケーションフレームワーク
- **Leaflet.js**：地図インタラクション機能
- **D3.js**：データ視覚化チャート
- **Bootstrap 5**：UIコンポーネントとスタイル
- **Font Awesome**：アイコン
- **[霞鶩文楷 TC](https://github.com/lxgw/LxgwWenkaiTC)**：中国語フォント（作者：[lxgw](https://github.com/lxgw)）

### プロジェクト構造

```
DivaAcTw.github.io/
├── index.html          # メイン HTML ページ
├── style.css           # スタイルシート
├── data.json           # 筐体データ（位置、傾向、動画など）
├── js/
│   └── app.js          # Vue 3 アプリケーションロジック
└── i18n/               # 国際化言語ファイル
    ├── zh-TW.json      # 中国語（繁体字）
    ├── en.json         # 英語
    ├── ja.json         # 日本語
    └── flags/          # 言語フラグアイコン
```

## データフォーマット

### data.json 構造

```json
{
  "metadata": {
    "members": {
      "admin": "責任者",
      "testers": ["テスター1", "テスター2"],
      "techSupport": ["技術協力者"]
    },
    "lastUpdated": "2025-12-31"
  },
  "range": [
    {
      "from": 0,
      "to": 14.77,
      "label": "あきうと台",
      "labelKey": "acute"
    }
    // ……その他の範囲定義
  ],
  "data": [
    {
      "name": "店舗名",
      "latitude": 25.0330,
      "longitude": 121.5654,
      "type": 42.5,
      "videos": [
        // 現在UIの簡潔性を考慮して動画リンクを直接表示せず、要求に応じて個別に提供する方式を採用
        {
          "title": "動画タイトル",
          "url": "https://..."
        }
      ],
      "evidences": [
        {
          "song": "楽曲名",
          "info": "テスト情報"
        }
      ]
    }
  ]
}
```

## 使い方

### オンラインアクセス

GitHub Pages の URL から直接アクセスできます（デプロイ済みの場合）。

### ローカル実行

1. リポジトリをクローン
```bash
git clone https://github.com/CCT39/DivaAcTw.github.io.git
cd DivaAcTw.github.io
```

2. 以下のいずれかの方法でローカルサーバーを起動（外部JSONファイルの読み込みに必要）：

   **方法 A：Python を使用**
   ```bash
   python -m http.server 8000
   ```
   その後ブラウザで `http://localhost:8000` を開く

   **方法 B：Node.js の http-server を使用**
   ```bash
   npx http-server
   ```
   その後ブラウザで `http://localhost:8000` を開く

   **方法 C：VS Code Live Server を使用（推奨）**
   - VS Code に「Live Server」拡張機能をインストール
   - VS Code でプロジェクトフォルダを開く
   - `index.html` を右クリック → 「Open with Live Server」を選択
   - ブラウザが自動的に開き、ファイル変更時に自動リロードされます

## データ更新

データを追加または修正する場合：

1. `data.json` を編集
2. `data` 配列に店舗情報を追加
3. 緯度・経度が正確であることを確認
4. 台傾向値を設定（0–100、値が小さいほどダイ傾向、大きいほどフリーリー傾向）
5. 前述の数値を裏付ける判定データをリストアップ（判定データと数値の対応については「連絡先」からお問い合わせください）
6. オプション：テスト動画リンクを添付

## 言語切り替え

言語ファイルは `i18n/` ディレクトリに配置：

- `zh-TW.json`：中国語（繁体字）（デフォルト）
- `en.json`：英語
- `ja.json`：日本語

ユーザーの言語選択は localStorage に保存され、次回訪問時に自動的に読み込まれます。

## 貢献

テストデータや技術的な改善提案を歓迎します！

## 連絡先

お問い合わせ：CCT（[Eternal∞DIVA]CCT、X: @CCT_39）

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

本プロジェクトはforkまたは修正が可能です。修正版は作者のオリジナル作品ではないことを明記する必要があります。

## 謝辞

本プロジェクトは以下の優れたオープンソースリソースを使用しています：
- **[霞鶩文楷 TC](https://github.com/lxgw/LxgwWenkaiTC)** by [lxgw](https://github.com/lxgw) - エレガントなオープンソース中国語フォント

テストデータを提供してくださったすべてのプレイヤーとコミュニティメンバーに感謝します

---

<a name="english"></a>

# Taiwan "Hatsune Miku: Project DIVA Arcade Future Tone" Tendency Distribution Map

[正體中文](#top) | [日本語](#japanese)

## Project Overview

This is an interactive map application that visualizes the tendency distribution of "Hatsune Miku: Project DIVA Arcade Future Tone" machines across Taiwan. "Machine difference (台差)" refers to inherent characteristics of arcade cabinets that are independent of maintenance conditions (such as button responsiveness or input sticking). These differences can affect how wide or narrow certain songs feel on different machines (i.e., how easy it is to get COOLs), and may even determine whether a score attack (SA) route can be successfully completed. "Machine tendency (台傾向)" describes the classification spectrum of machine differences.

This project aims to test, collect, and categorize machine tendencies across Taiwan, presenting the results through an interactive map and spectrum chart for players to reference arcade characteristics at various locations.

## Key Features

- 🗺️ **Interactive Map**: Displays arcade locations across Taiwan using Leaflet.js
- 📊 **Spectrum Chart**: Visualizes machine tendency classifications using D3.js
- 🌐 **Multi-language Support**: Supports Traditional Chinese, English, and Japanese
- 📱 **Responsive Design**: Adapts to various screen sizes
- 🎨 **Classification Labels**: Categorizes machines into 13 tendency types (Acute, Saturator, DYE, Nyanko, Aikotoba, MOP, Police, LNGN, Odds, Sound, etc.), with ranges that may overlap
- 🎥 **Video Evidence**: Each machine can include test video links

## Tech Stack

### Frontend Frameworks & Libraries

- **Vue 3**: Main application framework
- **Leaflet.js**: Map interaction functionality
- **D3.js**: Data visualization charts
- **Bootstrap 5**: UI components and styling
- **Font Awesome**: Icons
- **[LXGW WenKai TC](https://github.com/lxgw/LxgwWenkaiTC)**: Chinese font (by [lxgw](https://github.com/lxgw))

### Project Structure

```
DivaAcTw.github.io/
├── index.html          # Main HTML page
├── style.css           # Stylesheet
├── data.json           # Machine data (location, tendency, videos, etc.)
├── js/
│   └── app.js          # Vue 3 application logic
└── i18n/               # Internationalization language files
    ├── zh-TW.json      # Traditional Chinese
    ├── en.json         # English
    ├── ja.json         # Japanese
    └── flags/          # Language flag icons
```

## Data Format

### data.json Structure

```json
{
  "metadata": {
    "members": {
      "admin": "Project Leader",
      "testers": ["Tester1", "Tester2"],
      "techSupport": ["Tech Support"]
    },
    "lastUpdated": "2025-12-31"
  },
  "range": [
    {
      "from": 0,
      "to": 14.77,
      "label": "Acute",
      "labelKey": "acute"
    }
    // ... other range definitions
  ],
  "data": [
    {
      "name": "Store Name",
      "latitude": 25.0330,
      "longitude": 121.5654,
      "type": 42.5,
      "videos": [
        // Currently not directly displaying video links for UI simplicity, providing videos individually upon request
        {
          "title": "Video Title",
          "url": "https://..."
        }
      ],
      "evidences": [
        {
          "song": "Song Name",
          "info": "Test Information"
        }
      ]
    }
  ]
}
```

## How to Use

### Online Access

Access directly via GitHub Pages URL (if deployed).

### Local Development

1. Clone the repository
```bash
git clone https://github.com/CCT39/DivaAcTw.github.io.git
cd DivaAcTw.github.io
```

2. Choose one of the following methods to start a local server (required for loading external JSON files):

   **Method A: Using Python**
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser

   **Method B: Using Node.js http-server**
   ```bash
   npx http-server
   ```
   Then open `http://localhost:8000` in your browser

   **Method C: Using VS Code Live Server (Recommended)**
   - Install the "Live Server" extension in VS Code
   - Open the project folder in VS Code
   - Right-click on `index.html` → Select "Open with Live Server"
   - The browser will open automatically and auto-refresh when files are modified

## Data Updates

To add or modify machine data:

1. Edit `data.json`
2. Add store information to the `data` array
3. Ensure latitude and longitude are correct
4. Set machine tendency value (0–100, lower values indicate DYE tendency, higher values indicate Freely tendency)
5. List judgment data to support the aforementioned value (for how judgment data corresponds to values, please contact me through "Contact")
6. Optional: Include test video links

## Language Switching

Language files are located in the `i18n/` directory:

- `zh-TW.json`: Traditional Chinese (default)
- `en.json`: English
- `ja.json`: Japanese

The user's language preference is stored in localStorage and automatically loaded on subsequent visits.

## Contributing

Contributions of machine test data or technical improvements are welcome!

## Contact

For any inquiries, contact: CCT ([Eternal∞DIVA]CCT, X: @CCT_39)

## License

This project is licensed under the MIT License.

This project may be forked or modified. Any modified version must clearly indicate that it is not the original work by the author.

## Acknowledgments

This project uses the following excellent open-source resources:
- **[LXGW WenKai TC](https://github.com/lxgw/LxgwWenkaiTC)** by [lxgw](https://github.com/lxgw) - An elegant open-source Chinese font

Thanks to all players and community members who contributed test data