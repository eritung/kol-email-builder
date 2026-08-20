// ===== Supabase 連線設定 =====
// 把下面兩個值換成你自己 Supabase 專案的資訊：
// 1. 登入 https://supabase.com/dashboard，打開你的專案
// 2. 左側選單 Project Settings → Data API，複製「Project URL」貼到 SUPABASE_URL
// 3. 同一頁（或 Project Settings → API Keys）複製「anon public」金鑰貼到 SUPABASE_ANON_KEY
//    （不要複製 service_role 金鑰，那把金鑰有完整權限、絕對不能放進前端程式碼！）
//
// 這個 anon key 是「設計成可以公開放在前端」的金鑰，本身不是機密，
// 但因為資料表的存取權限（RLS policy，見 supabase.sql）預設是開放讀寫，
// 等於「知道網址+這把 anon key 的人都能讀寫課程資料」。
// 如果之後想要有登入驗證才能編輯，可以再加上 Supabase Auth。

const SUPABASE_URL = 'https://qlwltmrismacicpatvxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2x0bXJpc21hY2ljcGF0dnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDYxMzEsImV4cCI6MjEwMjgyMjEzMX0.lwJl8p9a6D3o46AXnY-Dz7BEmiMPJ2RE3xQX0DOYlvs';
