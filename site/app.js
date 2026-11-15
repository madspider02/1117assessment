/* 評量偵探室 — GitHub Pages 靜態前端 */
'use strict';

const CFG = window.ASSESSMENT_GAME_CONFIG || {};
const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.get('demo') === '1' || !String(CFG.API_URL || '').trim();
const HOST_MODE = PARAMS.get('mode') === 'host';
const LS_DEMO = 'assessment-lab-slide-sync-v2-demo';
const LS_LAST_NAME = 'assessment-lab-v1-last-name';
const LS_DRAFT_PREFIX = 'assessment-lab-slide-sync-v2-draft-';
const API_VERSION = 'slidesync-2026-11-v2';
const MISSIONS = [
  {
    id:'S02', slide:'02', short:'暖身觀察', type:'choice', section:'投影片 02｜暖身',
    title:'孩子做不出來，究竟代表什麼？',
    caseText:'沒有回應｜老師叫名字，孩子沒有轉頭。\n不會說｜想要玩具時，孩子拉著老師的手走向櫃子。\n剪不好｜孩子認得圓形，剪圓時卻一直偏離線條。',
    question:'請先選一個情境：你會先「確認」哪一件事？',
    instruction:'選一個情境，在下方寫出你最想先確認的能力或環境條件。',
    options:[['A','沒有回應｜老師叫名字，孩子沒有轉頭'],['B','不會說｜想要玩具時，孩子拉著老師的手走向櫃子'],['C','剪不好｜孩子認得圓形，剪圓時卻一直偏離線條']],
    max:1,reasonLabel:'請寫出：你會先「確認」哪一件事？',
    insight:'同一個表現可能有多種解釋。請把觀察事實和需要確認的能力區分開來。'
  },
  {
    id:'S07', slide:'07', short:'小安｜語言溝通', type:'choice', section:'投影片 07–08｜活動一',
    title:'小安不回答老師的問題，代表什麼？',
    caseText:'情境 A｜小安，4歲半。\n老師問：「你要不要喝水？」小安通常不回答。但想玩積木時，會拉著老師走向櫃子，並指向積木。',
    question:'請先選一項最想「優先確認」的資訊，再說明理由。',
    instruction:'單選 A／B／C／D；選項與投影片第7頁相同。',
    options:[['A','是否理解老師的問題'],['B','有哪些可用的表達方式'],['C','不同對象是否有主動溝通'],['D','以上都需要確認']],
    max:1,reasonLabel:'為什麼選這一項？下一步會怎麼蒐集證據？',
    insight:'拉手與指物是已觀察到的溝通線索；口語理解、表達與情境差異仍需更多證據，不能直接推定障礙類別。'
  },
  {
    id:'S10', slide:'10', short:'小芸｜知覺動作', type:'choice', section:'投影片 10–11｜活動二',
    title:'小芸剪不好，到底卡在哪裡？',
    caseText:'情境 B｜小芸，5歲。\n小芸能指認、命名圓形。但是沿線剪圓經常偏離，畫線也容易歪斜。成人幫忙固定紙張後，剪的表現有所改善。',
    question:'選擇一個你會加做的比較任務。',
    instruction:'單選 A／B／C／D；選項與投影片第10頁相同。',
    options:[['A','讓孩子做圖形配對'],['B','改用手指沿線描繪'],['C','比較剪直線、固定紙張後剪線'],['D','以上都可提供不同線索']],
    max:1,reasonLabel:'我想排除什麼？這個比較任務可以幫助確認什麼？',
    insight:'比較圖形配對、描線與固定紙張前後的表現，可以形成不同能力的假設；不能靠單一活動直接診斷。'
  },
  {
    id:'S13', slide:'13', short:'小組｜評量設計', type:'design', section:'投影片 13–14｜活動三',
    title:'請設計一份「在班上做得到」的簡易評量',
    caseText:'A｜小沐，4歲（語言）：遊戲時能用短句要求；兩步驟指令常停在第一步，加入圖示後較能完成。\n\nB｜小晨，5歲（溝通）：點心時會伸手要餅乾；與熟悉教師互動較多，較少回應同儕的輪流邀請。\n\nC｜小晴，5歲（知覺動作）：拼圖配對尚可；穿小珠常掉落，改用大孔珠後操作比較順利。',
    question:'三個案例擇一，完成投影片的四項討論任務。',
    instruction:'可以個別作答，也能先在分組討論後各自送出相同或不同的判斷。',
    areas:['A｜小沐（語言）','B｜小晨（溝通）','C｜小晴（知覺動作）'],
    insight:'四個問題依序是：觀察事實、待釐清能力、兩種蒐證方式，以及要記錄的指標。'
  },
  {
    id:'S15', slide:'15', short:'下課｜出口票', type:'reflection', section:'投影片 15｜出口票',
    title:'讓評量從「猜問題」走向「找證據」',
    caseText:'課程結語：先描述孩子實際做了什麼，再比較哪些條件會改變表現，最後思考下一步支持。',
    question:'請完成投影片第15頁的出口票。',
    instruction:'兩句話即可；這一關不設正確答案。',
    insight:'請提出一個可在班上觀察的具體行為，並說明可以蒐集何種證據。'
  }
];
const app = document.getElementById('app');
const modeLabel = document.getElementById('modeLabel');
const headerAction = document.getElementById('headerAction');
const credit = document.getElementById('credit');
if(CFG.FOOTER_CREDIT) credit.textContent = CFG.FOOTER_CREDIT;
const state = {name:'', currentId:'S02', student:null, hostPin:'', admin:null, drafts:{}, busy:false};
let toastTimer;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function formatCount(n){return Number(n||0).toLocaleString('zh-TW');}
function el(id){return document.getElementById(id);}
function qs(selector){return app.querySelector(selector);}
function mission(id){return MISSIONS.find(m=>m.id===id)||MISSIONS[0];}
function missionIndex(id){return MISSIONS.findIndex(m=>m.id===id)+1;}
function normalizeName(s){return String(s||'').replace(/\s+/g,' ').trim();}
function keyName(s){return normalizeName(s).normalize('NFKC').toLocaleLowerCase();}
function showToast(msg){const t=el('toast');t.textContent=msg;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4000);}
function missionCount(){return MISSIONS.filter(m=>Boolean(state.student?.missions?.[m.id]?.myAnswer)).length;}
function getDraft(id){return state.drafts[id]||(state.student?.missions?.[id]?.myAnswer)||{choices:[],reason:'',area:'',task:'',evidence:'',support:'',sharePublic:false};}
function demoNotice(){return DEMO?'<div class="notice demo-notice"><strong>本機試玩模式</strong>｜資料只保存在目前的瀏覽器，不會寫入 Google Sheet。正式全班同步請使用已部署的 GitHub Pages 網址（不要加 ?demo=1）。</div>':'';}
function uuid(){return (crypto?.randomUUID?.() || 'r'+Date.now()+'_'+Math.random().toString(36).slice(2));}

/* JSONP 僅讀取受限資料；寫入透過 no-cors POST 並使用 receipt 二次確認。 */
function jsonp(query,timeoutMs=13000){
  return new Promise((resolve,reject)=>{
    const cb='__agcb_'+Math.random().toString(36).slice(2);
    const url=new URL(CFG.API_URL);
    for(const [k,v] of Object.entries(query))url.searchParams.set(k,String(v));
    url.searchParams.set('callback',cb);
    url.searchParams.set('room',CFG.ROOM_CODE||'assessment-lab-2026');
    url.searchParams.set('_t',String(Date.now()));
    const script=document.createElement('script');let done=false;let timer;
    const cleanup=()=>{if(done)return;done=true;clearTimeout(timer);delete window[cb];script.remove();};
    window[cb]=(data)=>{cleanup();resolve(data);};
    script.onerror=()=>{cleanup();reject(new Error('無法連上 Google Apps Script；請檢查 /exec 網址與部署權限。'));};
    timer=setTimeout(()=>{cleanup();reject(new Error('連線逾時；請檢查網路與 Apps Script 部署。'));},timeoutMs);
    script.src=url.toString();document.head.appendChild(script);
  });
}
async function apiGet(query){
  if(DEMO) return demoGet(query);
  const data=await jsonp(query);
  if(!data||data.ok!==true)throw new Error(data?.error||'伺服器未能完成讀取。');
  if(['health','student','admin'].includes(query.action) && data.version!==API_VERSION) throw new Error('Google Apps Script 還是舊版。請換成「投影片同步版 Code.gs」，執行 setup()，再將現有 Web App 更新到新版本。');
  return data;
}
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
async function apiPost(action, data){
  const reqId=uuid();const payload={...data,action,requestId:reqId,room:CFG.ROOM_CODE||'assessment-lab-2026'};
  if(DEMO){demoPost(payload);return true;}
  const body=new URLSearchParams();body.set('payload',JSON.stringify(payload));
  // Apps Script 通常不支援一般跨來源 POST 讀回覆；no-cors 只負責送出，receipt 用 JSONP 確認真正寫入。
  await fetch(CFG.API_URL,{method:'POST',mode:'no-cors',body,redirect:'follow',credentials:'omit'});
  const schedule=[500,800,1200,1600,2000,2500,3000];
  for(const delay of schedule){
    await wait(delay);
    try{const reply=await apiGet({action:'receipt',requestId:reqId});if(reply.received)return true;}catch(e){/* 稍後再確認 */}
  }
  throw new Error('尚未確認寫入成功。請重新整理確認；若未保存再提交，避免重複作答。');
}

/* 離線示範：功能相同，但不能跨裝置同步。 */
function defaultDemo(){return {people:{},answers:{},expectedCount:1,releases:Object.fromEntries(MISSIONS.map(m=>[m.id,false])),commentsRelease:Object.fromEntries(MISSIONS.map(m=>[m.id,false])),receipts:{}};}
function readDemo(){try{return {...defaultDemo(),...JSON.parse(localStorage.getItem(LS_DEMO)||'null')}}catch{return defaultDemo();}}
function writeDemo(data){localStorage.setItem(LS_DEMO,JSON.stringify(data));}
function demoPost(p){
  const db=readDemo();
  if(p.action==='join')db.people[keyName(p.name)]={name:normalizeName(p.name),date:new Date().toISOString()};
  else if(p.action==='save'){
    db.people[keyName(p.name)]={name:normalizeName(p.name),date:new Date().toISOString()};
    db.answers[keyName(p.name)+'|'+p.missionId]={name:normalizeName(p.name),missionId:p.missionId,choices:p.choices||[],reason:p.reason||'',area:p.area||'',task:p.task||'',evidence:p.evidence||'',support:p.support||'',sharePublic:!!p.sharePublic,updatedAt:new Date().toISOString()};
  }else if(p.action==='hostUpdate'){
    if(p.operation==='expectedCount')db.expectedCount=Number(p.value)||0;
    if(p.operation==='reveal')db.releases[p.missionId]=Boolean(p.value);
    if(p.operation==='comments'){db.commentsRelease=db.commentsRelease||{};db.commentsRelease[p.missionId]=Boolean(p.value);}
  }
  db.receipts[p.requestId]=true;writeDemo(db);
}
function getDemoTask(db,m,name){
  const rows=Object.values(db.answers).filter(x=>x.missionId===m.id);
  const myAnswer=db.answers[keyName(name)+'|'+m.id]||null;
  const released=!!db.releases[m.id] || (db.expectedCount>0&&rows.length>=db.expectedCount);
  const options=m.type==='choice'?m.options.map(([id,label])=>({id,label,count:rows.filter(x=>(x.choices||[]).includes(id)).length})):m.type==='design'?m.areas.map(id=>({id,label:id,count:rows.filter(x=>x.area===id).length})):[];
  const comments=rows.filter(x=>x.sharePublic&&db.commentsRelease?.[m.id]).map(x=>({name:x.name,reason:x.reason,area:x.area,task:x.task,evidence:x.evidence,support:x.support})).slice(-50).reverse();
  return {count:rows.length,released,commentsOpen:!!db.commentsRelease?.[m.id],unlocked:released&&!!myAnswer,myAnswer,result:released&&myAnswer?{count:rows.length,options,comments}:null};
}
function demoGet(q){
  const db=readDemo();
  if(q.action==='receipt')return {ok:true,received:!!db.receipts[q.requestId]};
  if(q.action==='student')return {ok:true,name:q.name,exists:!!db.people[keyName(q.name)],participantCount:Object.keys(db.people).length,expectedCount:db.expectedCount,missions:Object.fromEntries(MISSIONS.map(m=>[m.id,getDemoTask(db,m,q.name)]))};
  if(q.action==='admin'){
    if(!String(q.pin||''))return {ok:false,error:'請輸入主持人密碼（試玩模式可任意輸入）。'};
    return {ok:true,expectedCount:db.expectedCount,participants:Object.values(db.people),missions:Object.fromEntries(MISSIONS.map(m=>{const x=getDemoTask(db,m,'');return [m.id,{count:x.count,manualReveal:!!db.releases[m.id],released:x.released,commentsOpen:!!db.commentsRelease?.[m.id]}]})),answers:Object.values(db.answers)};
  }
  return {ok:false,error:'未知的操作'};
}

function renderLanding(){
  modeLabel.textContent='INTERACTIVE / 05 MISSIONS';headerAction.hidden=true;
  app.innerHTML=`<main class="page-main">
    ${demoNotice()}
    <section class="hero"><div class="hero-art" aria-hidden="true"></div>
      <span class="eyebrow">LANGUAGE · COMMUNICATION · PERCEPTUAL-MOTOR</span>
      <h1>孩子做不到，<br>究竟卡在哪裡？</h1>
      <p>歡迎來到「評量偵探室」。內容逐題對應本週 15 頁簡報：第2、7、10、13、15頁。可以先投票，再與全班結果比較。</p>
      <div class="hero-meta"><span><i class="dot"></i><b>5 個任務</b>｜與課堂簡報同步</span><span><i class="dot"></i><b>可續答</b>｜回來修改沒問題</span><span><i class="dot"></i><b>全班結果</b>｜完成後等待公布</span></div>
    </section>
    <section class="intro-panel">
      <div class="intro-card"><span class="eyebrow">GET STARTED</span><h2>你的評量觀察旅程，從這裡開始。</h2>
        <p>輸入姓名後即可開始；下次使用同一姓名可找回在 Google Sheet 上的作答進度。</p>
        <form id="joinForm"><label class="form-label" for="joinName">希望大家怎麼稱呼你？ <span style="color:#b85145">*</span></label>
        <input class="text-input" id="joinName" name="name" type="text" maxlength="30" autocomplete="name" placeholder="請輸入姓名（同名請加識別字）" required value="${esc(localStorage.getItem(LS_LAST_NAME)||'')}">
        <p class="hint">同一姓名會讀取同一份作答紀錄，請勿代他人填答。此為課堂辨識，並非安全的身分驗證。</p>
        <div class="actions" style="margin-top:23px"><button class="btn" id="joinBtn" type="submit">開始我的評量任務 <span aria-hidden="true">→</span></button></div>
        <p id="joinError" class="error-label" role="alert"></p></form>
      </div>
      <div class="intro-steps" aria-label="活動流程">
        <div class="step-tile"><span class="step-icon">01</span><div><strong>先判斷｜看見孩子的表現</strong><p>從語言、溝通與動作情境找出可能的能力線索。</p></div></div>
        <div class="step-tile"><span class="step-icon">02</span><div><strong>再蒐證｜說出你的評量依據</strong><p>答案可以修改；重點不在猜標準答案，而在提出證據。</p></div></div>
        <div class="step-tile"><span class="step-icon">03</span><div><strong>一起討論｜看見全班的不同觀點</strong><p>全班達到設定人數，或主持教師公布後，才會顯示結果。</p></div></div>
      </div>
    </section></main>`;
  el('joinForm').onsubmit=join;
}
async function join(e){
  e?.preventDefault();const name=normalizeName(el('joinName')?.value||'');
  if(name.length<2||name.length>30){el('joinError').textContent='請輸入 2–30 字的姓名。';return;}
  const btn=el('joinBtn');btn.disabled=true;btn.textContent='正在讀取你的進度…';el('joinError').textContent='';
  try{
    if(!DEMO) await apiGet({action:'health'});
    await apiPost('join',{name});
    const result=await apiGet({action:'student',name});
    if(!result.exists)throw new Error('尚未確認登入成功，請檢查後台。');
    state.name=name;state.student=result;state.currentId=MISSIONS[0].id;state.drafts={};
    try{state.drafts=JSON.parse(localStorage.getItem(LS_DRAFT_PREFIX+keyName(name))||'{}')}catch{}
    MISSIONS.forEach(m=>{const saved=result.missions?.[m.id]?.myAnswer;if(saved)state.drafts[m.id]=saved;});
    localStorage.setItem(LS_LAST_NAME,name);renderGame();showToast('歡迎回來，'+name+'！你的作答會持續保存在雲端。');
  }catch(err){if(el('joinError'))el('joinError').textContent=err.message||'無法進入課程，請再試一次。';btn.disabled=false;btn.textContent='開始我的評量任務 →';}
}
function rememberDraft(){
  if(!state.name||!el('missionForm'))return;
  const m=mission(state.currentId),d=getDraft(m.id);
  if(m.type==='choice'){
    d.choices=[...app.querySelectorAll('.option.selected')].map(b=>b.dataset.option);
    d.reason=el('reason')?.value||'';
  }else if(m.type==='design'){
    d.area=el('fieldArea')?.value||'';d.task=el('fieldTask')?.value||'';d.evidence=el('fieldEvidence')?.value||'';d.support=el('fieldSupport')?.value||'';d.reason=el('fieldReason')?.value||'';
  }else{
    d.task=el('fieldTask')?.value||'';d.evidence=el('fieldEvidence')?.value||'';
  }
  d.sharePublic=!!el('sharePublic')?.checked;
  state.drafts[m.id]=d;
  localStorage.setItem(LS_DRAFT_PREFIX+keyName(state.name),JSON.stringify(state.drafts));
}
function chooseOption(id){
  const m=mission(state.currentId),d=getDraft(m.id);
  d.choices=Array.isArray(d.choices)?d.choices:[];
  if(d.choices.includes(id))d.choices=d.choices.filter(x=>x!==id);
  else if(m.max===1)d.choices=[id];
  else if(d.choices.length>=m.max){showToast('這一關最多選 '+m.max+' 項，請先取消一項。');return;}
  else d.choices.push(id);
  state.drafts[m.id]=d;
  app.querySelectorAll('[data-option]').forEach(b=>{const yes=d.choices.includes(b.dataset.option);b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',yes?'true':'false');});
  localStorage.setItem(LS_DRAFT_PREFIX+keyName(state.name),JSON.stringify(state.drafts));
}
function renderMission(m){
  const d=getDraft(m.id),done=!!state.student?.missions?.[m.id]?.myAnswer;
  const options=m.options?.map(([id,label])=>`<button type="button" class="option ${(d.choices||[]).includes(id)?'selected':''}" data-option="${id}" aria-pressed="${(d.choices||[]).includes(id)?'true':'false'}"><span class="option-letter">${id}</span><span>${esc(label)}</span></button>`).join('');
  const choiceFields=`<div class="option-grid" role="group" aria-label="選擇評量觀點">${options||''}</div>
     <label class="textarea-title" for="reason">${esc(m.reasonLabel)}</label>
     <textarea id="reason" maxlength="350" placeholder="請從孩子的具體行為出發，說明你的判斷…">${esc(d.reason||'')}</textarea>
     <p class="hint">文字建議 30–100 字；只要寫出你想蒐集的證據即可。</p>`;
  const designFields=m.type==='design'?`<div class="form-grid">
    <div><label class="form-label" for="fieldArea">選擇案例｜小沐、小晨或小晴</label><select id="fieldArea"><option value="">請先選擇一個案例</option>${m.areas.map(v=>`<option value="${esc(v)}" ${d.area===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
    <div><label class="form-label" for="fieldTask">① 我觀察到…（觀察事實）</label><textarea id="fieldTask" maxlength="500" placeholder="寫出案例中具體、可見的行為…">${esc(d.task||'')}</textarea></div>
    <div><label class="form-label" for="fieldEvidence">② 我想再確認…（待釐清能力）</label><textarea id="fieldEvidence" maxlength="500" placeholder="你最想區分的是哪些能力？">${esc(d.evidence||'')}</textarea></div>
    <div><label class="form-label" for="fieldSupport">③ 我會安排…（兩種蒐證方式）</label><textarea id="fieldSupport" maxlength="500" placeholder="例如：比較有無圖示的指令理解、家庭訪談等。至少兩種。">${esc(d.support||'')}</textarea></div>
    <div><label class="form-label" for="fieldReason">④ 我會記錄…（評量指標）</label><textarea id="fieldReason" maxlength="350" placeholder="例如：完成步驟、正確率、提示次數、情境差異…">${esc(d.reason||'')}</textarea></div>
  </div>`:'';
  const reflectionFields=m.type==='reflection'?`<div class="form-grid">
    <div><label class="form-label" for="fieldTask">我最想回到班上觀察…</label><textarea id="fieldTask" maxlength="500" placeholder="例如：孩子在自由遊戲中如何主動與同儕溝通…">${esc(d.task||'')}</textarea></div>
    <div><label class="form-label" for="fieldEvidence">我會用…來蒐集證據。</label><textarea id="fieldEvidence" maxlength="500" placeholder="例如：事件紀錄、同儕互動觀察、不同提示條件對照…">${esc(d.evidence||'')}</textarea></div>
  </div>`:'';
  return `<article class="mission-card">
    <div class="mission-head"><span class="mission-num">任務 ${missionIndex(m.id)} <span>/ ${MISSIONS.length} · 簡報第${m.slide}頁</span></span><span class="mini-badge">${esc(m.section)}</span></div>
    <h2>${esc(m.title)}</h2><div class="case-box"><strong>CASE FILE · 觀察檔案</strong>${esc(m.caseText)}</div>
    <p class="question">${esc(m.question)}</p><p class="subquestion">${esc(m.instruction)}</p>
    <form id="missionForm">${m.type==='choice'?choiceFields:m.type==='design'?designFields:reflectionFields}
      <label class="checkline"><input id="sharePublic" type="checkbox" ${d.sharePublic?'checked':''}>
      <span>我同意將本題的文字說明和姓名展示在全班結果中（選項統計不受此設定影響；預設不公開）。</span></label>
      <div class="mission-controls"><div><button type="submit" id="saveBtn" class="btn">${done?'更新我的回答':'送出這一關'} <span aria-hidden="true">✓</span></button>
      <p id="formError" class="error-label" role="alert"></p></div>
      <button type="button" class="btn secondary" data-next>${missionIndex(m.id)===MISSIONS.length?'回到第一關':'下一關 →'}</button></div>
    </form><hr class="quiet-line"><p class="short-note"><strong>評量提醒：</strong>${esc(m.insight)}</p>
  </article>`;
}
function renderResult(m){
  const x=state.student?.missions?.[m.id];if(!x)return '';
  const count=x.count||0,expected=state.student.expectedCount||0;
  const status=`<div class="stat-block"><b>${formatCount(count)}${expected>0?` <span style="font-size:15px">/ ${formatCount(expected)}</span>`:''}</b><span>此關已提交人數 ${expected>0?'／ 預計人數':''}</span></div>`;
  let body='';
  if(!x.myAnswer)body=`<div class="lock-illustration" aria-hidden="true">✍</div><div class="center"><h4>先完成這一關</h4><p class="stat-note">送出自己的觀點，公布結果後才能解鎖全班統計。</p></div>`;
  else if(!x.unlocked)body=`<div class="lock-illustration" aria-hidden="true">⌛</div><div class="center"><h4>已收到你的回答！</h4><p class="stat-note">等待大家完成。當人數達標，或主持教師開放後，就能看到其他人的觀點。</p></div>`;
  else{
    const result=x.result||{options:[],comments:[],count:0};
    const max=Math.max(...(result.options||[]).map(o=>Number(o.count||0)),1);
    const stats=(result.options||[]).map(o=>{
      const pct=count?Math.round(o.count/count*100):0;
      const label=m.type==='choice'?`${o.id}　${o.label}`:o.label;
      return `<div class="result-row"><div class="result-info"><strong>${esc(label)}</strong><span>${o.count} 人 · ${pct}%</span></div><div class="result-bar" role="img" aria-label="${esc(label)}：${o.count} 人"><span style="width:${Math.round(o.count/max*100)}%"></span></div></div>`;
    }).join('');
    const comments=(result.comments||[]).map(c=>`<div class="peer-comment"><b>${esc(c.name||'參與者')}</b>${m.type==='choice'?`<p>${esc(c.reason||'')}</p>`:m.type==='design'?`<p><strong>${esc(c.area||'')}</strong>｜觀察：${esc(c.task||'')}</p><p>待釐清：${esc(c.evidence||'')}</p><p>蒐證方式：${esc(c.support||'')}</p><p>紀錄指標：${esc(c.reason||'')}</p>`:`<p>想觀察：${esc(c.task||'')}</p><p>蒐證方式：${esc(c.evidence||'')}</p>`}</div>`).join('');
    body=`<div class="mini-badge" style="margin:5px 0 12px">已公布 · 全班統整</div>${stats}
      <p class="stat-note">${m.type==='reflection'?'出口票為開放式回應，不設選項長條圖。': '百分比以提交此關的人數為分母；不同判斷可以一起討論。'}</p>
      <h4 class="comment-title">自願公開的文字回應</h4><div class="result-list">${!x.commentsOpen?'<p class="stat-note">老師尚未開放文字回應；你已可以閱讀全班選項統計。</p>':comments||'<p class="stat-note">目前沒有學員同意公開文字。大家的選項仍已納入上方統計。</p>'}</div>`;
  }
  return `<aside class="right-card" id="resultsPane">
    <div class="result-top"><h3>全班觀點</h3><button class="btn ghost small" type="button" data-refresh>↻ 更新</button></div>
    <div class="stat-note">完成自己的任務，再看大家如何思考。</div>${status}${body}
    <div class="result-guidance">💡 <strong>帶領討論：</strong>不同答案代表不同評量切入點。請比較「已經知道什麼」與「還需要蒐集什麼」。</div>
  </aside>`;
}
function renderGame(){
  modeLabel.textContent='IN CLASS / 互動作答';headerAction.hidden=false;headerAction.textContent='切換使用者';
  headerAction.onclick=()=>{rememberDraft();state.name='';state.student=null;renderLanding();};
  const m=mission(state.currentId);const num=missionCount();
  app.innerHTML=`<main class="page-main">
    ${demoNotice()}
    <div class="game-header"><div><span class="eyebrow">LEARNING BY INVESTIGATING</span><h1 class="game-title">評量偵探室｜投影片同步五關</h1></div><div class="user-pill">目前身分：<b>${esc(state.name)}</b></div></div>
    <div class="game-layout"><nav class="mission-nav" aria-label="切換關卡"><p class="panel-label">YOUR MISSIONS</p>
    ${MISSIONS.map((x,i)=>`<button type="button" class="mission-link ${x.id===m.id?'active':''}" data-mission="${x.id}" ${x.id===m.id?'aria-current="step"':''}>
       <span class="nav-number">${i+1}</span><span class="nav-text"><strong>${esc(x.short)}</strong><small>${esc(x.section)}</small></span><span class="check">${state.student.missions?.[x.id]?.myAnswer?'✓':''}</span></button>`).join('')}
       <div class="count-card"><b>${num} <span style="font-size:13px;color:#c1e2d0">/ ${MISSIONS.length}</span></b><p>已完成的觀察任務</p><div class="meter"><span style="width:${num/MISSIONS.length*100}%"></span></div></div>
    </nav>${renderMission(m)}${renderResult(m)}</div>
  </main>`;
  app.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>{rememberDraft();state.currentId=b.dataset.mission;renderGame();});
  app.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>chooseOption(b.dataset.option));
  el('missionForm').onsubmit=submitMission;
  el('missionForm').querySelectorAll('textarea,select,input').forEach(control=>{control.addEventListener('input',rememberDraft);control.addEventListener('change',rememberDraft);});
  const next=qs('[data-next]');next.onclick=()=>{rememberDraft();const i=MISSIONS.findIndex(x=>x.id===state.currentId);state.currentId=MISSIONS[(i+1)%MISSIONS.length].id;renderGame();};
  qs('[data-refresh]').onclick=()=>refreshStudent(true);
}
async function submitMission(e){
  e.preventDefault();if(state.busy)return;
  rememberDraft();const m=mission(state.currentId),d=getDraft(m.id);
  const error=el('formError');error.textContent='';
  if(m.type==='choice'){
    if(!d.choices?.length){error.textContent='請先選擇至少一個選項。';return;}
    if(String(d.reason||'').trim().length<6){error.textContent='請至少用 6 個字說明你的判斷。';return;}
  }else{
    if(m.type==='design'){
      if(!d.area||!d.task?.trim()||!d.evidence?.trim()||!d.support?.trim()||!d.reason?.trim()){error.textContent='請選擇案例並完成四個討論問題。';return;}
      if([d.task,d.evidence,d.support,d.reason].some(x=>String(x).trim().length<6)){error.textContent='四個文字回應請各寫至少6字。';return;}
    }else if(!d.task?.trim()||!d.evidence?.trim()||d.task.trim().length<6||d.evidence.trim().length<6){error.textContent='請完成出口票的兩句話（每句至少6字）。';return;}
  }
  state.busy=true;el('saveBtn').disabled=true;el('saveBtn').textContent='正在儲存到 Google Sheet…';
  try{
    await apiPost('save',{name:state.name,missionId:m.id,choices:d.choices||[],reason:String(d.reason||'').trim(),area:d.area||'',task:String(d.task||'').trim(),evidence:String(d.evidence||'').trim(),support:String(d.support||'').trim(),sharePublic:!!d.sharePublic});
    state.student=await apiGet({action:'student',name:state.name});
    const saved=state.student.missions?.[m.id]?.myAnswer;
    if(!saved)throw new Error('找不到最新作答；請更新查看是否已儲存。');
    state.drafts[m.id]=saved;
    renderGame();showToast('第 '+missionIndex(m.id)+' 關已儲存！下次用同一姓名可以繼續修改。');
  }catch(err){if(el('formError'))el('formError').textContent=err.message||'儲存失敗';if(el('saveBtn')){el('saveBtn').disabled=false;el('saveBtn').textContent='重新送出這一關';}}
  finally{state.busy=false;}
}
async function refreshStudent(manual=false){
  if(state.busy)return;
  if(manual)rememberDraft();
  try{const result=await apiGet({action:'student',name:state.name});state.student=result;
    if(!manual && /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
    renderGame();if(manual)showToast('已更新最新完成數與全班結果。');
  }catch(err){if(manual)showToast('更新失敗：'+err.message);}
}

/* 主持教師檢視與公布 */
function renderHostLogin(){
  modeLabel.textContent='HOST CONTROL / 教師看板';headerAction.hidden=true;
  app.innerHTML=`<main class="page-main">${demoNotice()}
    <div class="teacher-hero"><div><span class="eyebrow">FACILITATOR DESK</span><h1>主持教師看板</h1><p>掌握各關完成情況，決定何時開放全班結果。</p></div><span class="mini-badge">教師專用</span></div>
    <section class="intro-panel"><div class="intro-card"><h2>輸入主持人密碼</h2><p>這個密碼設定在 Google Apps Script 後端，請勿放進公開的 GitHub 程式碼。</p>
      <form id="hostLoginForm"><label class="form-label" for="hostPin">教師密碼</label><input class="text-input" id="hostPin" type="password" minlength="4" autocomplete="off" required placeholder="請輸入 Code.gs 的 HOST_PIN">
      <div class="actions" style="margin-top:20px"><button class="btn" id="hostLoginBtn" type="submit">進入看板 →</button></div><p class="error-label" id="hostError" role="alert"></p></form></div>
      <div class="intro-card"><h2>這個看板可以做什麼？</h2><p>查看各任務完成數、每位參與者的最新回答、設定預計人數、公開或收回某一關的彙整結果，以及匯出 CSV。</p>
      <div class="notice">請只在自己的裝置上使用主持教師密碼。課堂連結與教師看板網址可以相同，但不要將密碼告訴學生。</div></div></section></main>`;
  el('hostLoginForm').onsubmit=hostLogin;
}
async function hostLogin(e){
  e.preventDefault();const pin=el('hostPin').value.trim();const btn=el('hostLoginBtn');btn.disabled=true;btn.textContent='正在讀取看板…';
  try{const result=await apiGet({action:'admin',pin});state.hostPin=pin;state.admin=result;renderHost();}
  catch(err){el('hostError').textContent=err.message||'密碼錯誤';btn.disabled=false;btn.textContent='進入看板 →';}
}
function renderHost(){
  modeLabel.textContent='HOST CONTROL / 教師看板';headerAction.hidden=false;headerAction.textContent='登出教師看板';headerAction.onclick=()=>{state.hostPin='';state.admin=null;renderHostLogin();};
  const a=state.admin||{},people=a.participants||[],answers=a.answers||[];
  const totalDone=answers.filter(x=>MISSIONS.some(m=>m.id===x.missionId)).length;
  const activeMission=(a.currentMission||MISSIONS[0].id);
  const tableRows=answers.filter(x=>x.missionId===activeMission).sort((x,y)=>(x.name||'').localeCompare(y.name||'','zh-Hant'));
  app.innerHTML=`<main class="page-main">${demoNotice()}
    <div class="teacher-hero"><div><span class="eyebrow">LIVE CLASSROOM / COMMAND CENTER</span><h1>課堂即時結果總覽</h1><p>講師端可看姓名和完整文字；一般學員只會看到已公布的統計與同意公開的文字。</p></div>
      <button class="btn secondary small" type="button" id="hostRefresh">↻ 更新資料</button></div>
    <div class="teacher-layout">
      <section class="teacher-card"><h2>課堂進度</h2>
        <div class="metric-row"><div class="metric"><strong>${people.length}</strong><span>登入人數</span></div><div class="metric"><strong>${totalDone}</strong><span>各關提交合計</span></div><div class="metric"><strong>${MISSIONS.filter(m=>a.missions?.[m.id]?.released).length}</strong><span>已公布關卡</span></div></div>
        <div class="section-separator"></div>
        <label class="form-label" for="targetCount">預計參與人數（達標後自動公布該關）</label>
        <div class="actions"><input class="text-input" style="width:125px" id="targetCount" type="number" min="0" max="200" step="1" value="${a.expectedCount||0}"><button class="btn small" type="button" id="setCount">儲存人數</button></div>
        <p class="hint">設 0 表示停用自動公布，由你逐關按「公布」。例如設定 20：某一關有 20 位學員完成時，該關自動顯示結果。</p>
      </section>
      <section class="teacher-card"><h2>分關結果公布</h2><p>先讓大家作答，再逐關公布統計。文字回應須經填答者同意，且由教師另按「開放文字」才會顯示。</p>
        ${MISSIONS.map(m=>{const x=a.missions?.[m.id]||{};return `<div class="teacher-mission"><div><strong>${missionIndex(m.id)}．${esc(m.short)}</strong><small>${x.count||0} 人已提交｜${x.released?'結果已開放':'結果尚未公開'}</small></div><div class="teacher-controls"><span class="mini-badge ${x.released?'':'grey'}">${x.released?'開放':'鎖定'}</span><button class="btn small secondary" data-comments="${m.id}" data-comments-value="${x.commentsOpen?'0':'1'}">${x.commentsOpen?'隱藏文字':'開放文字'}</button><button class="btn small ${x.manualReveal?'secondary':''}" data-reveal="${m.id}" data-reveal-value="${x.manualReveal?'0':'1'}">${x.manualReveal?'收回公布':'公布'}</button></div></div>`;}).join('')}
        <p class="hint">注意：已達預計人數的關卡會自動開放；若想收回，需先將預計人數改為 0，並關閉手動公布。</p>
      </section>
      <section class="teacher-card"><h2>登入名單</h2><p>姓名僅供講師查核，學員端不會公開此名單。</p>
        <div class="teacher-roster">${people.map(x=>`<span>${esc(x.name)}</span>`).join('')||'<span>尚未有人登入</span>'}</div>
      </section>
      <section class="teacher-card"><h2>使用方法</h2><div class="notice teal">① 分享一般連結給學員<br>② 使用看板觀察提交人數<br>③ 公布此關結果<br>④ 請學員按右側「更新」，比較全班的觀點</div>
        <div class="actions" style="margin-top:18px"><button class="btn secondary small" type="button" id="copyStudentLink">複製學員連結</button><button class="btn small" type="button" id="downloadCsv">匯出所有回答 CSV</button></div>
      </section>
      <section class="teacher-card full"><div class="subbar"><h2>完整作答紀錄（教師可見）</h2><select id="teacherMissionSelect" class="table-mission-select" aria-label="檢視關卡">${MISSIONS.map(m=>`<option value="${m.id}" ${m.id===activeMission?'selected':''}>${missionIndex(m.id)}．${esc(m.short)}</option>`).join('')}</select></div>
      <div class="scroll-table"><table class="answer-table"><thead><tr><th>姓名</th><th>選擇／案例</th><th>理由／紀錄指標</th><th>觀察事實／課後觀察</th><th>待釐清／蒐證方法</th><th>兩種蒐證方式</th><th>公開同意</th></tr></thead><tbody>
      ${tableRows.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.choices?.length?x.choices.join('、'):x.area||'—')}</td><td>${esc(x.reason||'—')}</td><td>${esc(x.task||'—')}</td><td>${esc(x.evidence||'—')}</td><td>${esc(x.support||'—')}</td><td>${x.sharePublic?'同意':'不公開'}</td></tr>`).join('')||'<tr><td colspan="7">這一關還沒有作答紀錄。</td></tr>'}
      </tbody></table></div></section>
    </div></main>`;
  el('hostRefresh').onclick=()=>refreshHost(true);
  el('setCount').onclick=()=>hostUpdate('expectedCount',{value:el('targetCount').value});
  app.querySelectorAll('[data-reveal]').forEach(b=>b.onclick=()=>hostUpdate('reveal',{missionId:b.dataset.reveal,value:b.dataset.revealValue==='1'}));
  app.querySelectorAll('[data-comments]').forEach(b=>b.onclick=()=>hostUpdate('comments',{missionId:b.dataset.comments,value:b.dataset.commentsValue==='1'}));
  el('teacherMissionSelect').onchange=(e)=>{state.admin.currentMission=e.target.value;renderHost();};
  el('downloadCsv').onclick=downloadCsv;
  el('copyStudentLink').onclick=()=>{const url=new URL(location.href);url.search='';url.hash='';navigator.clipboard.writeText(url.toString()).then(()=>showToast('已複製學員頁面連結。')).catch(()=>showToast('無法複製；請手動複製移除 ?mode=host 的網址。'));};
}
async function refreshHost(manual=false){
  if(state.busy)return;
  try{const x=await apiGet({action:'admin',pin:state.hostPin});x.currentMission=state.admin?.currentMission||MISSIONS[0].id;state.admin=x;renderHost();if(manual)showToast('已取得最新的課堂作答。');}
  catch(err){if(manual)showToast('看板更新失敗：'+err.message);}
}
async function hostUpdate(operation,rest){
  if(state.busy)return;state.busy=true;
  try{await apiPost('hostUpdate',{pin:state.hostPin,operation,...rest});const x=await apiGet({action:'admin',pin:state.hostPin});x.currentMission=state.admin?.currentMission||MISSIONS[0].id;state.admin=x;renderHost();showToast('設定已更新。');}
  catch(err){showToast('設定未確認：'+err.message);}
  finally{state.busy=false;}
}
function csvValue(s){return '"'+String(s??'').replace(/"/g,'""').replace(/^[=+\-@]/,'\'$&')+'"';}
function downloadCsv(){
  const rows=[['姓名','投影片任務','選項','小組案例','判斷理由／紀錄指標','觀察事實／課後觀察','待釐清能力／課後蒐證方法','兩種蒐證方式','同意公開','更新時間'],...(state.admin?.answers||[]).map(x=>[x.name,x.missionId,(x.choices||[]).join('、'),x.area,x.reason,x.task,x.evidence,x.support,x.sharePublic?'是':'否',x.updatedAt])];
  const csv='\ufeff'+rows.map(row=>row.map(csvValue).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='評量偵探室_課堂作答_'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},300);
}

/* 頁面初始化 */
if(PARAMS.get('resetDemo')==='1'&&DEMO){localStorage.removeItem(LS_DEMO);}
if(HOST_MODE)renderHostLogin();else renderLanding();
setInterval(()=>{
  if(DEMO||state.busy)return;
  if(HOST_MODE&&state.hostPin){refreshHost(false);return;}
  if(state.name&&state.student){refreshStudent(false);}
},45000);
