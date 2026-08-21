// ===== 信件範本渲染引擎 =====
// 這個檔案負責：把左側表單填的資料（data 物件），轉成跟 Eri 原本
// Gmail 邀約信長得一樣風格的完整 HTML（藍色標題、黃底強調、分隔線、簽名檔...）。
// 右側預覽 iframe 跟「複製 HTML」按鈕都是呼叫 renderEmailHTML(data)。
//
// 字體設定：內文統一用 <font face="ms pgothic, sans-serif">，
// 只有「Sincerely」署名那行用 <font face="garamond, times new roman, serif">，
// 這是照 Eri 在 Gmail 裡實際編輯過、確認過的版本設定的，不要隨意改動。

const BODY_FONT = 'ms pgothic, sans-serif';
const SIGNOFF_FONT = 'garamond, times new roman, serif';

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 多行文字 -> 每行 escape 後用 <br> 接起來（用於段落）
// 支援簡單標記：用 **文字** 包住的部分會變成「螢光黃底＋粗體」，
// 例如「提供**課程試看內容**」會把「課程試看內容」四個字加上黃底粗體。
function textToHtml(str) {
  if (!str) return '';
  return String(str)
    .split('\n')
    .map(line => richLineToHtml(line))
    .join('<br>');
}

function richLineToHtml(line) {
  const parts = String(line).split('**');
  return parts
    .map((part, i) => {
      const escaped = escapeHtml(part);
      return i % 2 === 1
        ? `<b style="background-color:rgb(255,255,0)">${escaped}</b>`
        : escaped;
    })
    .join('');
}

// 多行文字 -> 陣列（過濾空行），用於 requestedItems / famousKOLs 這種清單欄位
function linesToArray(str) {
  if (!str) return [];
  return String(str)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function joinHighlighted(str, sep, highlight) {
  const arr = linesToArray(str).map(escapeHtml);
  if (arr.length === 0) return '';
  if (highlight) {
    return arr.map(s => `<b style="background-color:rgb(255,255,0)">${s}</b>`).join(sep);
  }
  return arr.join(sep);
}

// 預設資料：對應 Eri 原本那封信的內容，方便一打開就能看到範例、直接照著改
// 平台名稱固定不開放編輯，直接寫死在 renderEmailHTML() 裡（搜尋 PLATFORM_NAME）
const PLATFORM_NAME = 'SAT. Knowledge 知識衛星';

const DEFAULT_DATA = {
  recipientName: '永和超級阿公',
  senderIntroName: 'Eri（ㄝ里）',
  openingObservation: '有留意到粉專平時分享許多阿公的生活日常，阿公總是充滿活力，也讓大家看到能夠健康、有活力地享受生活，是一件很美好的事！',

  collaboratorIntro: '抗癌名醫－蔡松彥醫師',
  courseTitle: '抗癌名醫的超級細胞排毒｜逆轉發炎 X 重啟高效代謝',
  studentCount: '4,600',
  campaignPeriod: '2026 / 10月中 - 2026 / 11月初',
  requestedItems: 'FB貼文\nIG reels\n限動\n廣告主權限 2 週',
  famousKOLs: '吳淡如\n曾寶儀',
  courseIntroParagraph: '由蔡松彥院長結合自身抗癌經驗、整合醫學與生活型態調整，帶你重新檢視健康狀態，找到適合自己的調整方向，特別適合想建立長期健康習慣的人！',

  highlights: [
    { title: '根本修復・六大毒型精準檢測', body: '從疾病源頭啟動細胞自癒，首創「粒線體氧化修復系統」，重啟代謝與能量循環' },
    { title: '21天臨床實證排毒循環', body: '醫師團隊監製、三週看到改變！從體脂下降到能量重啟，以臨床數據驗證「代謝修復節奏」' },
    { title: '三專科院長的五維一心整合模式', body: '醫學 × 營養 × 身心靈協作，啟動全方位排毒，實證十年無復發、無復胖' },
    { title: '上萬筆臨床數據庫支持', body: '市面唯一「靈性整合醫學」SOP，從營養、運動、情緒、環境到靈性全線追蹤，打造個人化健康基準' },
    { title: '即學即用個人化修復藍圖', body: '專業團隊打造工具包：10 個自我檢測量表＋六型專屬菜單，建立長期穩定修復力' }
  ],

  images: [],

  ctaParagraph: '如果您有合作意願，我們後續會再進行更詳細的方向/內容討論！\n我們也非常樂意提供**課程試看內容**，讓您可以更安心了解課程內容！',
  closingNote: '相信透過阿公的真實分享，可以鼓勵更多人開始關心自己的健康，找到適合自己的調整方式，一步一步養成更健康的生活！',
  signOffName: 'Eri',

  courseUrl: 'https://sat.cool/course/175',
  painQuestion: '明明做了很多，為什麼身體還是常常不舒服？',
  painBody1: '看過醫生、做過療程，也試過飲食控制、運動、保健方法，身體狀態卻還是反反覆覆？',
  painBody2: '也許不是你做得不夠，而是沒看見真正的問題在哪！',
  courseDescLong: '抗癌名醫蔡松彥結合自身抗癌經驗與整合醫學觀點，從營養、運動、環境、情緒到心靈，帶你重新檢視自己的生活與健康狀態，再透過 21 天計畫，找到更適合自己的調整起點。',
  topImageUrl: '',

  instructorName: '蔡松彥院長',
  instructorBio: '出身主流醫學的三專科醫師（神經科、環境職業醫學、重症醫學），後因自身罹患肺腺癌合併鱗狀癌，在經歷手術、化療等主流醫學治療後，因疑似復發，他開始探索、投入整合醫學，並透過科學實證與親身測試，成功控制病情，找回健康強健的身心靈狀態！',
  credentials: [
    '曾任南投基督教醫院（南基醫院）協同院長並為美國約翰霍普金斯大學醫療政策博士',
    '曾罹肺癌，憑整合醫學自癒，腫瘤消失十年零復發',
    '倡導「五維一心整合醫學系統」與整合排毒路徑',
    '行醫40年，協助10,000+個案完成排毒重獲健康',
    '健康暢銷書 TOP1《心轉，癌自癒》、《心轉，病自癒》'
  ],

  courseNameDetail: '抗癌名醫的超級細胞排毒法｜逆轉慢性發炎、重啟高效代謝',
  courseDuration: '5 小時 32 分，共計17個單元',
  priceOriginal: '9,800 元',
  pricePromoNote: '活動期間會有優於6折優惠，搭配KOL專屬$500折價券',
  courseType: '錄播式課程，線上無限次永久觀看',
  viewingPlatform: 'SAT. Knowledge 知識衛星官網',

  senderChineseName: '董伊淇',
  senderEnglishName: 'Eri Tung',
  senderJobTitle: '專案經理 Project Manager',
  senderEmail: 'eritung@sat.cool',
  senderMobile: '0983-755-899'
};

// 簽名檔區塊：版型（logo、市內電話、所有排版/字級/顏色）固定寫死，
// 不透過表單欄位產生——這是直接從 Eri 的 Gmail 簽名檔複製出來的原始 HTML。
// 只開放「中文姓名／英文姓名／職稱／Email／手機」這五個欄位可以替換，
// 而且每個替換的地方都刻意包在原本的 <font size="2">...</font> 裡面，
// 不要移除那個 size="2"，不然字級會跑掉（變得比原本大）。
function buildSignatureHtml(d) {
  return `<div><br clear="all"></div><div><br></div><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><table style="font-size:16px;color:rgb(0,0,0);word-spacing:1px;font-family:-apple-system,&quot;helvetica neue&quot;;border-width:medium;border-style:none;border-color:currentcolor;border-collapse:collapse"><tbody><tr><td style="vertical-align:bottom;padding:5pt"><p dir="ltr" style="line-height:1.656;margin-top:0pt;margin-bottom:0pt"></p></td><td style="vertical-align:middle;padding:5pt"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt"><br></p></td></tr></tbody></table><table style="font-size:16px;word-spacing:1px;font-family:-apple-system,&quot;helvetica neue&quot;;border:rgb(34,34,34);border-collapse:collapse;color:rgb(34,34,34)"><tbody style="border-color:rgb(34,34,34)"><tr style="height:92.2702pt;border-color:rgb(34,34,34)"><td style="vertical-align:bottom;padding:5pt;border-color:rgb(34,34,34)"><p dir="ltr" style="line-height:1.656;margin-top:0pt;margin-bottom:0pt;border-color:rgb(34,34,34)"><font size="2"><img src="https://ci3.googleusercontent.com/meips/ADKq_Nb1KBYfKjUCeBVC7tVucjouWjm7eT5BD5L2tB2yjmzaj2tgiZ5FW5zLKHYe87nXgWHpZKBXzUlIM5nCMMEDfNUMcBpdxt_x4Dn5BrZBcbPPBp-_D1zzKmE=s0-d-e1-ft#https://s3.ap-northeast-1.amazonaws.com/s3.sat/logo/sat.s1_720.png" width="200" height="52" style="border-color:rgb(34,34,34)"><br></font></p></td><td style="vertical-align:middle;padding:5pt;border-color:rgb(34,34,34)"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;border-color:rgb(34,34,34)"><font size="2"><b><span style="font-family:&quot;ibm plex sans&quot;,sans-serif;vertical-align:baseline;border-color:rgb(0,0,0);color:rgb(0,0,0)">${escapeHtml(d.senderChineseName)} |<span>&nbsp;</span></span><span style="border-color:rgb(34,34,34)"><span style="vertical-align:baseline;border-color:rgb(0,0,0);color:rgb(0,0,0)"><font face="verdana, sans-serif" style="font-family:verdana,sans-serif;border-color:rgb(0,0,0)">${escapeHtml(d.senderEnglishName)}</font></span></span></b></font></p><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;border-color:rgb(34,34,34)"><font style="border-color:rgb(102,102,102);color:rgb(102,102,102)" size="2"><span style="font-family:verdana,sans-serif;border-color:rgb(102,102,102)">${escapeHtml(d.senderJobTitle)}</span></font></p><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;border-color:rgb(34,34,34)"><font face="verdana, sans-serif" style="font-family:verdana,sans-serif;border-color:rgb(34,34,34)" size="2"><span style="vertical-align:baseline;border-color:rgb(0,0,0);color:rgb(0,0,0)">T:<a href="tel:02-2756-6009" target="_blank">02-2756-6009</a>&nbsp;</span></font></p><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;border-color:rgb(34,34,34)"><span style="vertical-align:baseline;border-color:rgb(0,0,0);color:rgb(0,0,0)"><font face="verdana, sans-serif" style="font-family:verdana,sans-serif;border-color:rgb(0,0,0)" size="2">M:${escapeHtml(d.senderMobile)}</font></span></p><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;border-color:rgb(34,34,34)"><span style="vertical-align:baseline;border-color:rgb(0,0,0);color:rgb(0,0,0)"><font face="verdana, sans-serif" style="font-family:verdana,sans-serif;border-color:rgb(0,0,0)" size="2">E:${escapeHtml(d.senderEmail)}</font></span></p></td></tr></tbody></table></div></div>`;
}

function renderHighlightsHtml(highlights) {
  if (!highlights || highlights.length === 0) return '';
  return highlights.map(h => `
                  <p style="color:rgb(51,51,51);margin:0px 0px 16px"><font face="${BODY_FONT}"><strong>■ ${escapeHtml(h.title)}</strong><br>
                  ${textToHtml(h.body)}
                  </font></p>`).join('');
}

function renderImagesHtml(images) {
  if (!images || images.length === 0) return '';
  return images.map(img => `
                  <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || '課程圖片')}" style="max-width:100%;height:auto;margin:0 0 16px;display:block;border:0;">`).join('');
}

function renderCredentialsHtml(list) {
  if (!list || list.length === 0) return '';
  return list.map(c => `
                  <p style="margin:0px 0px 8px"><font face="${BODY_FONT}"><font color="#0000ff">■</font><font color="#333333"> ${escapeHtml(c)}</font></font></p>`).join('');
}

function renderEmailHTML(raw) {
  const d = Object.assign({}, DEFAULT_DATA, raw || {});

  const requestedItemsHtml = joinHighlighted(d.requestedItems, ' / ', false);
  const famousKOLsHtml = linesToArray(d.famousKOLs).map(escapeHtml)
    .map(n => `<b style="background-color:rgb(255,255,0)">${n}</b>`).join('、');

  const topImageBlock = d.topImageUrl
    ? `<img src="${escapeHtml(d.topImageUrl)}" alt="課程圖片" width="535" style="max-width:100%;height:auto;margin:0 0 22px;display:block;border:0;">`
    : '';

  return `<div style="width:100%;background-color:#f5f6f8">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#f5f6f8">
    <tbody>
      <tr>
        <td align="center" style="padding:24px 12px">
          <table role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:700px;border-collapse:collapse;background-color:#ffffff;border-top:5px solid #265bf6">
            <tbody>
              <tr>
                <td style="padding:34px;line-height:1.8;word-break:break-word">

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px"><font face="${BODY_FONT}">${escapeHtml(d.recipientName)}，您好！</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px"><font face="${BODY_FONT}">我們是 <b>${PLATFORM_NAME}</b> 線上課程平台，我是專案經理${escapeHtml(d.senderIntroName)}！</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px"><font face="${BODY_FONT}">${textToHtml(d.openingObservation)}</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px"><font face="${BODY_FONT}">
                    我們有一堂與<b>${escapeHtml(d.collaboratorIntro)}</b>，合作推出的線上課程<b>【 ${escapeHtml(d.courseTitle)} 】</b>，課程已<span style="background-color:rgb(255,255,0)"><b>突破${escapeHtml(d.studentCount)}位學員支持</b></span>！
                  </font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 28px"><font face="${BODY_FONT}">
                    目前預計於<span style="background-color:rgb(255,255,0)">【<b>${escapeHtml(d.campaignPeriod)}</b>】</span>進行行銷推廣，希望這次有機會邀請您合作，想先初步和您詢問<span style="background-color:rgb(255,255,0)">【<b> ${requestedItemsHtml} </b>】</span>分別的報價與時間檔期！
                  </font></p>

                  <div style="height:1px;background-color:rgb(225,227,225);margin:0px 0px 28px"></div>

                  <p style="color:rgb(38,91,246);margin:0px 0px 14px;line-height:1.5;font-weight:700"><font face="${BODY_FONT}">【✨課程亮點】</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 14px"><font face="${BODY_FONT}">
                    這門課程目前已有超過 ${escapeHtml(d.studentCount)} 位學員參與，也有許多創作者如 ${famousKOLsHtml} 等共同推廣，獲得熱烈回響！
                  </font></p>

                  <p style="margin:0px 0px 26px"><font color="#0000ff" face="${BODY_FONT}"><b>《${escapeHtml(d.courseTitle)}》</b>${textToHtml(d.courseIntroParagraph)}</font></p>

                  <p style="color:rgb(38,91,246);margin:0px 0px 14px;line-height:1.6;font-weight:700"><font face="${BODY_FONT}">｜五大亮點｜</font></p>
                  ${renderHighlightsHtml(d.highlights)}
                  ${renderImagesHtml(d.images)}

                  <p style="color:rgb(51,51,51);margin:22px 0px"><font face="${BODY_FONT}">${textToHtml(d.ctaParagraph)}</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px"><font face="${BODY_FONT}">${textToHtml(d.closingNote)}</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 6px"><font face="${BODY_FONT}">
                    感謝您撥冗閱信，下方有更多課程資訊提供您參考，<br>
                    若有其他想法、詢問或合作建議都歡迎回信，非常期待有機會與${escapeHtml(d.recipientName)}合作！<br><br>
                  </font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 28px"><font face="${SIGNOFF_FONT}">Sincerely ,<br>${escapeHtml(d.signOffName)}</font></p>

                  <div style="height:1px;background-color:rgb(225,227,225);margin:0px 0px 28px"></div>

                  <p style="color:rgb(38,91,246);margin:0px 0px 10px;line-height:1.6;font-weight:700"><font face="${BODY_FONT}">《${escapeHtml(d.courseTitle)}》</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 10px"><font face="${BODY_FONT}">
                    詳細課程介紹：
                    <a href="${escapeHtml(d.courseUrl)}" style="color:#265bf6;text-decoration:underline" target="_blank">${escapeHtml(d.courseUrl)}</a>
                  </font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 18px;font-weight:700"><font face="${BODY_FONT}">課程已超過${escapeHtml(d.studentCount)}多位學員熱烈支持！</font></p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 10px;font-weight:700"><font face="${BODY_FONT}">「${escapeHtml(d.painQuestion)}」</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 10px"><font face="${BODY_FONT}">${textToHtml(d.painBody1)}</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 10px"><font face="${BODY_FONT}">${textToHtml(d.painBody2)}</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 28px"><font face="${BODY_FONT}">${textToHtml(d.courseDescLong)}</font></p>

                  ${topImageBlock}

                  <p style="color:rgb(38,91,246);margin:0px 0px 14px;line-height:1.6;font-weight:700"><font face="${BODY_FONT}">｜講師介紹｜</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 14px"><font face="${BODY_FONT}"><b>${escapeHtml(d.instructorName)}</b> ${textToHtml(d.instructorBio)}</font></p>
                  ${renderCredentialsHtml(d.credentials)}

                  <p style="color:rgb(38,91,246);margin:28px 0px 14px;line-height:1.6;font-weight:700"><font face="${BODY_FONT}">｜課程介紹｜</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 8px"><font face="${BODY_FONT}">課程名稱：${escapeHtml(d.courseNameDetail)}</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 8px"><font face="${BODY_FONT}">課程時數：${escapeHtml(d.courseDuration)}</font></p>
                  <p style="margin:0px 0px 8px"><font face="${BODY_FONT}"><font color="#333333">預定售價：${escapeHtml(d.priceOriginal)}，</font><b style="background-color:rgb(255,255,0)"><font color="#0000ff">${escapeHtml(d.pricePromoNote)}</font></b></font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 8px"><font face="${BODY_FONT}">課程類型：${escapeHtml(d.courseType)}</font></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 28px"><font face="${BODY_FONT}">觀看平台：${escapeHtml(d.viewingPlatform)}</font></p>

                  ${buildSignatureHtml(d)}

                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}
