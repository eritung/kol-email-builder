# KOL 合作邀約信件產生器

左側輸入課程／KOL 資訊，右側即時預覽 Gmail 邀約信，資料存進 **Supabase**
資料庫，團隊多人可以跨裝置共用同一份課程資料。純前端網頁，不需要自己架
Node 伺服器。

## 這是什麼

- **左側表單**：收件人稱呼、課程資訊、五大亮點、圖片、講師介紹、價格、
  寄件人簽名……等信件模板裡會依課程/KOL 變動的欄位，全部可編輯。
- **右側預覽**：即時顯示套版後的信件長相（藍色標題、黃底強調、分隔線、
  簽名檔，跟原本 Gmail 那封信同一種風格）。
- **複製 HTML**：按一下「複製 HTML」，直接貼到 Gmail 草稿內容區，格式會保留。
- **課程資料庫（Supabase）**：按「儲存課程」會把整份表單資料存進 Supabase
  的 Postgres 資料庫，之後可以從右上角下拉選單載入、修改、另存新檔或刪除。
  因為資料存在雲端的 Supabase，只要把這個網頁放到大家都能連到的地方
  （見下方「怎麼給團隊用」），所有人看到、存的都是同一份課程資料。

## 三步驟設定 Supabase

### 1. 建立資料表

打開你的 Supabase 專案 → 左側選單 **SQL Editor** → 貼上專案裡的
`supabase.sql` 整份內容 → 按 **Run**。這會建立 `courses` 資料表，
並設定好存取權限（詳見 `supabase.sql` 裡的說明註解）。

### 2. 拿到連線金鑰

Supabase 專案 → **Project Settings → Data API**：
- 複製 **Project URL**（長得像 `https://xxxxxxxxxxxx.supabase.co`）
- 複製 **anon public** 金鑰（不是 `service_role`！那把權限太高，絕對不能放進前端）

### 3. 填進 config.js

打開 `public/config.js`，把上面兩個值貼進去：

```js
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJxxxxxxxxxxxxxxxxxxxx...';
```

存檔後重新整理網頁，右上角的課程下拉選單就會開始正常運作。

## 本機測試

不需要安裝任何套件，是純 HTML/CSS/JS 網頁，兩種開法都可以：

**方法 A：直接雙擊開啟**
直接用瀏覽器打開 `public/index.html` 即可（因為沒有自己的後端 API，
只有呼叫 Supabase 的雲端網址，用 `file://` 打開通常就能正常運作）。

**方法 B：用本機小伺服器開（如果方法 A 遇到瀏覽器限制）**

```bash
npm run dev
```

會在 `http://localhost:3000` 開啟。

## 怎麼給團隊用（部署成大家都能連的網址）

因為是純前端網頁，最簡單的方式是丟到免費的靜態網站託管服務，
**不需要架 Node 伺服器、不需要處理資料庫掛載**（資料已經在 Supabase 上了）。

### 最簡單：Netlify 拖拉部署

1. 到 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 把整個 `public` 資料夾拖進網頁裡
3. 幾秒後會拿到一個網址（例如 `xxx.netlify.app`），分享給團隊就完成了

之後要更新網頁內容，重新拖拉一次 `public` 資料夾上傳即可
（課程資料本身不受影響，因為存在 Supabase，不是存在網站裡）。

### 其他選擇

也可以用 [Vercel](https://vercel.com)、[GitHub Pages](https://pages.github.com/)
等靜態網站託管服務，做法大同小異：把 `public` 資料夾內容部署上去即可。

## 專案結構

```
kol-email-builder/
├── supabase.sql        # 到 Supabase SQL Editor 執行一次，建立資料表與權限
├── package.json         # 只有本機測試用的 npm run dev，不影響部署
└── public/               # 這個資料夾就是整個網站，部署時把這個資料夾丟上去
    ├── index.html          # 頁面結構（左側表單 + 右側預覽）
    ├── style.css            # 版面樣式
    ├── config.js             # 你的 Supabase 網址與 anon key（需要自己填）
    ├── template.js            # 信件模板渲染引擎（資料 → 完整 HTML 信件）
    └── app.js                  # 前端互動邏輯（表單綁定、存取 Supabase、複製 HTML）
```

## 安全性小提醒

`config.js` 裡的 anon key 會整個曝露在網頁原始碼裡（這是 Supabase 前端
連線的正常設計，anon key 本身不算機密）。但目前 `supabase.sql` 設定的權限
是「只要有網址+anon key 就能讀寫課程資料」，沒有帳號登入機制。

這代表：如果你把這個網站網址分享出去（例如貼到公開的地方），理論上任何
拿得到網址和 anon key 的人都能修改或刪除課程資料。對「內部行銷團隊用的
小工具、資料只是課程介紹文案」這種情境通常還好，但如果之後想要「只有登入
的同事才能編輯」，可以加上 Supabase Auth（Email 帳密登入），並把
`supabase.sql` 裡的存取權限政策改成只允許 `auth.role() = 'authenticated'`。
需要的話可以再跟我說，我可以幫你加上登入功能。

## 之後想調整信件模板的樣式或欄位

- 想改欄位（新增/刪除輸入欄位）：改 `public/index.html`（表單）和
  `public/template.js`（渲染邏輯）兩個地方要一起改。
- 想改資料庫欄位：因為整份表單是存成一個 `data`（jsonb）欄位，不需要改
  Supabase 資料表結構，直接改前端欄位就會自動存進去。
- 想改信件視覺樣式（顏色、字體、間距）：改 `public/template.js` 裡面的
  inline style（因為信件要貼到 Gmail，樣式必須寫成 inline style，不能用外部
  CSS class，Gmail 才讀得到）。
