# KOL 合作邀約信件產生器

左側輸入課程／KOL 資訊，右側即時預覽 Gmail 邀約信，資料存進資料庫，
團隊多人可以共用同一份課程資料。

## 這是什麼

- **左側表單**：收件人稱呼、課程資訊、五大亮點、圖片、講師介紹、價格、
  寄件人簽名……等信件模板裡會依課程/KOL 變動的欄位，全部可編輯。
- **右側預覽**：即時顯示套版後的信件長相（跟你原本 Gmail 那封信同一種風格：
  藍色標題、黃底強調、分隔線、簽名檔）。
- **複製 HTML**：按一下「複製 HTML」，直接貼到 Gmail 草稿內容區，格式會保留。
- **課程資料庫**：按「儲存課程」會把整份資料存進伺服器的 SQLite 資料庫，
  之後可以從右上角下拉選單載入、修改、另存新檔或刪除。因為資料存在伺服器，
  只要團隊成員都連到同一個部署好的網址，大家看到、存的都是同一份課程資料。

## 本機執行（先在自己電腦測試）

需要先安裝 [Node.js](https://nodejs.org/)（18 版以上）。

```bash
npm install
npm start
```

啟動後打開瀏覽器輸入 `http://localhost:3000` 即可使用。
課程資料會存在 `data/courses.db`（SQLite 檔案）。

## 部署到雲端，讓團隊多人共用

因為需要「團隊共用、跨裝置存取」，必須把這個專案架設到一台大家都能連到的
伺服器上（不能只在自己電腦跑）。以下是兩個對新手最簡單、有免費額度的選擇：

### 方法一：Railway（推薦，操作最簡單）

1. 到 [railway.app](https://railway.app) 註冊帳號。
2. 把這個專案資料夾上傳到一個 GitHub repository（或用 Railway CLI 直接部署，
   Railway 網站上有「Deploy from GitHub」的按鈕引導）。
3. 在 Railway 建立新專案時選擇這個 repo，Railway 會自動偵測到 `package.json`
   並執行 `npm install` + `npm start`。
4. **重要**：因為資料庫是存成本機檔案（`data/courses.db`），要記得在 Railway
   專案設定裡加一個 **Volume（持久化磁碟）**，掛載到 `/app/data`（或專案內的
   `data` 資料夾路徑），否則每次重新部署資料會不見。
5. 部署完成後 Railway 會給一個網址（例如 `xxx.up.railway.app`），把這個網址
   分享給團隊成員，大家都用這個網址就是共用同一份資料庫。

### 方法二：Render

1. 到 [render.com](https://render.com) 註冊帳號，建立一個 **Web Service**，
   連到放這個專案的 GitHub repo。
2. Build Command 填 `npm install`，Start Command 填 `npm start`。
3. 一樣需要加一個 **Persistent Disk**，掛載到專案內的 `data` 資料夾，
   資料庫檔案才不會在每次重新部署時消失。
4. 部署完成後會拿到一個網址，分享給團隊使用。

### 找不到人幫忙架設怎麼辦？

如果團隊裡沒有人熟悉部署，最快的方式是請一位比較懂技術的同事，
或是把這個資料夾丟給 Claude Code／ChatGPT 之類的工具，
照著上面步驟操作一次，通常 10-15 分鐘就能架好。之後除非需要改功能，
不然不太需要再碰。

## 專案結構

```
kol-email-builder/
├── server.js          # Express 伺服器 + API 路由
├── db.js              # SQLite 資料庫存取（課程 CRUD）
├── data/courses.db     # 資料庫檔案（第一次啟動自動建立）
├── public/
│   ├── index.html      # 頁面結構（左側表單 + 右側預覽）
│   ├── style.css        # 版面樣式
│   ├── template.js      # 信件模板渲染引擎（資料 → 完整 HTML 信件）
│   └── app.js            # 前端互動邏輯（表單綁定、存取資料庫 API、複製 HTML）
```

## 之後想調整信件模板的樣式或欄位

- 想改欄位（新增/刪除輸入欄位）：改 `public/index.html`（表單）和
  `public/template.js`（渲染邏輯）兩個地方要一起改。
- 想改信件視覺樣式（顏色、字體、間距）：改 `public/template.js` 裡面的
  inline style（因為信件要貼到 Gmail，樣式必須寫成 inline style，不能用外部
  CSS class，Gmail 才讀得到）。
