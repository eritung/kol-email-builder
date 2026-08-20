// ===== 信件範本渲染引擎 =====
// 這個檔案負責：把左側表單填的資料（data 物件），轉成跟 Eri 原本
// Gmail 邀約信長得一樣風格的完整 HTML（藍色標題、黃底強調、分隔線、簽名檔...）。
// 右側預覽 iframe 跟「複製 HTML」按鈕都是呼叫 renderEmailHTML(data)。

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 多行文字 -> 每行 escape 後用 <br> 接起來（用於段落）
function textToHtml(str) {
  if (!str) return '';
  return String(str)
    .split('\n')
    .map(line => escapeHtml(line))
    .join('<br>');
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
const DEFAULT_DATA = {
  recipientName: '永和超級阿公',
  platformName: 'SAT. Knowledge 知識衛星',
  senderIntroName: 'Eri（ㄝ里）',
  openingObservation: '有留意到粉專平時分享許多阿公的生活日常，阿公總是充滿活力，也讓大家看到能夠健康、有活力地享受生活，是一件很美好的事！',
  courseConnectionNote: '這次我們想分享的課程同樣關注日常習慣與身體狀態，因此在規劃合作時就想到阿公，希望有機會邀請阿公一起體驗與分享！',

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

  ctaProgramName: '排毒調理計畫',
  offerTrial: true,
  closingNote: '相信透過阿公的真實分享，可以鼓勵更多人開始關心自己的健康，找到適合自己的調整方式，一步一步養成更健康的生活！',
  blessingNote: '也祝福阿公與家人們身體健康！',
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

  companyLogoUrl: 'https://s3.ap-northeast-1.amazonaws.com/s3.sat/logo/sat.s1_720.png',
  senderChineseName: '董伊淇',
  senderEnglishName: 'Eri Tung',
  senderJobTitle: '專案經理 Project Manager',
  senderPhone: '02-2756-6009',
  senderMobile: '0983-755-899',
  senderEmail: 'eritung@sat.cool'
};

function renderHighlightsHtml(highlights) {
  if (!highlights || highlights.length === 0) return '';
  return highlights.map(h => `
            <p style="color:rgb(51,51,51);margin:0px 0px 16px">
              <strong>■ ${escapeHtml(h.title)}</strong><br>
              ${textToHtml(h.body)}
            </p>`).join('');
}

function renderImagesHtml(images) {
  if (!images || images.length === 0) return '';
  return images.map(img => `
            <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || '課程圖片')}" style="max-width:100%;height:auto;margin:0 0 16px;display:block;border:0;">`).join('');
}

function renderCredentialsHtml(list) {
  if (!list || list.length === 0) return '';
  return list.map(c => `
            <p style="color:rgb(51,51,51);margin:0px 0px 8px">
              ■ ${escapeHtml(c)}
            </p>`).join('');
}

function renderEmailHTML(raw) {
  const d = Object.assign({}, DEFAULT_DATA, raw || {});

  const requestedItemsHtml = joinHighlighted(d.requestedItems, ' / ', false);
  const famousKOLsHtml = linesToArray(d.famousKOLs).map(escapeHtml)
    .map(n => `<b style="background-color:rgb(255,255,0)">${n}</b>`).join('、');

  const trialClause = d.offerTrial
    ? `並於後續進一步討論合作方向與呈現方式，我們也非常樂意<span style="background-color:rgb(255,255,0)"><b>提供課程試看</b></span>，讓您事前能更安心、完整地了解計畫內容！`
    : `並於後續進一步討論合作方向與呈現方式！`;

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
                <td style="padding:34px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,sans-serif;font-size:16px;line-height:1.8;word-break:break-word">

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px">${escapeHtml(d.recipientName)}，您好！</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px">我們是 <b>${escapeHtml(d.platformName)}</b> 線上課程平台，我是專案經理${escapeHtml(d.senderIntroName)}！</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px">${textToHtml(d.openingObservation)}</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px">
                    我們有一堂與<b>${escapeHtml(d.collaboratorIntro)}</b>，合作推出的線上課程<b>【 ${escapeHtml(d.courseTitle)} 】</b>，課程已<span style="background-color:rgb(255,255,0)"><b>突破${escapeHtml(d.studentCount)}位學員支持</b></span>！
                  </p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 28px">
                    目前預計於<span style="background-color:rgb(255,255,0)">【<b>${escapeHtml(d.campaignPeriod)}</b>】</span>進行行銷推廣，希望這次有機會邀請您合作，想先初步和您詢問<span style="background-color:rgb(255,255,0)">【<b> ${requestedItemsHtml} </b>】</span>分別的報價與時間檔期！
                  </p>

                  <div style="height:1px;background-color:rgb(225,227,225);margin:0px 0px 28px"></div>

                  <p style="color:rgb(38,91,246);margin:0px 0px 14px;font-size:20px;line-height:1.5;font-weight:700">【✨課程亮點】</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 14px">
                    這門課程目前已有超過 ${escapeHtml(d.studentCount)} 位學員參與，也有許多創作者如 ${famousKOLsHtml} 等共同推廣，獲得熱烈回響！
                  </p>

                  <p style="margin:0px 0px 26px"><font color="#0000ff"><b>《${escapeHtml(d.courseTitle)}》</b>${textToHtml(d.courseIntroParagraph)}</font></p>

                  <p style="color:rgb(38,91,246);margin:0px 0px 14px;font-size:18px;line-height:1.6;font-weight:700">｜五大亮點｜</p>
                  ${renderHighlightsHtml(d.highlights)}
                  ${renderImagesHtml(d.images)}

                  <p style="color:rgb(51,51,51);margin:22px 0px 22px">如果${escapeHtml(d.recipientName)}有合作意願，我們希望邀請您親自體驗「<b style="background-color:rgb(255,255,0)">${escapeHtml(d.ctaProgramName)}</b>」，${trialClause}</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 22px">${textToHtml(d.closingNote)}</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 6px">
                    感謝您撥冗閱信，下方有更多課程資訊提供您參考，<br>
                    若有其他想法、詢問或合作建議都歡迎回信，非常期待有機會與${escapeHtml(d.recipientName)}合作！<br>
                    ${escapeHtml(d.blessingNote)}
                  </p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 28px">Sincerely ,<br>${escapeHtml(d.signOffName)}</p>

                  <div style="height:1px;background-color:rgb(225,227,225);margin:0px 0px 28px"></div>

                  <p style="color:rgb(38,91,246);margin:0px 0px 10px;font-size:19px;line-height:1.6;font-weight:700">《${escapeHtml(d.courseTitle)}》</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 10px">
                    詳細課程介紹：
                    <a href="${escapeHtml(d.courseUrl)}" style="color:#265bf6;text-decoration:underline" target="_blank">${escapeHtml(d.courseUrl)}</a>
                  </p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 18px;font-weight:700">課程已超過${escapeHtml(d.studentCount)}多位學員熱烈支持！</p>

                  <p style="color:rgb(51,51,51);margin:0px 0px 10px;font-weight:700">「${escapeHtml(d.painQuestion)}」</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 10px">${textToHtml(d.painBody1)}</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 10px">${textToHtml(d.painBody2)}</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 28px">${textToHtml(d.courseDescLong)}</p>

                  ${topImageBlock}

                  <p style="color:rgb(38,91,246);margin:0px 0px 14px;font-size:18px;line-height:1.6;font-weight:700">｜講師介紹｜</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 14px"><b>${escapeHtml(d.instructorName)}</b> ${textToHtml(d.instructorBio)}</p>
                  ${renderCredentialsHtml(d.credentials)}

                  <p style="color:rgb(38,91,246);margin:28px 0px 14px;font-size:18px;line-height:1.6;font-weight:700">｜課程介紹｜</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 8px">課程名稱：${escapeHtml(d.courseNameDetail)}</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 8px">課程時數：${escapeHtml(d.courseDuration)}</p>
                  <p style="margin:0px 0px 8px"><font color="#333333">預定售價：${escapeHtml(d.priceOriginal)}，</font><b style="background-color:rgb(255,255,0)"><font color="#0000ff">${escapeHtml(d.pricePromoNote)}</font></b></p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 8px">課程類型：${escapeHtml(d.courseType)}</p>
                  <p style="color:rgb(51,51,51);margin:0px 0px 28px">觀看平台：${escapeHtml(d.viewingPlatform)}</p>

                  <div style="height:1px;background-color:rgb(225,227,225);margin:0px 0px 28px"></div>

                  <table style="font-size:16px;font-family:-apple-system,'helvetica neue';border-collapse:collapse;color:rgb(34,34,34)">
                    <tbody>
                      <tr>
                        <td style="vertical-align:bottom;padding:5pt">
                          ${d.companyLogoUrl ? `<img src="${escapeHtml(d.companyLogoUrl)}" width="200" style="border:0;display:block">` : ''}
                        </td>
                        <td style="vertical-align:middle;padding:5pt">
                          <p style="line-height:1.38;margin:0"><b><span style="font-family:'ibm plex sans',sans-serif;color:rgb(0,0,0)">${escapeHtml(d.senderChineseName)} | </span><span style="font-family:verdana,sans-serif;color:rgb(0,0,0)">${escapeHtml(d.senderEnglishName)}</span></b></p>
                          <p style="line-height:1.38;margin:0"><span style="font-family:verdana,sans-serif;color:rgb(102,102,102)">${escapeHtml(d.senderJobTitle)}</span></p>
                          <p style="line-height:1.38;margin:0"><span style="font-family:verdana,sans-serif;color:rgb(0,0,0)">T:${escapeHtml(d.senderPhone)}</span></p>
                          <p style="line-height:1.38;margin:0"><span style="font-family:verdana,sans-serif;color:rgb(0,0,0)">M:${escapeHtml(d.senderMobile)}</span></p>
                          <p style="line-height:1.38;margin:0"><span style="font-family:verdana,sans-serif;color:rgb(0,0,0)">E:${escapeHtml(d.senderEmail)}</span></p>
                        </td>
                      </tr>
                    </tbody>
                  </table>

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
