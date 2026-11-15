/* 評量偵探室 — GitHub Pages 靜態前端 */
'use strict';

const CFG = window.ASSESSMENT_GAME_CONFIG || {};
const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.get('demo') === '1' || !String(CFG.API_URL || '').trim();
const HOST_MODE = PARAMS.get('mode') === 'host';
const LS_DEMO = 'assessment-lab-v1-demo';
const LS_LAST_NAME = 'assessment-lab-v1-last-name';
const LS_DRAFT_PREFIX = 'assessment-lab-v1-draft-';
const MISSIONS = [
  {
    id:'M1', short:'誰在說話？', type:'choice', section:'語言 × 溝通', title:'不回答，就代表不會溝通嗎？',
    caseText:'小安，4 歲半。老師問「你要不要喝水？」他經常不回答；但想玩積木時，會拉著老師走到櫃子前，再指向積木。',
    question:'如果只能先選一項，你最想進一步蒐集哪種證據？', instruction:'單選｜沒有唯一標準答案，請說明你的判斷依據。',
    options:[['A','他能否理解日常口語指令'],['B','他是否能用口語表達自己的需求'],['C','他如何使用手勢、指認與眼神來溝通'],['D','他的握筆與剪貼能力如何']], max:1,
    reasonLabel:'你為什麼選這一項？還想知道什麼？', insight:'先區分「已觀察到的溝通方式」與「尚未確認的語言能力」，不要用有沒有說話直接判斷溝通。'
  },
  {
    id:'M2', short:'找出證據', type:'choice', section:'語言 × 溝通', title:'會跟著說，就表示聽懂了嗎？',
    caseText:'小潔，5 歲。她能跟著老師重複短句，也會說出圖片名稱；但遇到兩步驟指令時常停住，在自由遊戲中也較少與同伴交談。',
    question:'若要蒐集更有用的證據，你會優先採用哪兩種方式？', instruction:'最多選兩項｜想想哪些資料能幫助我們區分理解、表達與互動。',
    options:[['A','在不同情境觀察她理解與執行指令的表現'],['B','只記錄她能重複多少個詞語'],['C','蒐集自由遊戲中的語言與互動樣本'],['D','直接依單次表現判定語言障礙']], max:2,
    reasonLabel:'你會記錄什麼具體行為作為評量證據？', insight:'自然情境觀察、語言樣本與指令理解紀錄可以相互補充；重複說話不能單獨代表理解。'
  },
  {
    id:'M3', short:'拆解動作', type:'choice', section:'知覺 × 動作', title:'剪不好，是手不好還是看不懂？',
    caseText:'小芸，5 歲半。她能指出並說出圓形與三角形，但沿線剪圓時經常偏離線條，仿畫圖形也不夠穩定。',
    question:'目前最值得先釐清的能力有哪些？', instruction:'最多選兩項｜選完後，請提出還需要的觀察證據。',
    options:[['A','視知覺辨識與圖形區辨'],['B','手部控制與精細動作'],['C','視覺訊息和動作的整合'],['D','口語發音清晰度']], max:2,
    reasonLabel:'如果要更清楚區分原因，你會再觀察什麼？', insight:'能辨認圖形，不代表執行剪貼沒有困難；要把視知覺、動作控制與視動整合分開蒐證。'
  },
  {
    id:'M4', short:'設計觀察', type:'choice', section:'知覺 × 動作', title:'一項任務，怎麼拆成兩種觀察？',
    caseText:'小宇能口頭描述圖片中的形狀，但按照圖卡用積木排出相同位置與方向時經常出錯。老師想釐清「辨識」與「操作」各自的表現。',
    question:'哪一個後續評量安排最有助於釐清？', instruction:'單選｜選出最能分辨不同能力要求的做法。',
    options:[['A','只請他多說幾次積木名稱'],['B','分別安排圖片配對與實際積木操作，觀察差異'],['C','直接判定為視知覺障礙'],['D','只記錄完成作品是否正確']], max:1,
    reasonLabel:'這個安排能幫助你區分哪些能力？', insight:'設計「分解任務」可以降低單一活動同時要求多種能力所造成的解釋混淆。'
  },
  {
    id:'M5', short:'我是評量者', type:'design', section:'專業整合', title:'換你設計一個幼兒園評量活動',
    caseText:'請從自己熟悉的幼兒園情境出發，選擇一個你最想了解的能力面向，設計一個簡短、可以在自然活動中執行的觀察方式。',
    question:'用你的經驗，完成一張「評量任務卡」。', instruction:'不用量表名稱，也不用做障礙診斷；請寫出可實際觀察的行為與紀錄方式。',
    areas:['語言理解','語言表達','功能性溝通','語用與互動','視知覺','精細動作','視動整合','粗大動作與協調'],
    insight:'好的評量設計能說清楚：觀察什麼、如何蒐證、如何區分不同解釋，以及如何回到教學支持。'
  }
];
const app = document.getElementById('app');
const modeLabel = document.getElementById('modeLabel');
const headerAction = document.getElementById('headerAction');
const credit = document.getElementById('credit');
if(CFG.FOOTER_CREDIT) credit.textContent = CFG.FOOTER_CREDIT;
const state = {name:'', currentId:'M1', student:null, hostPin:'', admin:null, drafts:{}, busy:false};
let toastTimer;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function formatCount(n){return Number(n||0).toLocaleString('zh-TW');}
function el(id){return document.getElementById(id);}
function qs(selector){return app.querySelector(selector);}
function mission(id){return MISSIONS.find(m=>m.id===id)||MISSIONS[0];}
function normalizeName(s){return String(s||'').replace(/\s+/g,' ').trim();}
function keyName(s){return normalizeName(s).normalize('NFKC').toLocaleLowerCase();}
function showToast(msg){const t=el('toast');t.textContent=msg;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4000);}
function missionCount(){return MISSIONS.filter(m=>Boolean(state.student?.missions?.[m.id]?.myAnswer)).length;}
function getDraft(id){return state.drafts[id]||(state.student?.missions?.[id]?.myAnswer)||{choices:[],reason:'',area:'',task:'',evidence:'',support:'',sharePublic:false};}
function demoNotice(){return DEMO?'<div class="notice demo-notice"><strong>本機試玩模式</strong>｜尚未設定 Apps Script 網址，資料只會存在這個瀏覽器。正式全班同步前，請先完成 README 的部署步驟。</div>':'';}
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
  const options=m.type==='choice'?m.options.map(([id,label])=>({id,label,count:rows.filter(x=>x.choices.includes(id)).length})):m.areas.map(id=>({id,label:id,count:rows.filter(x=>x.area===id).length}));
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
      <p>歡迎來到「評量偵探室」。從幼兒園日常情境出發，破解五個觀察任務，把直覺轉換成有根據的評量思考。</p>
      <div class="hero-meta"><span><i class="dot"></i><b>5 個任務</b>｜案例判讀與設計</span><span><i class="dot"></i><b>可續答</b>｜回來修改沒問題</span><span><i class="dot"></i><b>全班結果</b>｜完成後等待公布</span></div>
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
    await apiPost('join',{name});
    const result=await apiGet({action:'student',name});
    if(!result.exists)throw new Error('尚未確認登入成功，請檢查後台。');
    state.name=name;state.student=result;state.currentId='M1';state.drafts={};
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
  }else{
    d.area=el('fieldArea')?.value||'';d.task=el('fieldTask')?.value||'';d.evidence=el('fieldEvidence')?.value||'';d.support=el('fieldSupport')?.value||'';
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
    <div><label class="form-label" for="fieldArea">① 我想了解的評量面向</label><select id="fieldArea"><option value="">請選擇一個面向</option>${m.areas.map(s=>`<option value="${esc(s)}" ${d.area===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
    <div><label class="form-label" for="fieldTask">② 我會安排的觀察活動</label><textarea id="fieldTask" maxlength="500" placeholder="例如：點心時間提供兩種點心，觀察孩子如何表達需求…">${esc(d.task||'')}</textarea></div>
    <div><label class="form-label" for="fieldEvidence">③ 我要記錄的具體行為／指標</label><textarea id="fieldEvidence" maxlength="500" placeholder="例如：指認、口語、手勢；是否需要提示；在不同情境的次數…">${esc(d.evidence||'')}</textarea></div>
    <div><label class="form-label" for="fieldSupport">④ 我會如何運用評量結果</label><textarea id="fieldSupport" maxlength="500" placeholder="例如：調整指令呈現方式、提供圖片溝通或活動分解…">${esc(d.support||'')}</textarea></div>
  </div>`:'';
  return `<article class="mission-card">
    <div class="mission-head"><span class="mission-num">MISSION ${m.id.slice(1)} <span>/ 05</span></span><span class="mini-badge">${esc(m.section)}</span></div>
    <h2>${esc(m.title)}</h2><div class="case-box"><strong>CASE FILE · 觀察檔案</strong>${esc(m.caseText)}</div>
    <p class="question">${esc(m.question)}</p><p class="subquestion">${esc(m.instruction)}</p>
    <form id="missionForm">${m.type==='choice'?choiceFields:designFields}
      <label class="checkline"><input id="sharePublic" type="checkbox" ${d.sharePublic?'checked':''}>
      <span>我同意將本題的文字說明和姓名展示在全班結果中（選項統計不受此設定影響；預設不公開）。</span></label>
      <div class="mission-controls"><div><button type="submit" id="saveBtn" class="btn">${done?'更新我的回答':'送出這一關'} <span aria-hidden="true">✓</span></button>
      <p id="formError" class="error-label" role="alert"></p></div>
      <button type="button" class="btn secondary" data-next>${m.id==='M5'?'回到第一關':'下一關 →'}</button></div>
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
    const comments=(result.comments||[]).map(c=>`<div class="peer-comment"><b>${esc(c.name||'參與者')}</b>${m.type==='choice'?`<p>${esc(c.reason||'')}</p>`:`<p><strong>${esc(c.area||'')}</strong>｜${esc(c.task||'')}</p><p>紀錄：${esc(c.evidence||'')}</p><p>支持：${esc(c.support||'')}</p>`}</div>`).join('');
    body=`<div class="mini-badge" style="margin:5px 0 12px">已公布 · 全班統整</div>${stats}
      <p class="stat-note">${m.max===2?'本題可複選，因此百分比加總可能超過100%。':'百分比以提交此關的人數為分母。'}</p>
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
    <div class="game-header"><div><span class="eyebrow">LEARNING BY INVESTIGATING</span><h1 class="game-title">評量偵探室｜五個觀察任務</h1></div><div class="user-pill">目前身分：<b>${esc(state.name)}</b></div></div>
    <div class="game-layout"><nav class="mission-nav" aria-label="切換關卡"><p class="panel-label">YOUR MISSIONS</p>
    ${MISSIONS.map((x,i)=>`<button type="button" class="mission-link ${x.id===m.id?'active':''}" data-mission="${x.id}" ${x.id===m.id?'aria-current="step"':''}>
       <span class="nav-number">${i+1}</span><span class="nav-text"><strong>${esc(x.short)}</strong><small>${esc(x.section)}</small></span><span class="check">${state.student.missions?.[x.id]?.myAnswer?'✓':''}</span></button>`).join('')}
       <div class="count-card"><b>${num} <span style="font-size:13px;color:#c1e2d0">/ 5</span></b><p>已完成的觀察任務</p><div class="meter"><span style="width:${num/5*100}%"></span></div></div>
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
    if(!d.area||!d.task?.trim()||!d.evidence?.trim()||!d.support?.trim()){error.textContent='請完成評量面向、觀察活動、紀錄指標及教學支持四個欄位。';return;}
    if(d.task.trim().length<6||d.evidence.trim().length<6||d.support.trim().length<6){error.textContent='請將每個文字欄位寫得再具體一些（至少 6 字）。';return;}
  }
  state.busy=true;el('saveBtn').disabled=true;el('saveBtn').textContent='正在儲存到 Google Sheet…';
  try{
    await apiPost('save',{name:state.name,missionId:m.id,choices:d.choices||[],reason:String(d.reason||'').trim(),area:d.area||'',task:String(d.task||'').trim(),evidence:String(d.evidence||'').trim(),support:String(d.support||'').trim(),sharePublic:!!d.sharePublic});
    state.student=await apiGet({action:'student',name:state.name});
    const saved=state.student.missions?.[m.id]?.myAnswer;
    if(!saved)throw new Error('找不到最新作答；請更新查看是否已儲存。');
    state.drafts[m.id]=saved;
    renderGame();showToast('第 '+m.id.slice(1)+' 關已儲存！下次用同一姓名可以繼續修改。');
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
  const totalDone=answers.length;
  const activeMission=(a.currentMission||'M1');
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
        ${MISSIONS.map(m=>{const x=a.missions?.[m.id]||{};return `<div class="teacher-mission"><div><strong>${m.id.slice(1)}．${esc(m.short)}</strong><small>${x.count||0} 人已提交｜${x.released?'結果已開放':'結果尚未公開'}</small></div><div class="teacher-controls"><span class="mini-badge ${x.released?'':'grey'}">${x.released?'開放':'鎖定'}</span><button class="btn small secondary" data-comments="${m.id}" data-comments-value="${x.commentsOpen?'0':'1'}">${x.commentsOpen?'隱藏文字':'開放文字'}</button><button class="btn small ${x.manualReveal?'secondary':''}" data-reveal="${m.id}" data-reveal-value="${x.manualReveal?'0':'1'}">${x.manualReveal?'收回公布':'公布'}</button></div></div>`;}).join('')}
        <p class="hint">注意：已達預計人數的關卡會自動開放；若想收回，需先將預計人數改為 0，並關閉手動公布。</p>
      </section>
      <section class="teacher-card"><h2>登入名單</h2><p>姓名僅供講師查核，學員端不會公開此名單。</p>
        <div class="teacher-roster">${people.map(x=>`<span>${esc(x.name)}</span>`).join('')||'<span>尚未有人登入</span>'}</div>
      </section>
      <section class="teacher-card"><h2>使用方法</h2><div class="notice teal">① 分享一般連結給學員<br>② 使用看板觀察提交人數<br>③ 公布此關結果<br>④ 請學員按右側「更新」，比較全班的觀點</div>
        <div class="actions" style="margin-top:18px"><button class="btn secondary small" type="button" id="copyStudentLink">複製學員連結</button><button class="btn small" type="button" id="downloadCsv">匯出所有回答 CSV</button></div>
      </section>
      <section class="teacher-card full"><div class="subbar"><h2>完整作答紀錄（教師可見）</h2><select id="teacherMissionSelect" class="table-mission-select" aria-label="檢視關卡">${MISSIONS.map(m=>`<option value="${m.id}" ${m.id===activeMission?'selected':''}>${m.id.slice(1)}．${esc(m.short)}</option>`).join('')}</select></div>
      <div class="scroll-table"><table class="answer-table"><thead><tr><th>姓名</th><th>選擇／面向</th><th>理由／觀察活動</th><th>紀錄指標</th><th>支援方向</th><th>公開同意</th></tr></thead><tbody>
      ${tableRows.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.choices?.length?x.choices.join('、'):x.area||'—')}</td><td>${esc(x.reason||x.task||'')}</td><td>${esc(x.evidence||'—')}</td><td>${esc(x.support||'—')}</td><td>${x.sharePublic?'同意':'不公開'}</td></tr>`).join('')||'<tr><td colspan="6">這一關還沒有作答紀錄。</td></tr>'}
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
  try{const x=await apiGet({action:'admin',pin:state.hostPin});x.currentMission=state.admin?.currentMission||'M1';state.admin=x;renderHost();if(manual)showToast('已取得最新的課堂作答。');}
  catch(err){if(manual)showToast('看板更新失敗：'+err.message);}
}
async function hostUpdate(operation,rest){
  if(state.busy)return;state.busy=true;
  try{await apiPost('hostUpdate',{pin:state.hostPin,operation,...rest});const x=await apiGet({action:'admin',pin:state.hostPin});x.currentMission=state.admin?.currentMission||'M1';state.admin=x;renderHost();showToast('設定已更新。');}
  catch(err){showToast('設定未確認：'+err.message);}
  finally{state.busy=false;}
}
function csvValue(s){return '"'+String(s??'').replace(/"/g,'""').replace(/^[=+\-@]/,'\'$&')+'"';}
function downloadCsv(){
  const rows=[['姓名','任務','選項','評量面向','判斷理由','觀察活動','紀錄指標','教學支持','同意公開','更新時間'],...(state.admin?.answers||[]).map(x=>[x.name,x.missionId,(x.choices||[]).join('、'),x.area,x.reason,x.task,x.evidence,x.support,x.sharePublic?'是':'否',x.updatedAt])];
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
