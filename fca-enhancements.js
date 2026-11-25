/* Food Choice Academy refinements — 25 Nov 2026 */
(function(){
"use strict";
if(typeof S==="undefined"||typeof App==="undefined")return;
S.writingPortfolio=Array.isArray(S.writingPortfolio)?S.writingPortfolio:[];
S.fcResumeRoute=S.fcResumeRoute||null;

/* Browser preview progress, while preserving SCORM as the primary LMS store. */
const FKEY="food_choice_academy_preview_v1";
const FRESH_PREVIEW=!LMS.ok&&new URLSearchParams(window.location.search).get("preview")==="reset";
if(FRESH_PREVIEW){
 try{localStorage.removeItem(FKEY);}catch(e){}
 S=defaultState();S.route={name:"start"};S.started=false;S.name="";
}else if(!LMS.ok){
 try{
  const saved=localStorage.getItem(FKEY);
  if(saved){const parsed=JSON.parse(saved);S=Object.assign(S,parsed);S.writingPortfolio=Array.isArray(S.writingPortfolio)?S.writingPortfolio:[];}
 }catch(e){}
}
const fcaSaveBase=save;
save=function(){
 fcaSaveBase();
 if(!LMS.ok&&!FRESH_PREVIEW){try{localStorage.setItem(FKEY,JSON.stringify(S));}catch(e){}}
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
const fcaCommunicativeWords=[
 {side:"A",term:"grow"},{side:"A",term:"transport"},{side:"A",term:"rubbish dump"},{side:"A",term:"food miles"},{side:"A",term:"refrigerate"},{side:"A",term:"throw away"},
 {side:"B",term:"produce"},{side:"B",term:"recycle"},{side:"B",term:"global warming"},{side:"B",term:"package"},{side:"B",term:"recycling centre"},{side:"B",term:"greenhouse gases"}
];
function communicativeActivityMarkup(){
 const cards=fcaCommunicativeWords.map(w=>'<label class="fca-comm-word"><span class="tag">Student '+w.side+'</span><b>'+esc(w.term)+'</b><small>Explain this expression without saying it. Let your partner guess.</small></label>').join("");
 return '<div class="fca-crossword"><div class="fca-cw-intro"><span class="tag">Insight 2e · Communication Worksheet 3A</span><h3>Your plate, our planet · Pair vocabulary challenge</h3><p>Work with a partner. Student A explains the six words in Set A; Student B explains the six words in Set B. Do not say the target word. Your partner guesses it. Then discuss whether each word is a noun or a verb.</p></div><div class="fca-comm-grid">'+cards+'</div><label class="fca-comm-response"><b>Record your explanations</b><span>Choose at least three expressions. Explain each one in your own words without repeating the expression itself. Add whether it is a noun or a verb.</span><textarea id="fcaCommResponse" rows="6" placeholder="1. This is the distance food travels from where it is grown to where it is sold. (noun)&#10;2. ..."></textarea></label><div class="fca-cw-actions"><button class="btn btn-gold btn-sm" id="fcaSubmitComm">Save pair-work notes</button><span class="fca-cw-feedback" id="fcaCommFeedback" aria-live="polite">Your notes become part of My Project.</span></div></div>';
}const fcaVocabStep=LESSONS[0].steps.find(x=>x.task==="3a-vocab");
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
 tag:"Communicative Practice",ic:"users",title:"Your Plate, Our Planet · Pair Vocabulary",task:"3a-crossword",
 build(b){
  b.innerHTML=stepShell("Communicative Practice","users","Your Plate, Our Planet · Pair Vocabulary","Adapted from Insight 2e Pre-Intermediate Communication Worksheet 3A.")+taskCard();
  const zone=b.querySelector(".task-zone");if(!zone)return;
  zone.innerHTML=communicativeActivityMarkup();
  $("#fcaSubmitComm",zone).addEventListener("click",()=>{
   const field=$("#fcaCommResponse",zone),value=field.value.trim(),feedback=$("#fcaCommFeedback",zone);
   if(value.split(/\s+/).filter(Boolean).length<20){feedback.textContent="Add more detail: explain at least three expressions in your own words and identify each as a noun or a verb.";return;}
   const log=[{q:"Pair vocabulary challenge · explain without saying the word",user:value,ok:true,focus:"Use your own explanation, let your partner guess, and identify whether each target expression is a noun or a verb."}];
   completeTask("3a-crossword",{score:1,max:1,errors:0,xp:10,log},zone);
   const entry={id:"3a-crossword-pair-notes",route:"Mission 3A · Your Plate, Our Planet",prompt:"Pair vocabulary challenge · explain without saying the word",text:value,analysis:analyseWriting(value,"Food vocabulary explanations"),updatedAt:new Date().toISOString()};
   const old=S.writingPortfolio.find(x=>x.id===entry.id);if(old)Object.assign(old,entry);else S.writingPortfolio.push(entry);
   save();feedback.textContent="Your pair-work notes have been saved in My Project. Use them to practise the explanations with a partner."; 
  });
 }
};
if(!LESSONS[0].steps.some(x=>x.task==="3a-crossword")){
 LESSONS[0].steps.splice(2,0,fcaCrosswordStep);
}FOOD_CHOICE_MISSIONS[1].requires=["3a-read","3a-vocab","3a-crossword"];
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
 else if(!FRESH_PREVIEW){try{localStorage.setItem(FKEY,JSON.stringify(S));}catch(e){}}
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

if(FRESH_PREVIEW){
 document.body.classList.add("fca-fresh-preview");
 const bar=document.createElement("div");bar.className="fca-preview-banner";
 bar.innerHTML="<b>TEACHER PREVIEW</b><span>Fresh session · progress is temporary · refresh to restart from the beginning</span>";
 document.body.insertBefore(bar,document.body.firstChild);
}

/* === Unified single-attempt question flow === */
const fcaCompleteTaskOriginal=completeTask;
completeTask=function(id,res,zone){
 if(S.results&&S.results[id])return;
 fcaCompleteTaskOriginal(id,res,null);
 if(zone){
  zone.innerHTML=donePanelHTML(id);
  zone.classList.add("fca-task-complete");
  const screen=document.querySelector("#app .screen");
  if(screen){
   screen.querySelectorAll('[data-action="next-step"]').forEach(function(button){if(!zone.contains(button))button.remove();});
   zone.querySelectorAll('[data-action="next-step"]').forEach(function(button,i){if(i>0)button.remove();});
  }
 }
};
function fcaQuestionSequence(zone,cfg,items){
 let index=0,score=0,errors=0,xp=0,log=[];
 function show(){
  if(index>=items.length){
   completeTask(cfg.id,{score:score,max:items.length,errors:errors,xp:xp,log:log},zone);
   return;
  }
  const item=items[index],options=shuffle(item.options.map(String));
  zone.innerHTML=
   '<div class="progress-line fca-question-progress"><i style="width:'+((index+1)/items.length*100)+'%"></i></div>'+
   '<div class="fca-question-meta"><span>'+(cfg.label||"QUESTION")+' '+(index+1)+' / '+items.length+'</span><span>One attempt</span></div>'+
   '<div class="qcard fca-one-question"><div class="qtext">'+(item.prompt||"")+'</div>'+
   '<div class="fca-question-options">'+options.map(function(option,i){
    return '<button type="button" class="opt fca-answer-option" data-option="'+i+'">'+String.fromCharCode(65+i)+'. '+esc(option)+'</button>';
   }).join("")+'</div>'+
   '<div class="fad-feedback fca-answer-feedback" aria-live="polite"></div>'+
   '<div class="footer-bar fca-question-footer"><span class="small muted">Question '+(index+1)+' of '+items.length+'</span><button type="button" class="btn btn-gold" id="fcaQuestionNext" disabled>'+(index===items.length-1?"Finish task":"Continue")+' '+icon("right")+'</button></div></div>';
  let locked=false;
  $(".fca-answer-option",zone).forEach(function(button){
   button.addEventListener("click",function(event){
    if(locked)return;
    locked=true;
    const picked=options[Number(button.dataset.option)];
    const correct=Array.isArray(item.correct)?item.correct.includes(picked):picked===String(item.correct);
    $(".fca-answer-option",zone).forEach(function(x){x.disabled=true;});
    button.classList.add(correct?"right":"wrong");
    if(correct){score++;xp+=8;noteAnswer(true,event,8);}
    else{errors++;noteAnswer(false,event);}
    log.push({q:item.logQuestion||String(item.prompt||"").replace(/<[^>]*>/g,""),user:picked,correct:Array.isArray(item.correct)?item.correct.join(" / "):String(item.correct),ok:correct,focus:item.explanation||"Review the source text or language point."});
    const progress=$(".fca-question-progress i",zone);if(progress)progress.style.width=((index+1)/items.length*100)+"%";
    $(".fca-answer-feedback",zone).textContent=correct
     ?"Answer recorded. Continue to the next question."
     :"Answer recorded. This mistake lowers the score, but does not stop the mission.";
    $("#fcaQuestionNext",zone).disabled=false;
   });
  });
  $("#fcaQuestionNext",zone).addEventListener("click",function(){if(locked){index++;show();}});
 }
 show();
}
engMCQ=function(zone,cfg){
 fcaQuestionSequence(zone,cfg,cfg.items.map(function(it){
  return {prompt:it.q,options:it.opts,correct:it.opts[it.ans],explanation:it.expl};
 }));
};
engGapsStepped=function(zone,cfg){
 fcaQuestionSequence(zone,Object.assign({label:"GAP QUESTION"},cfg),cfg.items.map(function(it){
  return {prompt:it.pre+' <span class="gap">________</span> '+(it.post||""),options:it.opts,correct:it.ans,explanation:it.expl,logQuestion:it.pre+" ___ "+(it.post||"")};
 }));
};
engGaps=function(zone,cfg){
 fcaQuestionSequence(zone,Object.assign({label:"GAP QUESTION"},cfg),cfg.items.map(function(it){
  return {prompt:it.pre+' <span class="gap">________</span> '+(it.post||""),options:it.opts,correct:it.ans,explanation:it.expl,logQuestion:it.pre+" ___ "+(it.post||"")};
 }));
};
engFadQuizStepped=function(zone,cfg){
 fcaQuestionSequence(zone,Object.assign({label:"EVIDENCE CHECK"},cfg),cfg.items.map(function(it){
  return {prompt:it.q,options:it.opts,correct:it.opts[it.ans],explanation:it.expl};
 }));
};
engFadQuiz=function(zone,cfg){
 fcaQuestionSequence(zone,Object.assign({label:"EVIDENCE CHECK"},cfg),cfg.items.map(function(it){
  return {prompt:it.q,options:it.opts,correct:it.opts[it.ans],explanation:it.expl};
 }));
};
/* Vocabulary matching: fixed target word, one definition choice per screen. */
engMatch=function(zone,cfg){
 const pairs=cfg.pairs;
 const questions=pairs.map(function(pair){
  const distractors=shuffle(pairs.filter(function(x){return x.t!==pair.t;}).map(function(x){return x.d;})).slice(0,3);
  return {prompt:'Which definition matches <b>'+esc(pair.t)+'</b>?',options:[pair.d].concat(distractors),correct:pair.d,logQuestion:pair.t,explanation:"Compare the meaning with the vocabulary card and reading context."};
 });
 fcaQuestionSequence(zone,{id:cfg.id,label:"VOCABULARY MATCH"},questions);
};
/* The 3A pair activity is recorded once; a short response loses the point,
   but never prevents the learner from continuing. */
if(typeof fcaCrosswordStep!=="undefined"){
 fcaCrosswordStep.build=function(b){
  b.innerHTML=stepShell("Communicative Practice","users","Your Plate, Our Planet · Pair Vocabulary","Adapted from Insight 2e Pre-Intermediate Communication Worksheet 3A.")+
   '<div class="card"><div class="task-zone fca-comm-step-zone">'+communicativeActivityMarkup()+'</div></div>';
  const zone=b.querySelector(".task-zone");
  if(!zone)return;
  zone.insertAdjacentHTML("afterbegin",'<div class="progress-line fca-question-progress"><i style="width:0%"></i></div><div class="fca-question-meta"><span>PAIR TASK · 1 / 1</span><span>One submission</span></div>');
  const button=$("#fcaSubmitComm",zone);
  if(button)button.textContent="Save response & continue";
  if(!button)return;
  button.addEventListener("click",function(){
   if(S.results["3a-crossword"])return;
   const field=$("#fcaCommResponse",zone),value=field?field.value.trim():"";
   const words=value.split(/\s+/).filter(Boolean).length,passed=words>=20;
   const log=[{q:"Pair vocabulary challenge · explain without saying the word",user:value||"No written explanation recorded",correct:"Explain at least three expressions and identify each as a noun or a verb.",ok:passed,focus:"Use your own wording, let your partner guess and identify the part of speech."}];
   completeTask("3a-crossword",{score:passed?1:0,max:1,errors:passed?0:1,xp:passed?10:0,log:log},zone);
   const entry={id:"3a-crossword-pair-notes",route:"Mission 3A · Your Plate, Our Planet",prompt:"Pair vocabulary challenge · explain without saying the word",text:value,analysis:analyseWriting(value,"Food vocabulary explanations"),updatedAt:new Date().toISOString()};
   const old=S.writingPortfolio.find(function(x){return x.id===entry.id;});
   if(old)Object.assign(old,entry);else S.writingPortfolio.push(entry);
   save();
  });
 };
}
/* Reading split is based on article paragraphs only, not captions or nested notes. */
const fcaReadingStepOneScreen=LESSONS[0].steps.find(function(x){return x.task==="3a-read";});
if(fcaReadingStepOneScreen){
 const oldBuild=fcaReadingStepOneScreen.build;
 fcaReadingStepOneScreen.build=function(b){
  oldBuild(b);
  const reading=b.querySelector(".reading");if(!reading)return;
  const direct=Array.from(reading.children);
  const visual=direct.find(function(x){return x.querySelector&&x.querySelector("img,.ph");})||null;
  const paragraphs=direct.filter(function(x){return x.tagName==="P";});
  if(paragraphs.length<2)return;
  const first=document.createElement("div"),second=document.createElement("div");
  first.className="fca-reading-page is-current";second.className="fca-reading-page";second.hidden=true;
  if(visual)first.appendChild(visual);
  paragraphs.forEach(function(p,i){(i<2?first:second).appendChild(p);});
  const nav=document.createElement("div");nav.className="fca-reading-nav";
  nav.innerHTML='<span class="fca-reading-count">PAGE <b id="fcaReadPage">1</b> / 2</span><button type="button" class="btn btn-gold btn-sm" id="fcaReadNext">Next page '+icon("right")+'</button>';
  reading.innerHTML="";reading.append(first,second,nav);
  $("#fcaReadNext",reading).addEventListener("click",function(){
   const toSecond=second.hidden;
   first.hidden=toSecond;second.hidden=!toSecond;
   $("#fcaReadPage",reading).textContent=toSecond?"2":"1";
   $("#fcaReadNext",reading).innerHTML=toSecond?'Back to page 1':'Next page '+icon("right");
   first.classList.toggle("is-current",!toSecond);second.classList.toggle("is-current",toSecond);
   reading.scrollIntoView({behavior:"smooth",block:"start"});
  });
 };
}
/* Skills Test: do not render a second copy of Track 04. The assessment's
   dedicated audio card remains; answers are one-shot and wrong answers advance. */
const fcaSkillRenderOld=renderSkillPartV13;
renderSkillPartV13=function(form,part){
 let markup=fcaSkillRenderOld(form,part);
 if(part==="listening")markup=markup.replace(/<div class="fca-audio-panel">[\s\S]*?<\/div>/,"");
 markup=markup.replace("You can retry after a hint.","One attempt per question. An incorrect answer lowers the score only.");
 markup=markup.replace("Review from the beginning","");
 return markup;
};
checkSkillPartV13=function(el,part,event,value){
 const form="A",cfg=SKILLS3_V13.A[part],root=$("#a-skills",el),id=skillResultsKeyV13(form,part);
 const feedback=$("[data-st-feedback]",root),saved=S.skillAnswers.A[part]||(S.skillAnswers.A[part]={});
 if(cfg.kind==="writing"){
  const draft=$("[data-st-draft]",root).value.trim(),ratings=[].slice.call(root.querySelectorAll("[data-st-rubric]"));
  const score=ratings.reduce(function(n,x){return n+(x.value===""?0:Number(x.value));},0);
  const old=S.results[id];
  const rec={score:score,max:15,errors:0,done:true,selfAssessment:true,bestScore:score,attempts:(old&&old.attempts||0)+1};
  S.results[id]=rec;S.logs[id]=[{q:"Writing self-assessment",user:"Draft saved; rubric "+score+"/15",ok:true}];
  const draftField=$("[data-st-draft]",root);
  saved.draft=draft;
  ratings.forEach(function(x){saved["r"+x.dataset.stRubric]=x.value||"0";});
  save();renderSkillsTestPanelV13(el);return;
 }
 const idx=(S.skillIndexByPart&&S.skillIndexByPart[part])||0;
 const total=cfg.kind==="dialogue"?cfg.correct.length:cfg.items.length;
 if(!value||idx>=total)return;
 if(!S.skillRun)S.skillRun={};
 const run=S.skillRun[part]||(S.skillRun[part]={score:0,errors:0,log:[]});
 const expected=cfg.correct[idx],ok=value===expected;
 if(ok){run.score++;noteAnswer(true,event,10);addXP(10);}
 else{run.errors++;noteAnswer(false,event);}
 const q=cfg.kind==="dialogue"?"Dialogue gap "+(idx+1):cfg.kind==="tf"?cfg.items[idx]:cfg.items[idx][0];
 const focus=skillHintV13("A",part,idx);
 run.log.push({q:q,user:value,ok:ok,focus:focus});
 saved[idx]=value;S.skillIndexByPart[part]=idx+1;
 if(idx+1>=total){
  const old=S.results[id];
  S.results[id]={score:run.score,max:total,errors:run.errors,done:true,bestScore:run.score,attempts:(old&&old.attempts||0)+1,xp:run.score*10};
  S.logs[id]=run.log;delete S.skillRun[part];
  completeTask(id,{score:run.score,max:total,errors:run.errors,xp:run.score*10,log:run.log},null);
 }
 save();renderSkillsTestPanelV13(el);
};


/* === Repair 3A pair task and reading pages === */
if(typeof fcaCrosswordStep!=="undefined"){
 fcaCrosswordStep.build=function(b){
  b.innerHTML=stepShell("Communicative Practice","users","Your Plate, Our Planet · Pair Vocabulary","Adapted from Insight 2e Pre-Intermediate Communication Worksheet 3A.")+
   '<div class="card"><div class="task-zone fca-comm-step-zone">'+communicativeActivityMarkup()+'</div></div>';
  const zone=b.querySelector(".task-zone"),button=$("#fcaSubmitComm",b);
  if(!zone||!button)return;
  zone.insertAdjacentHTML("afterbegin",'<div class="progress-line fca-question-progress"><i style="width:0%"></i></div><div class="fca-question-meta"><span>PAIR TASK · 1 / 1</span><span>One submission</span></div>');
  button.textContent="Save response & continue";
  button.addEventListener("click",function(){
   if(S.results["3a-crossword"])return;
   const field=$("#fcaCommResponse",zone),value=field?field.value.trim():"";
   const words=value.split(/\s+/).filter(Boolean).length,passed=words>=20;
   const log=[{q:"Pair vocabulary challenge · explain without saying the word",user:value||"No written explanation recorded",correct:"Explain at least three expressions and identify each as a noun or a verb.",ok:passed,focus:"Use your own wording, let your partner guess and identify the part of speech."}];
   completeTask("3a-crossword",{score:passed?1:0,max:1,errors:passed?0:1,xp:passed?10:0,log:log},zone);
   const entry={id:"3a-crossword-pair-notes",route:"Mission 3A · Your Plate, Our Planet",prompt:"Pair vocabulary challenge · explain without saying the word",text:value,analysis:analyseWriting(value,"Food vocabulary explanations"),updatedAt:new Date().toISOString()};
   const old=S.writingPortfolio.find(function(x){return x.id===entry.id;});
   if(old)Object.assign(old,entry);else S.writingPortfolio.push(entry);
   save();
  });
 };
}

/* The article is rebuilt from its original source copy before pagination.
   Page 1 contains paragraphs 1–2; page 2 contains paragraphs 3–5. */
const fcaReadingStepFixed=LESSONS[0].steps.find(function(x){return x.task==="3a-read";});
if(fcaReadingStepFixed){
 fcaReadingStepFixed.build=function(b){
  const article=[
   "Imagine keeping all your plastic rubbish for a year, and then making it into a piece of art. This is what artist Daniel Webb did in <i>Everyday Plastic</i> — a mural made from 4,490 items he collected for 12 months. Most came from food packaging. The most alarming thing? <b>93% was single-use</b> and only eight items were biodegradable!",
   "In the UK, over 50% of household food comes in a package. Most is low-quality, single-use plastic, so recycling centres can't use it. We have only <span class=\"hl\">recycled</span> about 9% of all plastic ever produced, yet we <span class=\"hl\">throw away</span> millions of tonnes every year.",
   "Food waste is another challenge: 66 tonnes every second — 2.1 billion tonnes a year. Supermarkets throw away 20–40% of displayed food because they offer around 40,000 items of choice.",
   "Meat and cheese have a bigger carbon footprint than fruit and vegetables. Cows create the same greenhouse gases as 20 million cars. We need 15,000 litres of water for 1 kg of beef — compare 800 litres for apples. <b>Food miles</b> and <span class=\"hl\">transport</span> create pollution and global warming.",
   "We need <span class=\"hl\">eco-friendly</span> and <span class=\"hl\">energy-efficient</span> solutions. Changing one thing still has an impact: Daniel gave up plastic bottles — 300 pieces less in his mural."
  ];
  b.innerHTML=stepShell("Reading","eye","The Real Cost of Food","Read both pages. Use the article as evidence when you answer the questions.")+
   '<div class="card reading fca-reading-pages">'+
   '<section class="fca-reading-page is-current" id="fcaReadingPage1">'+readingIllustrationV11("l3a","Produce in a supermarket","Food production and packaging connect local choices with global impacts.",true)+'<p class="dropcap">'+article[0]+'</p><p>'+article[1]+'</p></section>'+
   '<section class="fca-reading-page" id="fcaReadingPage2" hidden><p>'+article[2]+'</p><p>'+article[3]+'</p><p>'+article[4]+'</p></section>'+
   '<div class="fca-reading-nav"><span class="fca-reading-count">PAGE <b id="fcaReadPage">1</b> / 2</span><button type="button" class="btn btn-gold btn-sm" id="fcaReadNext">Next page '+icon("right")+'</button></div></div>'+
   '<div class="card"><div class="task-zone"></div></div>';
  const reading=$("#fcaReadingPage1",b).parentElement;
  $("#fcaReadNext",reading).addEventListener("click",function(){
   const p1=$("#fcaReadingPage1",reading),p2=$("#fcaReadingPage2",reading),toSecond=p2.hidden;
   p1.hidden=toSecond;p2.hidden=!toSecond;
   $("#fcaReadPage",reading).textContent=toSecond?"2":"1";
   $("#fcaReadNext",reading).innerHTML=toSecond?'Back to page 1':'Next page '+icon("right");
   reading.scrollIntoView({behavior:"smooth",block:"start"});
  });
  engMCQ($(".task-zone",b),{id:"3a-read",items:READ3A});
 };
}

/* === Correct Additional Materials: Word · Definition · Translation === */
function fcaBuildTrioAssessment(el){
 const box=$("#triGame",el);if(!box)return;
 const saved=S.additionalMaterials&&S.additionalMaterials.trio;
 if(saved&&saved.done){
  box.innerHTML='<div class="card soft"><b>Activity complete</b><p>Score: '+saved.score+'/6 · Errors: '+saved.errors+'. Your one attempt is saved.</p></div>';
  return;
 }
 const pool=shuffle(VOCAB.filter(function(x){return x&&x.t&&x.en&&x.ru;})).slice(0,6);
 let index=0,score=0,errors=0,log=[];
 function show(){
  if(index>=pool.length){
   S.additionalMaterials=S.additionalMaterials||{};
   S.additionalMaterials.trio={done:true,score:score,errors:errors,total:pool.length,createdAt:Date.now()};
   save();
   completeTask("additional-trio",{score:score,max:pool.length,errors:errors,xp:score*5,log:log},null);
   box.innerHTML='<div class="card soft"><span class="tag">Activity complete</span><h3>Word · Definition · Translation</h3><p>Score: <b>'+score+'/6</b> · Mistakes: '+errors+'. Your result is saved in the activity record.</p><p class="small muted">You can continue with another Additional Materials activity.</p></div>';
   return;
  }
  const target=pool[index];
  const seenDefinitions=new Set([String(target.en).trim().toLowerCase()]);
  const definitionDistractors=shuffle(VOCAB.filter(function(x){const value=String(x.en||"").trim().toLowerCase();if(!value||x.t===target.t||seenDefinitions.has(value))return false;seenDefinitions.add(value);return true;})).slice(0,3);
  const seenTranslations=new Set([String(target.ru).trim().toLowerCase()]);
  const translationDistractors=shuffle(VOCAB.filter(function(x){const value=String(x.ru||"").trim().toLowerCase();if(!value||x.t===target.t||seenTranslations.has(value))return false;seenTranslations.add(value);return true;})).slice(0,3);
  const defs=shuffle([target].concat(definitionDistractors));
  const translations=shuffle([target].concat(translationDistractors));
  const selected={def:null,ru:null};
  box.innerHTML='<div class="progress-line fca-question-progress"><i style="width:'+((index+1)/pool.length*100)+'%'"></i></div>'+
   '<div class="fca-question-meta"><span>TRIO '+(index+1)+' / '+pool.length+'</span><span>One attempt</span></div>'+
   '<div class="tri-columns fca-trio-columns"><div class="tri-column"><h3>Word</h3><div class="tri-target-word">'+esc(target.t)+'</div><small class="muted">Match this word.</small></div>'+
   '<div class="tri-column"><h3>English definition</h3>'+defs.map(function(x,i){return '<button type="button" class="tri-item" data-col="def" data-i="'+i+'">'+esc(x.en)+'</button>';}).join("")+'</div>'+
   '<div class="tri-column"><h3>Russian translation</h3>'+translations.map(function(x,i){return '<button type="button" class="tri-item" data-col="ru" data-i="'+i+'">'+esc(x.ru)+'</button>';}).join("")+'</div></div>'+
   '<div class="fad-feedback fca-answer-feedback" id="fcaTrioFeedback" aria-live="polite">Select one English definition and one Russian translation.</div>'+
   '<div class="footer-bar"><span class="small muted">One response in each column.</span><button type="button" class="btn btn-gold" id="fcaTrioSubmit" disabled>Check & continue '+icon("right")+'</button></div>';
  box.querySelectorAll(".tri-item").forEach(function(button){
   button.addEventListener("click",function(){
    if(button.disabled)return;
    const col=button.dataset.col;selected[col]=Number(button.dataset.i);
    box.querySelectorAll('.tri-item[data-col="'+col+'"]').forEach(function(x){x.classList.toggle("selected",x===button);});
    $("#fcaTrioSubmit",box).disabled=selected.def===null||selected.ru===null;
   });
  });
  $("#fcaTrioSubmit",box).addEventListener("click",function(event){
   if(selected.def===null||selected.ru===null)return;
   const ok=defs[selected.def].t===target.t&&translations[selected.ru].t===target.t;
   if(ok){score++;noteAnswer(true,event,5);}else{errors++;noteAnswer(false,event);}
   log.push({q:target.t,user:defs[selected.def].en+" · "+translations[selected.ru].ru,correct:target.en+" · "+target.ru,ok:ok,focus:"Match both the English meaning and Russian translation to the target word."});
   box.querySelectorAll(".tri-item").forEach(function(x){x.disabled=true;});
   $("#fcaTrioFeedback",box).textContent=ok?"Response recorded. Continue to the next word.":"Response recorded. Your score is lower, but you can continue.";
   const button=$("#fcaTrioSubmit",box);button.textContent="Next word "+icon("right");
   button.onclick=function(){index++;show();};
  });
 }
 show();
}
const fcaActivitiesBeforeTrio=renderActivities;
renderActivities=function(el){
 fcaActivitiesBeforeTrio(el);
 fcaBuildTrioAssessment(el);
};


/* === Final usability fixes: 3A pair work and reliable vocabulary trios === */
if(typeof fcaCrosswordStep!=="undefined"){
 fcaCrosswordStep.build=function(b){
  b.innerHTML=stepShell("Communicative Practice","users","Your Plate, Our Planet · Pair Vocabulary","Adapted from Insight 2e Pre-Intermediate Communication Worksheet 3A. Explain at least three expressions without saying the target word; identify whether each is a noun or a verb.")+
   '<div class="card"><div class="task-zone fca-comm-step-zone">'+communicativeActivityMarkup()+'</div></div>';
  const zone=b.querySelector(".task-zone"),button=$("#fcaSubmitComm",b),field=$("#fcaCommResponse",b);
  if(!zone||!button||!field)return;
  zone.insertAdjacentHTML("afterbegin",'<div class="progress-line fca-question-progress"><i style="width:0%"></i></div><div class="fca-question-meta"><span>PAIR TASK · 1 / 1</span><span>One submission</span></div>');
  button.textContent="Submit once & continue";
  button.addEventListener("click",function(event){
   if(S.results["3a-crossword"])return;
   const value=field.value.trim(),words=value.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
   const passed=words.length>=20;
   button.disabled=true;
   const log=[{q:"Pair vocabulary challenge · explain without saying the word",user:value||"No written explanation recorded",correct:"Explain at least three expressions in your own words and identify each as a noun or a verb.",ok:passed,focus:"Use your own wording, let your partner guess and identify the part of speech."}];
   completeTask("3a-crossword",{score:passed?1:0,max:1,errors:passed?0:1,xp:passed?10:0,log:log},zone);
   const entry={id:"3a-crossword-pair-notes",route:"Mission 3A · Your Plate, Our Planet",prompt:"Pair vocabulary challenge · explain without saying the word",text:value,analysis:analyseWriting(value,"Food vocabulary explanations"),updatedAt:new Date().toISOString()};
   const old=S.writingPortfolio.find(function(x){return x.id===entry.id;});
   if(old)Object.assign(old,entry);else S.writingPortfolio.push(entry);
   save();
  });
 };
}

/* Rebuild the trio task from unique source entries, with one submission per word. */
fcaBuildTrioAssessment=function(el){
 const box=$("#triGame",el);if(!box)return;
 S.additionalMaterials=S.additionalMaterials||{};
 const previous=S.additionalMaterials.trio;
 if(previous&&previous.done&&previous.version===2){
  box.innerHTML='<div class="card soft"><span class="tag">Activity complete</span><h3>Word · Definition · Translation</h3><p>Score: <b>'+previous.score+'/'+previous.total+'</b> · Mistakes: '+previous.errors+'. One attempt has been recorded.</p></div>';
  return;
 }
 if(previous&&previous.done&&previous.version!==2){
  delete S.additionalMaterials.trio;
  delete S.results["additional-trio"];
  delete S.logs["additional-trio"];
 }
 const unique=[],seen=new Set();
 VOCAB.forEach(function(item){
  if(!item||!item.t||!item.en||!item.ru||seen.has(item.t))return;
  seen.add(item.t);unique.push(item);
 });
 const pool=shuffle(unique).slice(0,6);
 let index=0,score=0,errors=0,log=[];
 function distinctOptions(target,key){
  const values=new Set([target[key]]),distractors=[];
  shuffle(unique.filter(function(item){return item.t!==target.t;})).forEach(function(item){
   const value=String(item[key]||"").trim();
   if(!value||values.has(value)||distractors.length>=3)return;
   values.add(value);distractors.push(item);
  });
  return shuffle([target].concat(distractors));
 }
 function show(){
  if(index>=pool.length){
   const result={version:2,done:true,score:score,errors:errors,total:pool.length,questions:log,createdAt:Date.now()};
   S.additionalMaterials.trio=result;
   completeTask("additional-trio",{score:score,max:pool.length,errors:errors,xp:score*5,log:log},null);
   save();
   box.innerHTML='<div class="card soft"><span class="tag">Activity complete</span><h3>Word · Definition · Translation</h3><p>Score: <b>'+score+'/6</b> · Mistakes: '+errors+'. Your one attempt is saved.</p><p class="small muted">Return to the activity tabs to choose another exercise.</p></div>';
   return;
  }
  const target=pool[index],defs=distinctOptions(target,"en"),translations=distinctOptions(target,"ru");
  const selected={definition:null,translation:null};
  box.innerHTML='<div class="progress-line fca-question-progress"><i style="width:'+(index/pool.length*100)+'%"></i></div>'+
   '<div class="fca-question-meta"><span>WORD TRIO '+(index+1)+' / '+pool.length+'</span><span>One submission</span></div>'+
   '<div class="tri-columns fca-trio-columns"><div class="tri-column"><h3>Target word</h3><div class="tri-target-word">'+esc(target.t)+'</div><small class="muted">Find its exact meaning and translation.</small></div>'+
   '<div class="tri-column"><h3>English definition</h3><div class="tri-options">'+defs.map(function(item,i){return '<button type="button" class="tri-item" data-col="definition" data-i="'+i+'">'+esc(item.en)+'</button>';}).join("")+'</div></div>'+
   '<div class="tri-column"><h3>Russian translation</h3><div class="tri-options">'+translations.map(function(item,i){return '<button type="button" class="tri-item" data-col="translation" data-i="'+i+'">'+esc(item.ru)+'</button>';}).join("")+'</div></div></div>'+
   '<div class="fad-feedback fca-answer-feedback" id="fcaTrioFeedback" aria-live="polite">Choose one definition and one translation, then submit once.</div>'+
   '<div class="footer-bar"><span class="small muted">Both selections are required.</span><button type="button" class="btn btn-gold" id="fcaTrioSubmit" disabled>Submit this trio</button></div>';
  box.querySelectorAll(".tri-item").forEach(function(button){
   button.addEventListener("click",function(){
    if(button.disabled)return;
    const col=button.dataset.col;
    if(selected[col]!==null)return;
    selected[col]=Number(button.dataset.i);
    box.querySelectorAll('.tri-item[data-col="'+col+'"]').forEach(function(option){
     option.disabled=true;option.classList.toggle("selected",option===button);
    });
    $("#fcaTrioSubmit",box).disabled=selected.definition===null||selected.translation===null;
   });
  });
  $("#fcaTrioSubmit",box).addEventListener("click",function(event){
   if(selected.definition===null||selected.translation===null||this.disabled)return;
   const ok=defs[selected.definition].t===target.t&&translations[selected.translation].t===target.t;
   if(ok){score++;noteAnswer(true,event,5);}else{errors++;noteAnswer(false,event);}
   log.push({q:target.t,user:defs[selected.definition].en+" · "+translations[selected.translation].ru,correct:target.en+" · "+target.ru,ok:ok,focus:"Match both the English definition and Russian translation to the target word."});
   box.querySelectorAll(".tri-item").forEach(function(option){option.disabled=true;});
   const progress=$(".fca-question-progress i",box);if(progress)progress.style.width=((index+1)/pool.length*100)+"%";
   $("#fcaTrioFeedback",box).textContent=ok?"Both matches are correct. Continue to the next word.":"This trio is recorded. The mistake lowers the score only; continue to the next word.";
   const submit=$("#fcaTrioSubmit",box);submit.disabled=false;submit.textContent=index===pool.length-1?"Finish activity":"Next word";
   submit.onclick=function(){index++;show();};
  });
 }
 show();
};

App.go({name:"start"});updateTopbar();
})();