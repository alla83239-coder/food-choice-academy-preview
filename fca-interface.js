/* Food Choice Academy · desktop workspace, student guide and assistant phone */
(function(){
"use strict";
if(typeof S==="undefined"||typeof App==="undefined")return;

function updateMissionProgress(){
 const screen=document.querySelector("#app .screen"),route=S.route||{};
 if(!screen)return;
 screen.querySelector(".fca-mission-progress")?.remove();
 if(route.name!=="step"||!Number.isInteger(S.fcActiveMission))return;
 const index=S.fcActiveMission,m=FOOD_CHOICE_MISSIONS[index];if(!m)return;
 const st=LESSONS[route.l]?.steps[route.s],task=st&&st.task,req=m.requires||[];
 const taskDone=req.filter(id=>!!S.results[id]).length;
 const decisionDone=!!(m.decision&&S.decisions[m.decision]);
 const done=taskDone+(m.decision&&decisionDone?1:0),total=req.length+(m.decision?1:0);
 const pos=req.indexOf(task),decisionPos=!!(st&&st.decision&&st.decision===m.decision);
 const current=pos>=0?pos+1:decisionPos?req.length+1:Math.min(total,done+1);
 const pct=total?Math.min(100,done/total*100):0;
 const bar=document.createElement("section");bar.className="fca-mission-progress";
 bar.innerHTML='<div class="fca-mission-progress-head"><span>MISSION '+String(index+1).padStart(2,"0")+' · '+esc(m.title)+'</span><b>TASK '+current+' / '+total+'</b></div><div class="fca-mission-progress-track"><i style="width:'+pct+'%"></i></div>';
 screen.insertBefore(bar,screen.firstChild);
}
function renderStudentGuide(el){
 const rows=[
 ["01 · Вход в академию","Введите имя для сертификата и нажмите Let's start. Имя можно использовать как имя команды. После входа откроется рабочий стол с боковым меню."],
 ["02 · Рабочий стол","Слева находятся карта миссий, Student Guide, My Project, Vocabulary, Grammar Reference, Additional Materials, Final Skills Test, Audio & Video, Teacher’s Notes и Achievements. На узком экране панель сворачивается в значки."],
 ["03 · Карта миссий","Курс состоит из 12 миссий. Они открываются последовательно. На карточке миссии нажмите Open mission; ранее завершённую миссию можно открыть для просмотра результата."],
 ["04 · Один экран — одно задание","Внутри миссии задания идут по одному. Читайте инструкцию вверху, выполните действие и нажмите Continue или Finish task. Не нужно прокручивать всю миссию в поисках следующего задания."],
 ["05 · Progress Bar","Верхняя полоса показывает продвижение по текущей миссии. В тестах есть дополнительная полоса по вопросам. Она обновляется после фиксации каждого ответа."],
 ["06 · Одна попытка","В тестовом вопросе можно выбрать один вариант один раз. После выбора варианты блокируются. Ошибка уменьшает балл, но не закрывает миссию и не мешает нажать Continue. Повторного ответа или кнопки Retry нет."],
 ["07 · Чтение и страницы","В заданиях с несколькими страницами нажмите Next page, чтобы перейти дальше, и Back to page 1, чтобы вернуться. Внимательно прочитайте обе страницы до вопросов."],
 ["08 · Аудио и видео","Нажмите Play вручную. Автоматической озвучки нет. Если к заданию приложен один аудиоплеер, используйте его для прослушивания; воспроизведение можно остановить и продолжить. Ответ фиксируется отдельно от воспроизведения."],
 ["09 · Письменные ответы","Введите свой текст и отправьте его один раз. Language Coach показывает формативные подсказки о грамматике, пунктуации и лексике. Эти подсказки не блокируют переход и не заменяют оценку преподавателя."],
 ["10 · Смартфон помощников","Нажмите на смартфон в правом нижнем углу. Ms Harper помогает с проектом, Jess — с английским, Ben — с навигацией и интерфейсом. Помощники дают подсказки по текущему экрану, но не выбирают ответ за вас."],
 ["11 · My Project","Здесь собираются результаты миссий: гипотеза, заметки по чтению, меню, расчёт нутриентов, углеродный след, закупочная корзина, выбор автомата, бюджет, планировка и запуск столовой. Используйте материалы для финальной презентации."],
 ["12 · Дополнительные материалы","Additional Materials, Vocabulary и Grammar Reference можно открывать отдельно от обязательной цепочки миссий. В Word · Definition · Translation сначала выберите соответствия, затем отправьте тройку один раз."],
 ["13 · Баллы и ошибки","Система начисляет баллы за правильные ответы. Неправильный ответ уменьшает результат конкретного задания, но не лишает доступа к следующему экрану. В конце можно открыть Review answers, чтобы посмотреть свой ответ и подсказку."],
 ["14 · Сохранение прогресса","В preview прогресс сохраняется в браузере на этом устройстве. Продолжайте работу в том же браузере и не очищайте данные сайта. В Moodle прогресс передаётся через SCORM 1.2, если пакет загружен в курс и LMS принимает данные."],
 ["15 · Финальная защита","После открытия Final Project проверьте собранные результаты, заполните самооценку и представьте бизнес-план школьной столовой. Перед защитой убедитесь, что названия, расчёты и источники внесены в My Project."]
 ];
 el.innerHTML='<section class="fca-student-guide"><div class="photo-hero fca-guide-hero"><div class="veil"></div><div class="ph-content"><div class="kicker">FOOD CHOICE ACADEMY · STUDENT HANDBOOK</div><h1>Инструкция для студента</h1><p>Как пользоваться системой и выполнять проект по шагам.</p></div></div><div class="fca-guide-intro"><span class="tag">Начните отсюда</span><h2>Проходите курс последовательно — экран за экраном</h2><p>Используйте боковое меню, Progress Bar и смартфон помощников.</p></div><div class="fca-guide-grid">'+rows.map(function(x,i){return '<article class="fca-guide-card"><span>'+String(i+1).padStart(2,"0")+'</span><div><h3>'+x[0]+'</h3><p>'+x[1]+'</p></div></article>';}).join("")+'</div><div class="fca-guide-actions"><button class="btn btn-ghost" data-action="nav" data-page="missions">← Карта миссий</button><button class="btn btn-gold" id="fcaGuideStart">Начать / продолжить обучение '+icon("right")+'</button></div></section>';
 document.querySelector("#fcaGuideStart").addEventListener("click",function(){if(S.name)Actions["resume-fc"]();else App.go({name:"start"});});
}
const helpers=[{id:"harper",name:"Ms Harper",role:"Project manager"},{id:"jess",name:"Jess",role:"English coach"},{id:"ben",name:"Ben",role:"Study guide"}];
function phoneHint(id){
 const r=S.route||{},st=r.name==="step"?LESSONS[r.l]?.steps[r.s]:null,title=st?st.title+" "+(st.tag||""):"";
 if(id==="harper")return /menu|nutrition|carbon|procurement|canteen|vending|opening/i.test(title)?"Сравните доказательства, стоимость, безопасность продуктов и практическую реализуемость. Запишите источник каждого показателя.":"Посмотрите на задание глазами менеджера столовой: какую проблему решаем и какие данные подтверждают решение?";
 if(id==="jess")return /vocab|language|grammar|writing|pair/i.test(title)?"Посмотрите на слова вокруг пропуска. Определите тип существительного, смысл предложения и грамматическую конструкцию.":"Обратите внимание на ключевые глаголы, лексику Unit 3 и полезные выражения. Объясните выбор по-английски.";
 return r.name==="step"?"После фиксации ответа нажмите Continue. Ошибка снижает балл, но не блокирует путь дальше.":"Боковое меню открывает карту миссий, My Project и инструкцию.";
}
function createPhone(){
 if(document.querySelector("#fcaPhoneDock"))return;
 const dock=document.createElement("aside");dock.id="fcaPhoneDock";dock.className="fca-phone-dock is-collapsed";dock.hidden=true;
 dock.innerHTML='<div class="fca-phone-shell"><div class="fca-phone-speaker"></div><div class="fca-phone-screen"><div class="fca-phone-top"><span>ACADEMY HELP</span><button type="button" id="fcaPhoneToggle">＋</button></div><div class="fca-phone-mini"><b>Your assistants</b><div class="fca-phone-faces"><span>'+avatar("harper",30)+'</span><span>'+avatar("jess",30)+'</span><span>'+avatar("ben",30)+'</span></div><small>Нажмите, чтобы открыть помощников</small></div><div class="fca-phone-full"><div class="fca-phone-current"><span id="fcaPhoneFace"></span><div><b id="fcaPhoneName">Ms Harper</b><small id="fcaPhoneRole">Project manager</small></div></div><div class="fca-phone-helper-list">'+helpers.map(x=>'<button type="button" class="fca-phone-helper" data-helper="'+x.id+'">'+x.name+'</button>').join("")+'</div><div class="fca-phone-message-label">Подсказка для этого экрана</div><div class="fca-phone-message" id="fcaPhoneMessage"></div><button type="button" class="btn btn-gold btn-sm fca-phone-guide" data-action="nav" data-page="studentGuide">Открыть инструкцию</button></div></div></div>';
 document.body.appendChild(dock);
 document.querySelector("#fcaPhoneToggle").addEventListener("click",function(){dock.classList.toggle("is-collapsed");this.textContent=dock.classList.contains("is-collapsed")?"＋":"−";});
 dock.addEventListener("click",function(e){const b=e.target.closest(".fca-phone-helper");if(!b)return;S.fcaActiveHelper=b.dataset.helper;save();updatePhone();});
}
function updatePhone(){
 const dock=document.querySelector("#fcaPhoneDock");if(!dock)return;
 const show=!!S.name&&(S.route||{}).name!=="start";dock.hidden=!show;if(!show)return;
 const id=S.fcaActiveHelper||"harper",h=helpers.find(x=>x.id===id)||helpers[0];
 document.querySelector("#fcaPhoneFace").innerHTML=avatar(id,40);
 document.querySelector("#fcaPhoneName").textContent=h.name;
 document.querySelector("#fcaPhoneRole").textContent=h.role;
 document.querySelector("#fcaPhoneMessage").textContent=phoneHint(id);
 dock.querySelectorAll(".fca-phone-helper").forEach(b=>b.classList.toggle("active",b.dataset.helper===id));
}
if(!NAV.some(x=>x.page==="studentGuide"))NAV.splice(1,0,{page:"studentGuide",label:"Student Guide",ic:"book"});
const navBase=Actions.nav;
Actions.nav=function(button){if(button&&button.dataset.page==="studentGuide"){App.go({name:"studentGuide"});return;}return navBase(button);};
const startBase=renderStart;
renderStart=function(el){startBase(el);const b=document.createElement("button");b.type="button";b.className="btn btn-ghost btn-sm fca-start-guide";b.textContent="Инструкция для студента";b.addEventListener("click",()=>App.go({name:"studentGuide"}));(el.querySelector(".hero-cta")||el).appendChild(b);};
const skillsBase=renderSkillsTestPanelV13;
function fcaSkillAdvance(el,part){
 const run=S.skillRun&&S.skillRun[part],pending=run&&run.pending;
 if(!pending)return;
 const cfg=SKILLS3_V13.A[part],total=cfg.kind==="dialogue"?cfg.correct.length:cfg.items.length;
 const id=skillResultsKeyV13("A",part);
 run.pending=null;
 S.skillIndexByPart[part]=pending.index+1;
 if(pending.index+1>=total){
  S.results[id]={score:run.score,max:total,errors:run.errors,done:true,bestScore:run.score,attempts:1,xp:run.score*10};
  S.logs[id]=run.log.slice();
  delete S.skillRun[part];
 }
 save();
 renderSkillsTestPanelV13(el);
}
function fcaRestoreSkillPending(el,part){
 const run=S.skillRun&&S.skillRun[part],pending=run&&run.pending;
 if(!pending)return;
 const root=$("#a-skills",el),body=$("#skillsPartBody",root);if(!body)return;
 body.querySelectorAll("[data-st-choice]").forEach(function(button){
  button.disabled=true;
  if(button.dataset.stChoice===pending.value)button.classList.add(pending.ok?"right":"wrong");
 });
 const feedback=$("[data-st-feedback]",body);
 if(feedback)feedback.textContent=pending.ok
  ?"Answer recorded. Continue to the next question."
  :"Answer recorded. This mistake lowers the score only; it does not block the section.";
 const card=feedback&&feedback.closest(".qcard");
 if(card&&!card.querySelector("[data-st-continue]")){
  const footer=document.createElement("div");footer.className="footer-bar fca-question-footer";
  const cfg=SKILLS3_V13.A[part],total=cfg.kind==="dialogue"?cfg.correct.length:cfg.items.length;
  footer.innerHTML='<span class="small muted">Question '+(pending.index+1)+' / '+total+' · one attempt</span><button type="button" class="btn btn-gold" data-st-continue>Continue '+icon("right")+'</button>';
  card.appendChild(footer);
  footer.querySelector("[data-st-continue]").addEventListener("click",function(){fcaSkillAdvance(el,part);});
 }
 const progress=$(".progress-line i",body);
 if(progress){const cfg=SKILLS3_V13.A[part],total=cfg.kind==="dialogue"?cfg.correct.length:cfg.items.length;progress.style.width=((pending.index+1)/total*100)+"%";}
}
renderSkillsTestPanelV13=function(el){
 skillsBase(el);
 const root=$("#a-skills",el),body=$("#skillsPartBody",root);
 if(!body)return;
 body.innerHTML=body.innerHTML.replace("You can retry after a hint.","One attempt per question. A mistake lowers the score only; it never blocks progress.");
 body.querySelectorAll("[data-st-restart]").forEach(function(button){button.remove();});
 /* Keep one player per recording, even if an earlier template inserted it twice. */
 const seenAudio=new Set();
 Array.from(el.querySelectorAll("audio")).forEach(function(audio){
  const source=audio.currentSrc||audio.getAttribute("src")||audio.querySelector("source")?.getAttribute("src")||"";
  if(!source)return;
  if(seenAudio.has(source)){
   const panel=audio.closest(".fca-audio-panel,.audio-row,.mission-audio-row");
   if(panel)panel.remove();else audio.remove();
  }else seenAudio.add(source);
 });
 const part=S.skillPart||"everyday";
 if(part==="writing"){
  const result=S.results[skillResultsKeyV13("A","writing")];
  if(result&&result.done){
   const draft=S.skillAnswers?.A?.writing?.draft||"";
   body.innerHTML='<div class="skills-result"><span class="tag">Writing submitted · one attempt</span><h2>Writing · Birthday invitation</h2><p>Your draft and self-assessment are saved.</p><div class="card reading"><p>'+esc(draft)+'</p></div><p class="small muted">Self-assessment score: '+result.score+'/'+result.max+'. Your response is saved in My Project.</p></div>';
  }
 }else{
  fcaRestoreSkillPending(el,part);
 }
};
const fcaCheckSkillBeforeSingleAttempt=checkSkillPartV13;
checkSkillPartV13=function(el,part,event,value){
 const cfg=SKILLS3_V13.A[part];
 if(!cfg||cfg.kind==="writing")return fcaCheckSkillBeforeSingleAttempt(el,part,event,value);
 if(value===null||value===undefined||value==="")return;
 const id=skillResultsKeyV13("A",part);
 if(S.results[id]&&S.results[id].done)return;
 if(!S.skillRun)S.skillRun={};
 const run=S.skillRun[part]||(S.skillRun[part]={score:0,errors:0,log:[],pending:null});
 if(run.pending)return;
 const index=Number(S.skillIndexByPart[part]||0);
 const total=cfg.kind==="dialogue"?cfg.correct.length:cfg.items.length;
 if(index>=total)return;
 const expected=String(cfg.correct[index]),picked=String(value),ok=picked===expected;
 const choiceLabel=cfg.kind==="dialogue"
  ?(cfg.choices.find(function(x){return x.indexOf(picked)===0;})||picked)
  :cfg.kind==="tf"?(picked==="T"?"True":"False"):picked;
 const correctLabel=cfg.kind==="dialogue"
  ?(cfg.choices.find(function(x){return x.indexOf(expected)===0;})||expected)
  :cfg.kind==="tf"?(expected==="T"?"True":"False"):expected;
 const question=cfg.kind==="dialogue"
  ?("Dialogue gap "+(index+1)+" · "+((cfg.lines.find(function(x){return x[2]===index+1;})||[]).slice(0,2).join(": ")))
  :cfg.kind==="tf"?cfg.items[index]:cfg.items[index][0];
 if(ok){run.score++;noteAnswer(true,event,10);addXP(10);}
 else{run.errors++;noteAnswer(false,event);}
 run.log.push({q:question,user:choiceLabel,correct:correctLabel,ok:ok,focus:skillHintV13("A",part,index)});
 if(!S.skillAnswers)S.skillAnswers={A:{}};
 if(!S.skillAnswers.A)S.skillAnswers.A={};
 if(!S.skillAnswers.A[part])S.skillAnswers.A[part]={};
 S.skillAnswers.A[part][index]=picked;
 run.pending={index:index,value:picked,ok:ok};
 save();
 fcaRestoreSkillPending(el,part);
};

const appGoBase=App.go.bind(App);
App.go=function(route){
 if(route&&route.name==="studentGuide"){
  this.clear();S.route=route;save();closeModal();document.body.classList.remove("no-bar");document.querySelector("#topbar").classList.add("on");
  const app=document.querySelector("#app");app.innerHTML="";const screen=document.createElement("div");screen.className="screen";app.appendChild(screen);
  renderStudentGuide(screen);updateTopbar();window.scrollTo({top:0,behavior:"instant"});createPhone();updatePhone();return;
 }
 const result=appGoBase(route),hide=route&&route.name==="start"&&!S.name;
 document.body.classList.toggle("no-bar",!!hide);document.querySelector("#topbar").classList.toggle("on",!hide);
 createPhone();updatePhone();updateMissionProgress();return result;
};
/* Final interaction layer: exactly one completion panel and mission-aware Continue. */
const fcaCompleteOneScreenBase=completeTask;
completeTask=function(id,res,zone){
 if(S.results&&S.results[id])return;
 fcaCompleteOneScreenBase(id,res,null);
 if(zone&&zone.nodeType===1){
  zone.innerHTML=donePanelHTML(id);
  zone.classList.add("fca-task-complete");
  const screen=document.querySelector("#app .screen");
  if(screen){
   screen.querySelectorAll('[data-action="next-step"]').forEach(function(button){
    if(!zone.contains(button))button.remove();
   });
   zone.querySelectorAll('[data-action="next-step"]').forEach(function(button,index){if(index>0)button.remove();});
  }
  zone.scrollIntoView({behavior:"smooth",block:"nearest"});
 }
};
const fcaNextOneScreenBase=Actions["next-step"];
Actions["next-step"]=function(btn){
 const route=S.route||{};
 if(route.name==="step"&&Number.isInteger(S.fcActiveMission)){
  const missionIndex=S.fcActiveMission,mission=FOOD_CHOICE_MISSIONS[missionIndex];
  const chapter=mission&&mission.target?mission.target.l:route.l;
  let next=null;
  if(mission){
   const required=mission.requires||[];
   for(let i=0;i<LESSONS[chapter].steps.length;i++){
    const step=LESSONS[chapter].steps[i];
    if(step.task&&required.includes(step.task)&&!S.results[step.task]){next={name:"step",l:chapter,s:i};break;}
    if(step.decision&&mission.decision===step.decision&&!S.decisions[mission.decision]){next={name:"step",l:chapter,s:i};break;}
   }
   if(next){
    S.stepPos[chapter]=next.s;
    S.fcResumeRoute=next;
    save();
    App.go(next);
    return;
   }
   S.fcMissionCompletedAt=missionIndex;
   S.fcActiveMission=null;
   S.fcResumeRoute={name:"missions"};
   save();
   App.go({name:"missions"});
   return;
  }
 }
 return fcaNextOneScreenBase(btn);
};
/* One source recording per Skills Test question; keep the actual player visible. */
const fcaSkillsOneAudioBase=renderSkillsTestPanelV13;
renderSkillsTestPanelV13=function(el){
 fcaSkillsOneAudioBase(el);
 const body=el.querySelector("#skillsPartBody");if(!body)return;
 const seen=new Set();
 Array.from(el.querySelectorAll("audio")).forEach(function(audio){
  const source=audio.currentSrc||audio.getAttribute("src")||audio.querySelector("source")?.getAttribute("src")||"";
  if(!source)return;
  if(seen.has(source)){
   const panel=audio.closest(".fca-audio-panel,.audio-row,.mission-audio-row");
   if(panel)panel.remove();else audio.remove();
  }else seen.add(source);
 });
 body.querySelectorAll("[data-st-restart]").forEach(function(button){button.remove();});
 body.innerHTML=body.innerHTML
  .replaceAll("You can retry after a hint.","One attempt per question. An incorrect answer lowers the score only.")
  .replaceAll("Try another option.","Your response is recorded. Continue to the next question.");
};
createPhone();updatePhone();
if(S.route&&S.route.name==="start"&&!S.name){
 document.body.classList.add("no-bar");document.querySelector("#topbar").classList.remove("on");
 const current=document.querySelector("#app .screen");
 if(current&&!current.querySelector(".fca-start-guide")){
  const button=document.createElement("button");button.type="button";button.className="btn btn-ghost btn-sm fca-start-guide";button.textContent="Инструкция для студента";
  button.addEventListener("click",function(){App.go({name:"studentGuide"});});
  (current.querySelector(".hero-cta")||current).appendChild(button);
 }
}

})();
