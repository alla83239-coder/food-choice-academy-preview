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
 const done=req.filter(id=>!!S.results[id]).length,total=req.length+(m.decision?1:0);
 const pos=req.indexOf(task),current=pos>=0?pos+1:Math.min(total,done+1),pct=total?done/total*100:0;
 const bar=document.createElement("section");bar.className="fca-mission-progress";
 bar.innerHTML='<div class="fca-mission-progress-head"><span>MISSION '+String(index+1).padStart(2,"0")+' · '+esc(m.title)+'</span><b>TASK '+current+' / '+total+'</b></div><div class="fca-mission-progress-track"><i style="width:'+pct+'%"></i></div>';
 screen.insertBefore(bar,screen.firstChild);
}
function renderStudentGuide(el){
 const rows=[
 ["Начало работы","Введите имя один раз. После входа откроется рабочий стол Food Choice Academy с картой из 12 миссий."],
 ["Боковое меню","Слева находятся карта миссий, Student Guide, My Project и разделы курса. Нажмите название раздела, чтобы перейти в него. На узком экране меню сворачивается до значков."],
 ["Карта миссий","Проходите миссии по порядку. Следующая миссия откроется после сохранения всех обязательных заданий текущей миссии. Дополнительные материалы можно изучать отдельно."],
 ["Один вопрос — одна попытка","Выберите один вариант ответа. После нажатия ответа варианты блокируются. Исправить его нельзя: за ошибку снимается балл, но задание продолжается. Ошибки не закрывают доступ к следующим вопросам или миссиям."],
 ["Кнопка Continue","После фиксации ответа появится одна кнопка Continue. Нажмите её, чтобы перейти к следующему вопросу или следующему обязательному заданию миссии. Не нужно прокручивать страницу в поисках следующего задания."],
 ["Progress Bar","Верхняя полоса показывает продвижение по миссии. Полоса внутри теста показывает номер текущего вопроса и движение к завершению задания."],
 ["Чтение и аудио","В заданиях на чтение используйте Next page и Back to page 1. На каждой странице показывается свой фрагмент текста. Для Listening используйте один аудиоплеер: нажмите Play вручную, затем отвечайте на вопросы."],
 ["Письменные задания","Введите ответ в текстовое поле и нажмите кнопку сохранения задания. Language Coach отмечает распространённые языковые ошибки и предлагает подсказки; его комментарии не являются автоматической итоговой оценкой преподавателя."],
 ["Смартфон помощников","В правом нижнем углу находится смартфон. Нажмите +, чтобы открыть его, и выберите Ms Harper (проект), Jess (английский) или Ben (навигация). Помощники дают наводящие подсказки, а не готовые ответы."],
 ["My Project","В боковом меню откройте My Project: там собраны сохранённые ответы, письменные работы, меню, расчёты пищевой ценности, углеродного следа, закупки, решение по автомату и план запуска столовой."],
 ["Сохранение прогресса","В браузерном Preview прогресс сохраняется в этом браузере на этом устройстве. Не очищайте данные сайта и не переходите на другое устройство до завершения работы. В Moodle прогресс передаётся через SCORM 1.2."],
 ["Финальная защита","После 12 миссий откройте Final Project. Проверьте данные, заполните самооценку, просмотрите бизнес-предложение и используйте Print / Save as PDF для сохранения презентации."]
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
renderSkillsTestPanelV13=function(el){skillsBase(el);const body=el.querySelector("#skillsPartBody");if(!body)return;body.querySelector(".fca-audio-panel")?.remove();body.querySelectorAll("[data-st-restart]").forEach(x=>x.remove());body.innerHTML=body.innerHTML.replace("You can retry after a hint.","One attempt per question. An incorrect answer lowers the score only.");};
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
/* Remove any stale duplicate audio and review/restart controls from the Skills Test. */
const fcaSkillsOneAudioBase=renderSkillsTestPanelV13;
renderSkillsTestPanelV13=function(el){
 fcaSkillsOneAudioBase(el);
 const body=el.querySelector("#skillsPartBody");if(!body)return;
 body.querySelector(".fca-audio-panel")?.remove();
 const players=Array.from(body.querySelectorAll("audio"));
 players.slice(1).forEach(function(audio){const panel=audio.closest(".skills-audio,.fca-audio-panel");if(panel)panel.remove();else audio.remove();});
 body.querySelectorAll("[data-st-restart]").forEach(function(button){button.remove();});
 body.innerHTML=body.innerHTML
  .replaceAll("You can retry after a hint.","One attempt per question. An incorrect answer lowers the score only.")
  .replaceAll("Try another option.","Your response is recorded. Continue to the next question.");
};
createPhone();
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
