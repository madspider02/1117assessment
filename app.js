/* 評量偵探室 — GitHub Pages 靜態前端 */
'use strict';

const CFG = window.ASSESSMENT_GAME_CONFIG || {};
const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.get('demo') === '1' || !String(CFG.API_URL || '').trim();
const HOST_MODE = PARAMS.get('mode') === 'host';
const LS_DEMO = 'assessment-lab-slide-sync-v2-demo';
const LS_LAST_NAME = 'assessment-lab-v1-last-name';
const LS_DRAFT_PREFIX = 'assessment-lab-slide-sync-v2-draft-';
const API_VERSION = 'slidesync-2026-11-v4-wall';
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


/* 語音轉文字：只改前端，伺服器仍然只收到文字答案。 */
const SpeechEngine = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let voiceSession = null;

function cancelVoice(silent=true) {
  const old=voiceSession;
  if(!old)return;
  if(silent){
    voiceSession=null;
    old.textarea.readOnly=false;
    try{old.engine.abort();}catch(_){}
    return;
  }
  if(!old.stopping){
    old.stopping=true;
    old.button.textContent='正在停止…';
    old.status.textContent='正在整理辨識文字，請稍候。';
    try{old.engine.stop();}catch(_){
      old.button.textContent='🎙 開始語音輸入';
      old.textarea.readOnly=false;
      voiceSession=null;
    }
  }
}

function combineSpoken(base,spoken){
  const prior=String(base||'').trimEnd();
  const now=String(spoken||'').trim();
  if(!now)return prior;
  return prior+(prior&&!/[\s\n，。；！？：]$/.test(prior)?' ':'')+now;
}

function addVoiceControls(){
  const form=document.getElementById('missionForm');
  if(!form)return;
  form.querySelectorAll('textarea').forEach(textarea=>{
    if(textarea.nextElementSibling?.classList.contains('voice-tools'))return;
    const line=document.createElement('div');
    line.className='voice-tools';
    const button=document.createElement('button');
    button.className='voice-btn';
    button.type='button';
    button.textContent='🎙 語音輸入';
    button.setAttribute('aria-pressed','false');
    const status=document.createElement('span');
    status.className='voice-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.textContent=SpeechEngine
      ?'說完後可直接修改文字，再按「送出」。'
      :'此瀏覽器未提供網頁語音辨識；可用手機鍵盤的麥克風聽寫。';
    if(!SpeechEngine){button.disabled=true;button.title='目前瀏覽器不支援網頁語音辨識';}
    else button.addEventListener('click',()=>toggleSpeech(textarea,button,status));
    line.append(button,status);
    textarea.insertAdjacentElement('afterend',line);
  });
  const share=form.querySelector('.checkline');
  if(share){
    const note=document.createElement('p');
    note.className='voice-privacy';
    note.textContent='語音先轉為文字，確認後才送出；本站不另行儲存錄音。語音辨識可能由瀏覽器服務處理，請勿說出可識別學生身分的資訊。';
    share.before(note);
  }
}

function toggleSpeech(textarea,button,status){
  if(voiceSession?.textarea===textarea){cancelVoice(false);return;}
  cancelVoice(true);
  if(!SpeechEngine){status.textContent='此瀏覽器未支援語音辨識。';return;}
  if(!window.isSecureContext){status.textContent='麥克風需要安全連線。請從 HTTPS 的 GitHub Pages 網址開啟。';return;}
  let engine;
  try{engine=new SpeechEngine();}catch(_){status.textContent='無法啟動語音辨識，請直接輸入文字。';return;}
  engine.lang='zh-TW';
  engine.continuous=true;
  engine.interimResults=true;
  engine.maxAlternatives=1;
  const session={engine,textarea,button,status,base:textarea.value,gotText:false,stopping:false,error:''};
  voiceSession=session;
  textarea.readOnly=true; // 避免辨識進行中打字內容被中途結果覆蓋
  button.textContent='■ 停止聆聽';
  button.classList.add('is-listening');
  button.setAttribute('aria-pressed','true');
  status.textContent='準備開啟麥克風，請允許權限…';
  engine.onstart=()=>{
    if(voiceSession===session)status.textContent='🔴 正在聆聽…說完按「停止聆聽」。';
  };
  engine.onresult=(event)=>{
    if(voiceSession!==session || !textarea.isConnected)return;
    let spoken='';
    let hasFinal=false;
    for(let i=0;i<event.results.length;i++){
      const res=event.results[i];
      if(res.isFinal)hasFinal=true;
      spoken+=String(res[0]?.transcript||'').trim();
    }
    const text=combineSpoken(session.base,spoken);
    const limit=textarea.maxLength>0?textarea.maxLength:5000;
    textarea.value=text.slice(0,limit);
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
    session.gotText=!!spoken;
    status.textContent=text.length>limit-5
      ?'已接近文字上限，請停止並檢查內容。'
      :hasFinal?'已辨識成文字，可繼續說或按停止。':'正在辨識…';
    if(text.length>=limit){try{engine.stop();}catch(_){}}
  };
  engine.onerror=(event)=>{
    if(voiceSession!==session)return;
    const messages={
      'not-allowed':'未取得麥克風權限。請在瀏覽器允許麥克風。',
      'service-not-allowed':'瀏覽器阻止語音辨識服務。請改用手機鍵盤聽寫。',
      'no-speech':'沒有收到聲音，請按麥克風重試。',
      'audio-capture':'找不到可用的麥克風，請檢查裝置設定。',
      'network':'語音辨識服務連線失敗，請檢查網路。',
      'language-not-supported':'目前裝置不支援繁體中文語音辨識。'
    };
    session.error=messages[event.error]||'語音辨識暫時無法使用，請改用打字。';
    status.textContent=session.error;
  };
  engine.onend=()=>{
    if(voiceSession!==session)return;
    voiceSession=null;
    textarea.readOnly=false;
    button.textContent='🎙 再次語音輸入';
    button.classList.remove('is-listening');
    button.setAttribute('aria-pressed','false');
    if(!session.error){
      status.textContent=session.gotText
        ?'已完成語音轉文字，請檢查後再按「送出」。'
        :'未收到可辨識的語音，可重試或直接打字。';
    }
  };
  try{engine.start();}catch(_){
    voiceSession=null;
    textarea.readOnly=false;
    button.textContent='🎙 語音輸入';
    button.classList.remove('is-listening');
    button.setAttribute('aria-pressed','false');
    status.textContent='無法啟動麥克風，請檢查瀏覽器權限或改用打字。';
  }
}

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
function getDraft(id){return state.drafts[id]||(state.student?.missions?.[id]?.myAnswer)||{choices:[],reason:'',area:'',task:'',evidence:'',support:'',sharePublic:true};}
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
  if(['health','student','admin'].includes(query.action) && data.version!==API_VERSION) throw new Error('你的 Google Apps Script 尚未更新到「全班觀點牆 v4」。請更新 Code.gs 並編輯現有 Web App 部署。');
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
  const comments=released?rows.filter(x=>x.sharePublic).map((x,i)=>({name:'匿名觀點 '+String(i+1).padStart(2,'0'),choices:x.choices||[],reason:x.reason,area:x.area,task:x.task,evidence:x.evidence,support:x.support})).slice(0,200):[];
  return {count:rows.length,released,commentsOpen:released,unlocked:released&&!!myAnswer,myAnswer,result:released&&myAnswer?{count:rows.length,options,comments}:null};
}
function demoGet(q){
  const db=readDemo();
  if(q.action==='receipt')return {ok:true,received:!!db.receipts[q.requestId]};
  if(q.action==='student')return {ok:true,name:q.name,exists:!!db.people[keyName(q.name)],participantCount:Object.keys(db.people).length,expectedCount:db.expectedCount,missions:Object.fromEntries(MISSIONS.map(m=>[m.id,getDemoTask(db,m,q.name)]))};
  if(q.action==='admin'){
    if(!String(q.pin||''))return {ok:false,error:'請輸入主持人密碼（試玩模式可任意輸入）。'};
    return {ok:true,expectedCount:db.expectedCount,participants:Object.values(db.people),missions:Object.fromEntries(MISSIONS.map(m=>{const x=getDemoTask(db,m,'');return [m.id,{count:x.count,manualReveal:!!db.releases[m.id],released:x.released,commentsOpen:x.released}]})),answers:Object.values(db.answers)};
  }
  return {ok:false,error:'未知的操作'};
}

function renderLanding(){
  cancelVoice(true);
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
        <div class="step-tile"><span class="step-icon">03</span><div><strong>一起討論｜看見全班的不同觀點</strong><p>全班達到設定人數，或主持教師公布後，即可閱讀已同意分享的匿名觀點。</p></div></div>
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
      <label class="checkline share-consent"><input id="sharePublic" type="checkbox" ${d.sharePublic?'checked':''}>
      <span><strong>同意匿名分享</strong>：我願意在教師公布後，讓同學閱讀本題的文字回答（<strong>不顯示姓名</strong>）。新作答預設勾選，可取消；過去未同意公開的作答不會自動曝光。</span></label>
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
    const replies=result.comments||[];
    const comments=replies.slice(0,3).map(c=>`<div class="peer-comment"><b>${esc(c.name||'匿名觀點')}</b>${m.type==='choice'?`<p><span class="mini-badge">選擇 ${esc((c.choices||[]).join('、')||'—')}</span></p><p>${esc(c.reason||'')}</p>`:m.type==='design'?`<p><strong>${esc(c.area||'')}</strong>｜觀察：${esc(c.task||'')}</p><p>待釐清：${esc(c.evidence||'')}</p><p>蒐證方式：${esc(c.support||'')}</p><p>紀錄指標：${esc(c.reason||'')}</p>`:`<p>想觀察：${esc(c.task||'')}</p><p>蒐證方式：${esc(c.evidence||'')}</p>`}</div>`).join('');
    body=`<div class="mini-badge" style="margin:5px 0 12px">已公布 · 全班統整</div>${stats}
      <p class="stat-note">${m.type==='reflection'?'出口票為開放式回應，不設選項長條圖。': '百分比以提交此關的人數為分母；不同判斷可以一起討論。'}</p>
      <h4 class="comment-title">全班匿名觀點牆 · ${replies.length} 則</h4><div class="result-list">${comments||'<p class="stat-note">尚未有學員同意分享文字；請提醒大家勾選「同意匿名分享」並更新回答。</p>'}</div>
      <button class="btn wall-open-btn" type="button" data-open-wall="${m.id}">▦ 開啟全螢幕觀點牆（${replies.length} 則）</button>`;
  }
  return `<aside class="right-card" id="resultsPane">
    <div class="result-top"><h3>全班觀點</h3><button class="btn ghost small" type="button" data-refresh>↻ 更新</button></div>
    <div class="stat-note">完成自己的任務，再看大家如何思考。</div>${status}${body}
    <div class="result-guidance">💡 <strong>帶領討論：</strong>不同答案代表不同評量切入點。請比較「已經知道什麼」與「還需要蒐集什麼」。</div>
  </aside>`;
}
function renderGame(){
  cancelVoice(true);
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
  app.querySelectorAll('[data-open-wall]').forEach(b=>b.onclick=()=>openStudentWall(b.dataset.openWall));
  el('missionForm').onsubmit=submitMission;
  addVoiceControls();
  el('missionForm').querySelectorAll('textarea,select,input').forEach(control=>{control.addEventListener('input',rememberDraft);control.addEventListener('change',rememberDraft);});
  const next=qs('[data-next]');next.onclick=()=>{rememberDraft();const i=MISSIONS.findIndex(x=>x.id===state.currentId);state.currentId=MISSIONS[(i+1)%MISSIONS.length].id;renderGame();};
  qs('[data-refresh]').onclick=()=>refreshStudent(true);
}
async function submitMission(e){
  e.preventDefault();if(state.busy)return;
  if(voiceSession){cancelVoice(false);el('formError').textContent='請先停止語音輸入，檢查辨識文字後再送出。';return;}
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
  cancelVoice(true);
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
    <div class="teacher-hero"><div><span class="eyebrow">LIVE CLASSROOM / COMMAND CENTER</span><h1>課堂即時結果總覽</h1><p>講師端可核對完整姓名；學員觀點牆只顯示已同意分享的匿名文字。</p></div>
      <button class="btn secondary small" type="button" id="hostRefresh">↻ 更新資料</button></div>
    <div class="teacher-layout">
      <section class="teacher-card"><h2>課堂進度</h2>
        <div class="metric-row"><div class="metric"><strong>${people.length}</strong><span>登入人數</span></div><div class="metric"><strong>${totalDone}</strong><span>各關提交合計</span></div><div class="metric"><strong>${MISSIONS.filter(m=>a.missions?.[m.id]?.released).length}</strong><span>已公布關卡</span></div></div>
        <div class="section-separator"></div>
        <label class="form-label" for="targetCount">預計參與人數（達標後自動公布該關）</label>
        <div class="actions"><input class="text-input" style="width:125px" id="targetCount" type="number" min="0" max="200" step="1" value="${a.expectedCount||0}"><button class="btn small" type="button" id="setCount">儲存人數</button></div>
        <p class="hint">設 0 表示停用自動公布，由你逐關按「公布」。例如設定 20：某一關有 20 位學員完成時，該關自動顯示結果。</p>
      </section>
      <section class="teacher-card"><h2>一鍵公布全班觀點牆</h2><p>先讓大家獨立作答，再按「公布觀點牆」：統計與同意分享的匿名文字會同時出現。原本未同意的舊答案不會曝光。</p>
        ${MISSIONS.map(m=>{const x=a.missions?.[m.id]||{};return `<div class="teacher-mission"><div><strong>${missionIndex(m.id)}．${esc(m.short)}</strong><small>${x.count||0} 人已提交｜${x.released?'結果已開放':'結果尚未公開'}</small></div><div class="teacher-controls"><span class="mini-badge ${x.released?'':'grey'}">${x.released?'開放':'鎖定'}</span><button class="btn small secondary" data-host-wall="${m.id}" ${x.released?'':'disabled'}>▦ 投影觀點牆</button><button class="btn small ${x.manualReveal?'secondary':''}" data-reveal="${m.id}" data-reveal-value="${x.manualReveal?'0':'1'}">${x.manualReveal?'收回公布':'公布觀點牆'}</button></div></div>`;}).join('')}
        <p class="hint">注意：已達預計人數的關卡會自動開放；若想收回，需先將預計人數改為 0，並關閉手動公布。</p>
      </section>
      <section class="teacher-card"><h2>登入名單</h2><p>姓名僅供講師查核，學員端不會公開此名單。</p>
        <div class="teacher-roster">${people.map(x=>`<span>${esc(x.name)}</span>`).join('')||'<span>尚未有人登入</span>'}</div>
      </section>
      <section class="teacher-card"><h2>使用方法</h2><div class="notice teal">① 分享一般連結給學員<br>② 使用看板觀察提交人數<br>③ 公布此關結果<br>④ 請學員按右側「更新」並展開觀點牆比較大家的想法</div>
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
  app.querySelectorAll('[data-host-wall]').forEach(b=>b.onclick=()=>openHostWall(b.dataset.hostWall));
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


/* v4｜全班匿名觀點牆：只呈現學員明確同意分享的文字，不曝光姓名。 */
function wallEntryHtml(m,c){
  const choice=m.type==='choice'?`<div class="wall-tag">選擇 ${esc((c.choices||[]).join('、')||'—')}</div>`:'';
  const area=m.type==='design'?`<div class="wall-tag">${esc(c.area||'')}</div>`:'';
  const blocks=m.type==='choice'
    ?`<div class="wall-copy">${esc(c.reason||'')}</div>`
    :m.type==='design'
    ?`<div class="wall-item-label">觀察到的表現</div><div class="wall-copy">${esc(c.task||'')}</div>
      <div class="wall-item-label">待釐清能力</div><div class="wall-copy">${esc(c.evidence||'')}</div>
      <div class="wall-item-label">兩種蒐證方式</div><div class="wall-copy">${esc(c.support||'')}</div>
      <div class="wall-item-label">評量紀錄指標</div><div class="wall-copy">${esc(c.reason||'')}</div>`
    :`<div class="wall-item-label">回到班上想觀察</div><div class="wall-copy">${esc(c.task||'')}</div>
      <div class="wall-item-label">蒐集證據的方法</div><div class="wall-copy">${esc(c.evidence||'')}</div>`;
  const code=(c.choices||[]).join(',');
  return `<article class="wall-entry" data-wall-answer="${esc(code)}"><div class="wall-entry-head"><span class="wall-avatar">✦</span><strong>${esc(c.name||'匿名觀點')}</strong></div>${choice}${area}${blocks}</article>`;
}
function buildWall(m,result){
  const old=document.querySelector('.wall-shade');if(old)old.remove();
  const count=Number(result?.count||0),comments=result?.comments||[];
  const optButtons=m.type==='choice'?`<div class="wall-filters" role="group" aria-label="篩選回答選項">
    <button type="button" class="wall-filter selected" data-wall-filter="all">全部回答</button>
    ${m.options.map(([id,label])=>`<button type="button" class="wall-filter" data-wall-filter="${esc(id)}">選 ${esc(id)}</button>`).join('')}</div>`:'';
  const opts=result?.options||[];
  const bars=opts.map(o=>{
    const pct=count?Math.round((Number(o.count)||0)/count*100):0;
    const label=m.type==='choice'?`${o.id}｜${o.label}`:o.label;
    return `<div class="wall-stat"><div><b>${esc(label)}</b><span>${o.count} 人 · ${pct}%</span></div><div class="wall-track"><span style="width:${pct}%"></span></div></div>`;
  }).join('');
  const backdrop=document.createElement('div');backdrop.className='wall-shade';
  const previous=document.activeElement;
  backdrop.innerHTML=`<section class="wall-sheet" role="dialog" aria-modal="true" aria-labelledby="wallTitle" tabindex="-1">
    <div class="wall-top"><div><span class="wall-eyebrow">CLASSROOM PERSPECTIVES / 投影片 ${esc(m.slide)}</span><h2 id="wallTitle">${esc(m.short)}｜全班觀點牆</h2><p>每個人看到同一個案例，卻可能選擇不同的評量切入點。</p></div><button type="button" class="wall-close" aria-label="關閉觀點牆">✕ 關閉</button></div>
    <div class="wall-toolbar"><div><strong>${count} 人</strong><span>已完成本關</span></div><div><strong>${comments.length} 則</strong><span>同意匿名分享</span></div><div class="wall-prompt">${m.type==='choice'?'比較選項差異及文字判斷依據':m.type==='design'?'比較三個案例的蒐證設計':'比較各位老師想回教室觀察的項目'}</div></div>
    ${bars?`<div class="wall-summary">${bars}</div>`:''}
    <div class="wall-headline"><h3>大家怎麼想？</h3><span id="wallVisibleCount">${comments.length} 則觀點</span></div>
    ${optButtons}
    <div class="wall-grid" id="wallGrid">${comments.length?comments.map(c=>wallEntryHtml(m,c)).join(''):'<div class="wall-empty">目前沒有學員同意分享本關文字。<br>請提醒老師在原題勾選「同意匿名分享」並更新回答。</div>'}</div>
    <p class="wall-footer-note">只顯示經填答者同意分享的文字，不顯示姓名；請勿輸入學生姓名或可辨識個案的資料。持有課堂連結的人可能看到已公布內容。</p>
  </section>`;
  const close=()=>{backdrop.remove();document.body.classList.remove('wall-open');document.removeEventListener('keydown',onKey);if(previous?.isConnected)previous.focus();};
  const onKey=e=>{if(e.key==='Escape')close();};
  backdrop.querySelector('.wall-close').onclick=close;
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});
  backdrop.querySelectorAll('[data-wall-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    const f=btn.dataset.wallFilter;
    backdrop.querySelectorAll('[data-wall-filter]').forEach(b=>b.classList.toggle('selected',b===btn));
    let visible=0;
    backdrop.querySelectorAll('.wall-entry').forEach(card=>{
      const yes=f==='all'||(card.dataset.wallAnswer||'').split(',').includes(f);
      card.hidden=!yes;if(yes)visible++;
    });
    const countEl=backdrop.querySelector('#wallVisibleCount');if(countEl)countEl.textContent=visible+' 則觀點';
  }));
  document.body.append(backdrop);document.body.classList.add('wall-open');
  backdrop.querySelector('.wall-sheet').focus();
  document.addEventListener('keydown',onKey);
}
async function openStudentWall(missionId){
  const m=mission(missionId),x=state.student?.missions?.[missionId];
  if(!x?.myAnswer){showToast('請先完成這一關，再查看全班觀點。');return;}
  if(!x?.released){showToast('老師尚未公布這一關。');return;}
  // 重新取得最新資料，避免看見尚未更新的結果。
  try{const r=await apiGet({action:'student',name:state.name});state.student=r;const x2=r.missions?.[missionId];if(!x2?.unlocked){showToast('全班結果尚未開放。');return;}buildWall(m,x2.result);}
  catch(e){showToast('觀點牆讀取失敗：'+e.message);}
}
function openHostWall(missionId){
  const m=mission(missionId),a=state.admin;
  if(!a?.missions?.[missionId]?.released){showToast('請先公布這一關，再投影觀點牆。');return;}
  const rows=(a.answers||[]).filter(x=>x.missionId===missionId);
  const comments=rows.filter(x=>x.sharePublic).map((x,i)=>({
    name:'匿名觀點 '+String(i+1).padStart(2,'0'),choices:x.choices||[],reason:x.reason,area:x.area,
    task:x.task,evidence:x.evidence,support:x.support
  }));
  const options=m.type==='choice'?m.options.map(([id,label])=>({id,label,count:rows.filter(x=>(x.choices||[]).includes(id)).length}))
    :m.type==='design'?m.areas.map(id=>({id,label:id,count:rows.filter(x=>x.area===id).length})):[];
  buildWall(m,{count:rows.length,options,comments});
}

/* 頁面初始化 */
if(PARAMS.get('resetDemo')==='1'&&DEMO){localStorage.removeItem(LS_DEMO);}
if(HOST_MODE)renderHostLogin();else renderLanding();
setInterval(()=>{
  if(DEMO||state.busy)return;
  if(HOST_MODE&&state.hostPin){refreshHost(false);return;}
  if(state.name&&state.student){refreshStudent(false);}
},45000);
