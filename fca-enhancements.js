/* Food Choice Academy refinements — 25 Nov 2026 */
(function(){
"use strict";
if(typeof S==="undefined"||typeof App==="undefined")return;
S.writingPortfolio=Array.isArray(S.writingPortfolio)?S.writingPortfolio:[];
S.fcResumeRoute=S.fcResumeRoute||null;

/* Browser preview progress, while preserving SCORM as the primary LMS store. */
const FKEY="food_choice_academy_preview_v1";
if(!LMS.ok){
 try{
  const saved=localStorage.getItem(FKEY);
  if(saved){const parsed=JSON.parse(saved);S=Object.assign(S,parsed);S.writingPortfolio=Array.isArray(S.writingPortfolio)?S.writingPortfolio:[];}
 }catch(e){}
}
const fcaSaveBase=save;
save=function(){
 fcaSaveBase();
 if(!LMS.ok){try{localStorage.setItem(FKEY,JSON.stringify(S));}catch(e){}}
};

/* Resume at the exact unfinished step, not merely at the mission's first screen. */
const fcaGoBase=App.go.bind(App);
App.go=function(route){
 const prev=S.route||{};
 if(prev.name==="step"&&route&&route.name!=="step"){
  if(route.name==="missions"&&S.fcActiveMission==null)S.fcResumeRoute={name:"missions"};
  else S.fcResumeRoute={...prev};
 }
 if(prev.name==="fc-mission"&&route&&route.name==="missions")S.fcResumeRoute={...prev};
 if(route&&route.name==="step")S.fcResumeRoute={...route};
 if(route&&route.name==="fc-mission")S.fcResumeRoute={...route};
 if(route&&route.name==="myPortfolio"){
  this.clear();S.route=route;save();closeModal();
  document.body.classList.remove("no-bar");$("#topbar").classList.add("on");
  const app=$("#app");app.innerHTML="";
  const screen=document.createElement("div");screen.className="screen";app.appendChild(screen);
  renderMyPortfolio(screen);updateTopbar();window.scrollTo({top:0,behavior:"instant"});return;
 }
 return fcaGoBase(route);
};
if(!NAV.some(x=>x.page==="myPortfolio"))NAV.splice(1,0,{page:"myPortfolio",label:"My Project",ic:"briefcase"});
const fcaNavBase=Actions.nav;
Actions.nav=function(btn){
 if(btn&&btn.dataset.page==="myPortfolio"){App.go({name:"myPortfolio"});return;}
 return fcaNavBase(btn);
};

/* Continue always returns to the saved step. */
function nextUnfinishedTask(missionIndex){
 const m=FOOD_CHOICE_MISSIONS[missionIndex];if(!m||!m.target)return null;
 const chapter=m.target.l;
 for(let i=0;i<LESSONS[chapter].steps.length;i++){
  const st=LESSONS[chapter].steps[i];
  if(st.task&&m.requires&&m.requires.includes(st.task)&&!S.results[st.task])return {name:"step",l:chapter,s:i};
  if(st.decision&&m.decision===st.decision&&!S.decisions[m.decision])return {name:"step",l:chapter,s:i};
 }
 return null;
}
function resumeFoodChoice(){
 const saved=S.fcResumeRoute;
 if(saved&&saved.name==="step"){
  const st=LESSONS[saved.l]?.steps[saved.s];
  if(st&&(!st.task||!S.results[st.task])){App.go({...saved});return;}
  if(Number.isInteger(S.fcActiveMission)){
   const next=nextUnfinishedTask(S.fcActiveMission);if(next){App.go(next);return;}
  }
 }
 if(saved&&saved.name==="fc-mission"&&saved.i!=null&&!fcMissionDone(saved.i)){App.go({...saved});return;}
 if(Number.isInteger(S.fcActiveMission)&&!fcMissionDone(S.fcActiveMission)){
  const next=nextUnfinishedTask(S.fcActiveMission);
  if(next){S.fcResumeRoute=next;App.go(next);return;}
 }
 const nextIndex=FOOD_CHOICE_MISSIONS.findIndex((m,i)=>!fcMissionDone(i)&&fcUnlocked(i));
 const i=nextIndex<0?11:nextIndex;
 if(i===11){App.go({name:"final"});return;}
 S.fcResumeRoute={name:"fc-mission",i};save();App.go({name:"fc-mission",i});
}
Actions["resume-fc"]=resumeFoodChoice;
const fcaBriefBase=renderBrief;
renderBrief=function(el){
 fcaBriefBase(el);
 const btn=el.querySelector('[data-action="open-fc-mission"],[data-action="begin-case"]');
 if(btn){btn.textContent="Continue";btn.dataset.action="resume-fc";delete btn.dataset.mission;}
};

/* Mission 1: read the complete two-page text first, then study its vocabulary. */
const fcaOriginal3A=LESSONS[0].steps;
if(fcaOriginal3A[0]?.task==="3a-vocab"&&fcaOriginal3A[1]?.task==="3a-read"){
 const first=fcaOriginal3A[0];fcaOriginal3A[0]=fcaOriginal3A[1];fcaOriginal3A[1]=first;
}
const fcaReadingStep=LESSONS[0].steps.find(x=>x.task==="3a-read");
if(fcaReadingStep){
 const buildReading=fcaReadingStep.build;
 fcaReadingStep.build=function(b){
  buildReading(b);
  const reading=b.querySelector(".reading");if(!reading)return;
  const visual=reading.querySelector(".reading-illustration,.reading-visual,.ph");
  const paras=Array.from(reading.querySelectorAll("p"));
  const page1=document.createElement("div"),page2=document.createElement("div");
  page1.className="fca-reading-page";page2.className="fca-reading-page";page2.hidden=true;
  if(visual)page1.appendChild(visual);
  paras.forEach((p,i)=>(i<3?page1:page2).appendChild(p));
  const nav=document.createElement("div");nav.className="fca-reading-nav";
  nav.innerHTML='<span class="fca-reading-count">Page <b id="fcaReadPage">1</b> of 2</span><button type="button" class="btn btn-gold btn-sm" id="fcaReadNext">Continue to page 2 →</button>';
  reading.innerHTML="";reading.append(page1,page2,nav);
  $("#fcaReadNext",reading).addEventListener("click",()=>{
   const second=!page2.hidden;page1.hidden=second;page2.hidden=!second;
   $("#fcaReadPage",reading).textContent=second?"1":"2";
   $("#fcaReadNext",reading).textContent=second?"Continue to page 2 →":"Back to page 1";
   reading.scrollIntoView({behavior:"smooth",block:"start"});
  });
 };
}

/* Add the communicative crossword after the vocabulary work in Mission 3A. */
const fcaCrosswordWords=[
 {clue:"A nutrient found in eggs, beans, fish and meat.",answer:"FIBRE",key:2},
 {clue:"A nutrient found in butter and oil.",answer:"FAT",key:1},
 {clue:"Units used to measure the energy in food.",answer:"CALORIES",key:2},
 {clue:"A meal or food that includes a useful variety of nutrients.",answer:"SALAD",key:1},
 {clue:"A useful substance the body gets from food.",answer:"NUTRIENT",key:0},
 {clue:"Bread, pasta and rice contain these energy-giving substances.",answer:"CARBOHYDRATES",key:0},
 {clue:"Recently picked or prepared; not old.",answer:"FRESH",key:2},
 {clue:"A way of eating; the food a person usually eats.",answer:"DIET",key:0}
];
function crosswordMarkup(){
 const centre=10,cols=23;
 const rows=fcaCrosswordWords.map((w,r)=>{
  const start=centre-w.key;
  const cells=w.answer.split("").map((ch,j)=>{
   const key=j===w.key;
   return '<input class="fca-cw-cell'+(key?' fca-cw-key':'')+'" maxlength="1" inputmode="text" autocomplete="off" aria-label="Clue '+(r+1)+', letter '+(j+1)+'" data-cw-row="'+r+'" data-cw-pos="'+j+'" style="grid-column:'+(start+j+1)+';grid-row:'+(r+1)+'">';
  }).join("");
  return '<div class="fca-cw-clue"><b>'+(r+1)+'.</b> '+w.clue+'</div>'+cells;
 }).join("");
 return '<div class="fca-crossword"><div class="fca-cw-intro"><span class="tag">Communicative crossword</span><h3>Complete the vocabulary crossword</h3><p>Read each definition and enter one letter in each square. The highlighted column reveals the key word.</p></div><div class="fca-cw-layout"><div class="fca-cw-clues">'+fcaCrosswordWords.map((w,i)=>'<div><b>'+(i+1)+'.</b> '+w.clue+'</div>').join("")+'</div><div class="fca-cw-board" style="grid-template-columns:repeat('+cols+',24px);grid-template-rows:repeat('+fcaCrosswordWords.length+',34px)">'+rows+'</div></div><div class="fca-cw-actions"><button class="btn btn-gold btn-sm" id="fcaCheckCrossword">Check crossword</button><span class="fca-cw-feedback" id="fcaCwFeedback" aria-live="polite">The highlighted letters form a key word.</span></div><div class="fca-cw-sentence" id="fcaCwSentence" hidden><b>Key word: <span>BALANCED</span></b><label>Write one sentence using BALANCED and at least one expression from this mission. Use a modal verb (should, can or must) or explain your reason with because.<textarea id="fcaCwSentenceInput" rows="3" placeholder="A balanced food choice should…"></textarea></label><button class="btn btn-gold btn-sm" id="fcaCheckSentence">Check my sentence</button><p id="fcaSentenceFeedback" class="fca-cw-feedback" aria-live="polite"></p></div></div>';
}
const fcaVocabStep=LESSONS[0].steps.find(x=>x.task==="3a-vocab");
if(fcaVocabStep){
 const buildVocab=fcaVocabStep.build;
 fcaVocabStep.build=function(b){
  buildVocab(b);
  const zone=b.querySelector(".task-zone");
  if(zone)zone.insertAdjacentHTML("beforebegin",fcaTextWordCards());
 };
}
function fcaTextWordCards(){
 const terms=["single-use","biodegradable","food waste","carbon footprint","greenhouse gases","food miles","eco-friendly","recycling centre"];
 const cards=terms.map(term=>{
  const v=VOCAB.find(x=>x.t===term);if(!v)return "";
  return '<article class="fca-word-card">'+imgHTML(v.img||"food",v.t,"fca-word-photo",v.ic,false)+'<div class="fca-word-copy"><div class="fca-word-title"><b>'+esc(v.t)+'</b><button class="say-btn" data-fca-say="'+esc(v.t)+'" aria-label="Hear '+esc(v.t)+'">'+icon("vol")+'</button></div><div class="fca-ipa">'+esc(v.ipa||"")+'</div><div class="fca-word-translation">'+esc(v.ru)+'</div><p><b>Meaning:</b> '+esc(v.en)+'</p><p class="fca-word-example"><b>In context:</b> '+esc(v.ex)+'</p></div></article>';
 }).join("");
 return '<section class="fca-word-work"><div><span class="tag">Words from the reading</span><h3>Build your mission word bank</h3><p>Study the pronunciation, translation, meaning and example. Then use the expressions in your own recommendation.</p></div><div class="fca-word-grid">'+cards+'</div></section>';
}

/* Pronunciation transcription + image coverage for the complete dictionary. */
const IPA={
"eco-friendly":"/ˌiː.kəʊˈfrend.li/","energy-efficient":"/ˌen.ə.dʒi ɪˈfɪʃ.ənt/","food miles":"/ˈfuːd ˌmaɪlz/","global warming":"/ˌɡləʊ.bəl ˈwɔː.mɪŋ/","greenhouse gases":"/ˈɡriːn.haʊs ˌɡæs.ɪz/","recycling centre":"/ˌriːˈsaɪ.klɪŋ ˌsen.tə/","rubbish dump":"/ˈrʌb.ɪʃ ˌdʌmp/","carbon footprint":"/ˌkɑː.bən ˈfʊt.prɪnt/","single-use":"/ˌsɪŋ.ɡəl ˈjuːs/","biodegradable":"/ˌbaɪ.əʊ.dɪˈɡreɪ.də.bəl/","food waste":"/ˈfuːd ˌweɪst/","protein":"/ˈprəʊ.tiːn/","carbohydrates":"/ˌkɑː.bəʊˈhaɪ.dreɪts/","vitamins":"/ˈvɪt.ə.mɪnz/","minerals":"/ˈmɪn.ər.əlz/","calories":"/ˈkæl.ər.iz/","additives":"/ˈæd.ɪ.tɪvz/","fat":"/fæt/","sugar":"/ˈʃʊɡ.ə/","salt":"/sɔːlt/","nutrient":"/ˈnjuː.tri.ənt/","staple food":"/ˌsteɪ.pəl ˈfuːd/","fibre":"/ˈfaɪ.bə/","a packet of":"/ə ˈpæk.ɪt əv/","a jar of":"/ə ˈdʒɑːr əv/","a carton of":"/ə ˈkɑː.tən əv/","a tube of":"/ə ˈtjuːb əv/","a bottle of":"/ə ˈbɒt.əl əv/","a box of":"/ə ˈbɒks əv/","a can / tin of":"/ə ˈkæn əv/ · /ə ˈtɪn əv/","a bag of":"/ə ˈbæɡ əv/","healthy":"/ˈhel.θi/","unhealthy":"/ʌnˈhel.θi/","delicious":"/dɪˈlɪʃ.əs/","disgusting":"/dɪsˈɡʌs.tɪŋ/","raw":"/rɔː/","cooked":"/kʊkt/","frozen":"/ˈfrəʊ.zən/","fresh":"/freʃ/","spicy":"/ˈspaɪ.si/","plain":"/pleɪn/","organic":"/ɔːˈɡæn.ɪk/","processed":"/ˈprəʊ.sest/","sweet":"/swiːt/","sour":"/ˈsaʊə/","tender":"/ˈten.də/","tough":"/tʌf/","soft":"/sɒft/","hard":"/hɑːd/","RSVP":"/ˌɑːr es viː ˈpiː/","FYI":"/ˌef waɪ ˈaɪ/","asap":"/ˌeɪ es eɪ ˈpiː/","e.g.":"/ˌiː ˈdʒiː/","etc.":"/etˈset.ər.ə/","BTW":"/ˌbiː tiː ˈdʌb.əl.juː/","esp.":"/ɪˈspeʃ.əl.i/","tel.":"/ˈtel.ɪ.fəʊn/","St.":"/striːt/"
};
VOCAB.forEach(v=>{v.ipa=IPA[v.t]||"";if(!v.img)v.img=v.cat==="Abbreviations"?"market":"food";});
const fcaVocabBase=renderVocabulary;
renderVocabulary=function(el){
 fcaVocabBase(el);
 const grid=$("#vocabGrid",el);
 function decorate(){
  $$(".vcard",grid).forEach(card=>{
   const term=$(".vterm span",card)?.textContent,entry=VOCAB.find(v=>v.t===term);
   if(!entry)return;
   let ipa=$(".fca-vocab-ipa",card);
   if(!ipa){ipa=document.createElement("div");ipa.className="fca-vocab-ipa";const pos=card.querySelector(".vpos");if(pos)pos.parentElement.insertAdjacentElement("afterend",ipa);}
   ipa.textContent=entry.ipa;
  });
 }
 decorate();
 grid.addEventListener("click",()=>setTimeout(decorate,0));
 $("#vocabSearch",el).addEventListener("input",()=>setTimeout(decorate,0));
 grid.addEventListener("click",e=>{const b=e.target.closest("[data-fca-say]");if(b)AudioSys.speak(b.dataset.fcaSay);});
};
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-fca-say]");if(b){e.preventDefault();AudioSys.speak(b.dataset.fcaSay);}
});

/* Richer client profiles for the nutrition case. */
function fcaClientProfiles(){
 const profiles=[
  {id:"will",name:"Will, 17",role:"Trainee chef · vegan",routine:"Often skips breakfast or has only orange juice. Drinks plenty of water. Snacks on crisps or biscuits; lunch is usually salad or bread with peanut butter. Dinner is pasta or rice with plenty of vegetables.",needs:"A more regular breakfast and a wider range of plant-based protein sources; keep the good vegetable and water habits.",goal:"Energy for early starts and practical kitchen training."},
  {id:"jess",name:"Jess, 18",role:"800-metre runner",routine:"Has porridge with soya milk, fruit and nuts. After training she has a smoothie. Lunch includes chicken or salmon, eggs, vegetables and rice or potatoes. She enjoys chocolate but keeps it to a small treat.",needs:"Keep meals varied and include enough carbohydrates and protein around training; maintain hydration and a sensible balance of treats.",goal:"Steady energy, recovery and performance."},
  {id:"jordan",name:"Jordan, 16",role:"Student · sports fan",routine:"Usually eats cereal and toast before school. Often chooses a burger and fries at lunch, cakes or chocolate after school, and takeaway pizza or kebab for dinner. Eats very few vegetables and little fruit apart from bananas.",needs:"Add fruit and vegetables more often, improve meal variety and keep favourite foods in a realistic balanced plan rather than banning them.",goal:"A practical change that fits school, sport and social life."}
 ];
 return '<section class="fca-client-profiles"><div class="fca-section-heading"><span class="tag">Client case files</span><h3>Meet the three clients</h3><p>Read each profile carefully. Your recommendations must respond to the person’s routine, preferences and needs — not to assumptions.</p></div><div class="fca-client-grid">'+profiles.map(p=>'<article class="fca-client-card"><div class="fca-client-head">'+avatar(p.id,68)+'<div><b>'+p.name+'</b><span>'+p.role+'</span></div></div><p><b>Typical routine</b><br>'+p.routine+'</p><p><b>What to consider</b><br>'+p.needs+'</p><p class="fca-client-goal"><b>Priority</b> · '+p.goal+'</p></article>').join("")+'</div></section>';
}
const fcaMissionRenderBase=renderFoodChoiceMission;
renderFoodChoiceMission=function(el,index){
 fcaMissionRenderBase(el,index);
 const card=el.querySelector(".fc-mission-card");
 if(index===0){
  const coach=card?.querySelector(".fc-coach");
  if(coach){
   coach.classList.add("fca-mentor-message");
   coach.insertAdjacentHTML("afterbegin",'<img class="fca-mentor-photo" src="'+PH.harper+'" alt="Miss Harper, the canteen manager">');
   const label=coach.querySelector("b");if(label)label.textContent="Miss Harper · Canteen Manager";
   const p=coach.querySelector("p");if(p)p.textContent="Welcome to the team. I asked you here because our canteen needs more than a quick fix. I want you to investigate the evidence, listen to our students and build a food-choice plan that is healthier, fairer and realistic.";
  }
 }
 if(index===1){
  const intro=card?.querySelector(".fc-mission-intro");
  if(intro)intro.insertAdjacentHTML("afterend",'<div class="fca-mentor-message card"><img class="fca-mentor-photo" src="'+PH.harper+'" alt="Miss Harper" /><div><span class="tag">A message from Miss Harper</span><p>Thank you for accepting the case. Before we change the canteen, we need to understand the real cost of everyday food. Read the full two-page report, notice the facts and figures, and then build your word bank from the text. Your first recommendation must be supported by evidence.</p></div></div>');
 }
 if(index===3){
  const intro=card?.querySelector(".fc-mission-intro");
  if(intro)intro.insertAdjacentHTML("afterend",fcaClientProfiles());
 }
};

/* New step between 3A word study and the life-cycle task. */
const fcaCrosswordStep={
 tag:"Communicative Practice",ic:"grid",title:"The BALANCED Crossword",task:"3a-crossword",
 build(b){
  b.innerHTML=stepShell("Communicative Practice","grid","The BALANCED Crossword","Complete the vocabulary crossword from the mission. Use the highlighted letters to find the key word.")+taskCard();
  const zone=b.querySelector(".task-zone");if(!zone)return;
  zone.innerHTML=crosswordMarkup();
  const board=$(".fca-cw-board",zone);
  board.addEventListener("input",e=>{
   const t=e.target;if(!t.matches("[data-cw-row]"))return;
   t.value=t.value.toUpperCase().replace(/[^A-Z]/g,"").slice(-1);
   if(t.value){const next=board.querySelector('[data-cw-row="'+t.dataset.cwRow+'"][data-cw-pos="'+(Number(t.dataset.cwPos)+1)+'"]');next?.focus();}
  });
  board.addEventListener("paste",e=>{
   const t=e.target;if(!t.matches('[data-cw-row="0"][data-cw-pos="0"]'))return;
   const raw=(e.clipboardData||window.clipboardData).getData("text").toUpperCase().replace(/[^A-Z]/g,"");
   if(raw.length>1){e.preventDefault();Array.from(raw).forEach((ch,i)=>{const cell=board.querySelector('[data-cw-row="0"][data-cw-pos="'+i+'"]');if(cell)cell.value=ch;});}
  });
  $("#fcaCheckCrossword",zone).addEventListener("click",()=>{
   let score=0,errors=0,log=[];
   fcaCrosswordWords.forEach((w,r)=>{
    const cells=Array.from(board.querySelectorAll('[data-cw-row="'+r+'"]'));
    const answer=cells.map(x=>x.value).join("");
    const ok=answer===w.answer;
    if(ok)score++;else errors++;
    cells.forEach(x=>x.classList.toggle("is-correct",ok));
    log.push({q:w.clue,user:answer||"blank",ok,focus:"Use the definition and the reading vocabulary. Check the highlighted letter position."});
   });
   const hint=$("#fcaCwFeedback",zone);
   if(score===fcaCrosswordWords.length){
    hint.textContent="All entries are correct. The highlighted letters spell BALANCED.";
    $("#fcaCwSentence",zone).hidden=false;
   }else hint.textContent=score+"/"+fcaCrosswordWords.length+" entries fit. Recheck the definitions and try again; the key word stays hidden until the grid is complete.";
   zone.dataset.fcaScore=String(score);zone.dataset.fcaErrors=String(errors);zone.dataset.fcaLog=JSON.stringify(log);
  });
  $("#fcaCheckSentence",zone).addEventListener("click",()=>{
   const sentence=$("#fcaCwSentenceInput",zone).value.trim();
   const hint=$("#fcaSentenceFeedback",zone);
   if(!sentence){hint.textContent="Write your sentence first.";return;}
   const hasKey=/\bbalanced\b/i.test(sentence);
   const hasVocab=/\b(food miles|food waste|single.use|biodegradable|eco.friendly|carbon footprint|greenhouse gases|recycling centre|packaging)\b/i.test(sentence);
   const hasGrammar=/\b(should|can|must|because|which|that|if|although)\b/i.test(sentence);
   if(!hasKey||!hasVocab||!hasGrammar){hint.textContent="Check the three requirements: use BALANCED, include a mission expression, and use a modal verb or a linking structure such as because / which.";return;}
   const score=Number(zone.dataset.fcaScore||0),errors=Number(zone.dataset.fcaErrors||0),log=JSON.parse(zone.dataset.fcaLog||"[]");
   log.push({q:"Write a sentence with BALANCED",user:sentence,ok:true,focus:"Your sentence uses the key word, mission vocabulary and a target grammar or linking structure."});
   completeTask("3a-crossword",{score:score+1,max:fcaCrosswordWords.length+1,errors,xp:(score+1)*10,log},zone);
   const saved=S.writingPortfolio.find(x=>x.id==="3a-crossword-sentence");
   const analysis=analyseWriting(sentence,"Sentence with the key word BALANCED");
   const entry={id:"3a-crossword-sentence",route:"Mission 3A · The Real Cost of Food",prompt:"Sentence with the key word BALANCED",text:sentence,analysis,updatedAt:new Date().toISOString()};
   if(saved)Object.assign(saved,entry);else S.writingPortfolio.push(entry);save();
  });
 }
};
if(!LESSONS[0].steps.some(x=>x.task==="3a-crossword")){
 LESSONS[0].steps.splice(2,0,fcaCrosswordStep);
}
FOOD_CHOICE_MISSIONS[1].requires=["3a-read","3a-vocab","3a-crossword"];
FOOD_CHOICE_MISSIONS[2].target={l:0,s:3};

/* Rule-based formative English writing coach: all free-text task fields feed the portfolio. */
function analyseWriting(text,prompt){
 const clean=String(text||"").trim(),words=clean.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[],lower=clean.toLowerCase(),issues=[],tips=[];
 const add=(title,detail,tip)=>{issues.push({title,detail});if(tip&&!tips.includes(tip))tips.push(tip);};
 if(words.length<12)add("Develop the response","This is a very short draft, so there is not enough language to check structure reliably.","Add two or three complete sentences and develop the reason or example.");
 if(clean&&/^[a-z]/.test(clean))add("Capital letter","The response begins with a lower-case letter.","Start the first sentence with a capital letter.");
 if(words.length>=8&&!/[.!?]$/.test(clean))add("Sentence punctuation","The final sentence needs an end mark.","Finish each complete sentence with a full stop, question mark or exclamation mark.");
 if(/\b(a)\s+[aeiou]/i.test(clean))add("Article choice","Check whether the noun needs “an” before a vowel sound.","Review a / an before singular countable nouns.");
 if(/\b(an)\s+[bcdfghjklmnpqrstvwxyz]/i.test(clean))add("Article choice","Check whether the noun needs “a” before a consonant sound.","Review a / an before singular countable nouns.");
 if(/\b(he|she|it|jordan|jess|will)\s+(eat|have|go|do|like|need|want|contain|cause|produce|create|make)\b/i.test(clean))add("Present simple agreement","A third-person singular subject may need an -s verb ending.","Check he / she / it + verb-s in the present simple.");
 if(/\bi am agree\b/i.test(clean))add("Verb pattern","“Agree” is a main verb and does not take “am” in this expression.","Use “I agree” or “I do not agree”.");
 if(/\bpeople is\b/i.test(clean))add("Subject–verb agreement","“People” normally takes a plural verb.","Use “people are”.");
 if(/\bthere is (many|a few|several)\b/i.test(clean))add("There is / there are","The noun phrase is plural.","Use “there are” with plural countable nouns.");
 if(/\b(much people|many food|many water|a few water|a little apples)\b/i.test(clean))add("Countable and uncountable nouns","The quantifier may not match the noun.","Check much / many, a few / a little and whether the noun is countable.");
 if(/\b(informations|advices|furnitures|equipments)\b/i.test(clean))add("Uncountable noun","This noun is normally uncountable in English.","Use information / advice / furniture / equipment without -s.");
 if(/\b(more better|most easiest|very deliciousest)\b/i.test(clean))add("Comparative form","Avoid using two comparative or superlative markers together.","Use either “better” or “more + adjective”, not both.");
 if(/\bdiscuss about\b/i.test(clean))add("Verb + preposition","“Discuss” normally takes a direct object.","Write “discuss the problem”, not “discuss about the problem”.");
 const repeated=clean.match(/\b([a-z]{3,})\s+\1\b/i);
 if(repeated)add("Repeated word","The word “"+repeated[1]+"” appears twice in a row.","Remove the accidental repetition and reread the sentence.");
 const sentenceCount=(clean.match(/[.!?]+(?=\s|$)/g)||[]).length;
 if(words.length>=15&&sentenceCount<2)add("Sentence structure","The response may contain one long sentence or missing sentence boundaries.","Separate different ideas into clear sentences.");
 const connectors=(lower.match(/\b(because|however|also|first|then|finally|although|for example|as a result)\b/g)||[]).length;
 if(words.length>=25&&connectors===0)add("Cohesion","The ideas could be linked more clearly.","Use a suitable connector such as because, however, also or as a result.");
 const foodTerms=["food miles","food waste","single-use","biodegradable","eco-friendly","carbon footprint","greenhouse gases","packaging","nutrient","balanced","protein","carbohydrates","vitamins","minerals","fibre"];
 const used=foodTerms.filter(x=>lower.includes(x));
 if(/mission|food|diet|recommend|choice|canteen|menu/i.test(prompt||"")&&used.length===0)add("Mission vocabulary","No key expression from the food-choice word bank was detected.","Use one or two precise terms from the reading where they fit your meaning.");
 if(words.length>=20&&issues.length===0)tips.push("Your draft is clear at this stage. Check the task requirements and make sure each recommendation is supported by evidence.");
 return {wordCount:words.length,sentenceCount,issues,tips,checkedAt:new Date().toISOString()};
}
function fieldPrompt(field){
 const label=field.closest("label");
 if(label){const text=label.childNodes?Array.from(label.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join(" ").trim():"";if(text)return text;}
 return field.getAttribute("aria-label")||field.getAttribute("placeholder")||field.dataset.f||field.id||"Written response";
}
function writingRouteLabel(){
 const r=S.route||{};
 if(r.name==="step")return "Mission "+(LESSONS[r.l]?.code||"")+" · "+(LESSONS[r.l]?.steps[r.s]?.title||"Task");
 if(r.name==="fc-mission")return FOOD_CHOICE_MISSIONS[r.i]?.title||"Mission";
 return r.name==="final"?"Final Project":r.name==="skillsTest"?"Final Skills Test":r.name||"Learning activity";
}
function renderFieldFeedback(field,entry){
 let box=field.parentElement?.querySelector(":scope > .fca-writing-feedback");
 if(!box){box=document.createElement("div");box.className="fca-writing-feedback";field.insertAdjacentElement("afterend",box);}
 const a=entry.analysis;
 const issues=a.issues.length?'<ul>'+a.issues.map(x=>'<li><b>'+esc(x.title)+':</b> '+esc(x.detail)+'</li>').join("")+'</ul>':'<p class="fca-writing-good">No obvious pattern-based issues detected. Review meaning and task requirements before submitting.</p>';
 const tips=a.tips.length?'<p><b>Next steps:</b> '+a.tips.map(esc).join(" ")+'</p>':"";
 box.innerHTML='<div class="fca-writing-head"><b>Language Coach · automatic check</b><span>'+a.wordCount+' words · '+a.sentenceCount+' sentences</span></div>'+issues+tips+'<small>Formative feedback: checks common patterns, not a full human or AI essay grade.</small>';
}
function captureWriting(field){
 if(!field||!field.matches("textarea,input[type=text],input:not([type])")||field.disabled||field.dataset.fcaIgnore==="true")return;
 if(field.id==="consultName"||field.id==="vocabSearch"||field.id==="sloganInput"||field.closest(".fca-cw-board"))return;
 const value=String(field.value||"").trim();
 if(value.length<4)return;
 const r=S.route||{},idx=field.id||field.dataset.f||field.getAttribute("placeholder")||fieldPrompt(field);
 const id=[r.name||"page",r.l??"",r.s??"",idx].join(":");
 const analysis=analyseWriting(value,fieldPrompt(field));
 const entry={id,route:writingRouteLabel(),prompt:fieldPrompt(field),text:value,analysis,updatedAt:new Date().toISOString()};
 const old=S.writingPortfolio.find(x=>x.id===id);
 if(old)Object.assign(old,entry);else S.writingPortfolio.push(entry);
 if(S.writingPortfolio.length>250)S.writingPortfolio=S.writingPortfolio.slice(-250);
 field.setAttribute("spellcheck","true");field.dataset.fcaWriting="1";
 renderFieldFeedback(field,entry);save();
}
let writingTimer=null;
document.addEventListener("input",e=>{
 const field=e.target;
 if(!field||!field.matches("textarea,input[type=text],input:not([type])"))return;
 if(field.closest("#app")){clearTimeout(writingTimer);writingTimer=setTimeout(()=>captureWriting(field),450);}
},true);
document.addEventListener("change",e=>{if(e.target?.closest?.("#app"))captureWriting(e.target);},true);

/* Portfolio: written drafts + every recorded task response, with errors and return advice. */
function renderMyPortfolio(el){
 const entries=(S.writingPortfolio||[]).slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
 const logs=Object.entries(S.logs||{}).flatMap(([id,rows])=>(rows||[]).map((r,i)=>({id,q:r.q||"Task response",user:r.user||"—",ok:r.ok,focus:r.focus||r.expl||"",n:i})));
 const writing=entries.length?entries.map(e=>{
  const a=e.analysis||{wordCount:0,sentenceCount:0,issues:[],tips:[]};
  return '<article class="fca-portfolio-entry"><div class="fca-portfolio-meta"><span class="tag">'+esc(e.route||"Written task")+'</span><span>'+a.wordCount+' words · '+a.sentenceCount+' sentences</span></div><h3>'+esc(e.prompt||"Written response")+'</h3><div class="fca-portfolio-text">'+esc(e.text)+'</div>'+(a.issues.length?'<div class="fca-portfolio-errors"><b>Language points to review</b><ul>'+a.issues.map(x=>'<li><b>'+esc(x.title)+':</b> '+esc(x.detail)+'</li>').join("")+'</ul></div>':'<p class="fca-writing-good">No common pattern-based errors detected.</p>')+(a.tips.length?'<p class="fca-portfolio-tip"><b>Recommendations:</b> '+a.tips.map(esc).join(" ")+'</p>':'')+'</article>';
 }).join(""):'<div class="card soft"><p>Your written responses will appear here automatically as you work through the missions.</p></div>';
 const responses=logs.length?'<div class="fca-response-list">'+logs.map(x=>'<article><div><b>'+esc(x.id)+'</b><span class="'+(x.ok===true?'fca-ok':x.ok===false?'fca-revisit':'')+'">'+(x.ok===true?'Recorded as correct':x.ok===false?'Needs review':'Recorded')+'</span></div><p><b>'+esc(x.q)+'</b></p><p>Your response: '+esc(x.user)+'</p>'+(x.focus?'<small>Coach recommendation: '+esc(x.focus)+'</small>':'')+'</article>').join("")+'</div>':'<p class="muted small">Checked task responses will appear here as they are completed.</p>';
 const projectSummary=typeof fcPortfolioMarkup==="function"?fcPortfolioMarkup():"";
 el.innerHTML='<section class="fca-portfolio-page"><div class="photo-hero" style="min-height:190px"><div class="veil"></div><div class="ph-content"><div class="kicker">Your project workspace</div><h1>My Project</h1><p>Every written response, task answer, language check and recommendation is collected here.</p></div></div>'+projectSummary+'<div class="fca-portfolio-stats"><div><b>'+entries.length+'</b><span>Written responses</span></div><div><b>'+logs.length+'</b><span>Recorded task answers</span></div><div><b>'+fcProgress()+'/12</b><span>Missions recorded</span></div></div><div class="fca-portfolio-section"><h2>Written work & language feedback</h2><p class="muted">Latest version of each written response, with error analysis and individual recommendations.</p>'+writing+'</div><div class="fca-portfolio-section"><h2>Task answers & coach notes</h2>'+responses+'</div><div class="footer-bar"><button class="btn btn-ghost" data-action="nav" data-page="missions">← Back to missions</button><button class="btn btn-gold" data-action="resume-fc">Continue</button></div></section>';
}

/* One-time learner sign-in and SCORM 1.2 identity persistence. */
function fcaLmsName(){if(!LMS.ok)return "";try{return String(LMS.api.LMSGetValue("cmi.core.student_name")||"").trim();}catch(e){return "";}}
if(!S.name){const n=fcaLmsName();if(n){S.name=n;S.started=true;}}
function fcaSaveLearner(){
 S.name=String(S.name||"").trim().slice(0,40);S.started=!!S.name;
 save();
 if(LMS.ok){try{
  /* cmi.core.student_name is read-only in SCORM 1.2; the typed display name is stored in suspend_data. */
  LMS.set("cmi.suspend_data",JSON.stringify(S));
  LMS.set("cmi.core.lesson_location",JSON.stringify(S.route||{name:"missions"}));
  LMS.commit();
 }catch(e){}}
 else{try{localStorage.setItem(FKEY,JSON.stringify(S));}catch(e){}}
}
renderStart=function(el){
 if(S.name){
  el.innerHTML='<section class="fca-login-screen"><div class="fca-login-visual"><div class="fca-login-overlay"></div><div class="fca-login-copy"><span class="tag">FOOD CHOICE ACADEMY</span><h1>Welcome back,<br><em>'+esc(S.name)+'</em></h1><p>Your learner profile and progress have been restored. Continue your project from where you left off.</p><div class="fca-login-meta"><span>✓ Profile restored</span><span>✓ Progress saved</span><span>✓ Project available</span></div></div></div><div class="fca-login-panel"><div class="kicker">Your learning space</div><h2>Ready to continue?</h2><p>Your name is saved for this course. You will not need to enter it again after each mission.</p><button class="btn btn-gold fca-login-submit" data-action="login-continue">Continue learning '+icon("right")+'</button><small>When opened in an LMS, your progress is synchronised with your SCORM 1.2 course record.</small></div></section>';
  return;
 }
 el.innerHTML='<section class="fca-login-screen"><div class="fca-login-visual"><div class="fca-login-overlay"></div><div class="fca-login-copy"><span class="tag">INSIGHT 2E · PRE-INTERMEDIATE</span><h1>Food Choice<br><em>Academy</em></h1><p>Investigate food choices, solve real-world challenges and build your own project, one mission at a time.</p><div class="fca-login-meta"><span>Learning missions</span><span>Personal assistant team</span><span>My Project portfolio</span></div></div></div><div class="fca-login-panel"><div class="kicker">Learner sign in</div><h2>Let&#39;s get started</h2><p>Enter your name once to create your learner profile. It will be remembered throughout the course.</p><form id="fcaLoginForm"><label for="fcaLearnerName">Your name</label><input id="fcaLearnerName" name="learnerName" type="text" maxlength="40" autocomplete="name" placeholder="Enter your name" required><button class="btn btn-gold fca-login-submit" type="submit">Enter the Academy '+icon("right")+'</button></form><small>When launched in an LMS, your course identity and learning progress are connected to your SCORM 1.2 session.</small></div></section>';
 const form=$("#fcaLoginForm",el),input=$("#fcaLearnerName",el);
 form.addEventListener("submit",e=>{
  e.preventDefault();const n=input.value.trim();if(!n){input.focus();return;}
  S.name=n;S.started=true;S.route={name:"missions"};fcaSaveLearner();earnAch("first");App.go({name:"missions"});
 });
 setTimeout(()=>input.focus(),50);
};
Actions.start=function(){if(!S.name){App.go({name:"start"});return;}resumeFoodChoice();};
Actions["login-continue"]=function(){if(!S.name){App.go({name:"start"});return;}resumeFoodChoice();};
const fcaDashboardBeforeLogin=renderBrief;
renderBrief=function(el){
 fcaDashboardBeforeLogin(el);
 const box=el.querySelector(".name-input");
 if(box)box.innerHTML='<div class="fca-learner-chip">'+avatar("ben",38)+'<span><small>Signed in as</small><b>'+esc(S.name||"Learner")+'</b></span></div><button class="btn btn-gold" data-action="resume-fc">Continue '+icon("right")+'</button>';
};
const fcaSaveWithIdentity=save;
save=function(){fcaSaveWithIdentity();if(LMS.ok){try{LMS.set("cmi.core.lesson_location",JSON.stringify(S.route||{}));}catch(e){}}};

App.go({name:"start"});updateTopbar();
})();