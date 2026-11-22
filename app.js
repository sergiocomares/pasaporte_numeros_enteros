(function () {
  "use strict";

  const app = document.getElementById("app");
  const GAME_KEY = "pasaporte_numeros_enteros_game_v1";
  const RECORDS_KEY = "pasaporte_numeros_enteros_records_v1";
  const data = window.PASAPORTE_DATA;

  let state = loadGame();
  let feedback = null;
  let questionIndex = 0;
  let stationIndex = 0;
  let view = state.student.name ? "map" : "home";
  if (state.completed) view = "report";

  function newGame() {
    return {
      student:{name:"",course:"",date:new Date().toISOString().slice(0,10)},
      startedAt:null, finishedAt:null, elapsedSeconds:0,
      answers:{}, attempts:{}, hints:{}, wrongAttempts:{},
      fichaProgress:{},
      temperatureProgress:{},
      divisionProgress:{},
      stationUnlocked:1, completed:false
    };
  }

  function loadGame() {
    try {
      const saved=JSON.parse(localStorage.getItem(GAME_KEY));
      if(!saved)return newGame();
      saved.fichaProgress=saved.fichaProgress||{};
      saved.temperatureProgress=saved.temperatureProgress||{};
      saved.divisionProgress=saved.divisionProgress||{};
      return saved;
    }
    catch (_) { return newGame(); }
  }

  function saveGame() {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c =>
      ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }

  function header() {
    if (!state.student.name) return "";
    const pct = Math.round(correctCount() / 33 * 100);
    const stamps = [1,2,3].filter(n => stationComplete(n)).length;
    return `<header class="game-header">
      <div class="brand-mini"><span class="compass">✥</span><b>PASAPORTE</b></div>
      <div class="student-name">${escapeHtml(state.student.name)}</div>
      <div class="header-progress"><span>PROGRESO</span><div><i style="width:${pct}%"></i></div></div>
      <div class="score-box"><span>PUNTOS</span><b>${correctCount()}</b>/33</div>
      <div class="stamp-mini">${[1,2,3].map(n => `<span class="${n <= stamps ? "earned" : ""}">●</span>`).join("")}</div>
    </header>`;
  }

  function shell(content) {
    app.innerHTML = header() + `<main>${content}</main>`;
  }

  function render() {
    feedback = feedback || null;
    if (view === "home") return renderHome();
    if (view === "identify") return renderIdentify();
    if (view === "map") return renderMap();
    if (view === "stationIntro") return renderStationIntro();
    if (view === "question") return renderQuestion();
    if (view === "finalIntro") return renderFinalIntro();
    if (view === "finalQuestion") return renderFinalQuestion();
    if (view === "finalCelebration") return renderFinalCelebration();
    if (view === "report") return renderReport();
    if (view === "credits") return renderCredits();
  }

  function renderHome() {
    shell(`<section class="home-screen">
      <div class="travel-lines"></div>
      <div class="passport-hero" aria-label="Pasaporte abierto">
        <div class="passport-cover">PASAPORTE</div>
      </div>
      <div class="hero-copy">
        <p class="eyebrow">MISIÓN MATEMÁTICA</p>
        <h1>PASAPORTE:<br><span>NÚMEROS ENTEROS</span></h1>
        <p>Tres estaciones te esperan. Supera todas las pruebas, consigue tus sellos y demuestra que dominas los números enteros.</p>
        <button class="primary big" id="startBtn">COMENZAR MISIÓN <b>→</b></button>
      </div>
    </section>`);
    document.getElementById("startBtn").onclick = () => { view="identify"; render(); };
  }

  function renderIdentify() {
    shell(`<section class="card identify-card">
      <p class="eyebrow">DATOS DEL VIAJERO</p>
      <h2>Identifica a la persona viajera</h2>
      <form id="studentForm" novalidate>
        <label>Nombre y apellidos<input name="name" required value="${escapeHtml(state.student.name)}" autocomplete="name"></label>
        <label>Curso y grupo<input name="course" required value="${escapeHtml(state.student.course)}" placeholder="Ej. 2.º ESO - A"></label>
        <label>Fecha de realizacion<input name="date" type="date" required value="${escapeHtml(state.student.date)}"></label>
        <p class="form-error" id="formError" role="alert"></p>
        <button class="primary" type="submit">INICIAR PASAPORTE →</button>
      </form>
    </section>`);
    document.getElementById("studentForm").onsubmit = e => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const name = String(form.get("name")).trim();
      const course = String(form.get("course")).trim();
      const date = String(form.get("date")).trim();
      if (!name || !course) {
        document.getElementById("formError").textContent = "Completa el nombre y el curso o grupo.";
        return;
      }
      state.student = {name,course,date};
      if (!state.startedAt) state.startedAt = Date.now();
      saveGame(); view="map"; render();
    };
  }

  function renderMap() {
    const cards = data.stations.map((s,i)=>{
      const unlocked = s.id <= state.stationUnlocked;
      const complete = stationComplete(s.id);
      return `<article class="station-card ${unlocked?"":"locked"} ${complete?"complete":""}">
        <div class="station-number">0${s.id}</div>
        <div><p>ESTACIÓN ${s.id}</p><h3>${s.title}</h3><span>${complete?"COMPLETADA":unlocked?"DISPONIBLE":"BLOQUEADA"}</span></div>
        <button ${unlocked?"":"disabled"} data-station="${i}">${complete?"REVISAR":"ENTRAR"} →</button>
      </article>`;
    }).join("");
    const finalUnlocked = state.stationUnlocked >= 4;
    shell(`<section class="map-screen">
      <div class="map-heading"><p class="eyebrow">RUTA DE LA MISIÓN</p><h2>Elige tu siguiente destino</h2></div>
      <div class="station-list">${cards}</div>
      <article class="station-card final-card ${finalUnlocked?"":"locked"}">
        <div class="station-number">★</div><div><p>RETO FINAL</p><h3>LA GRAN MISIÓN MATEMÁTICA</h3><span>${finalUnlocked?"DISPONIBLE":"Completa las tres estaciones"}</span></div>
        <button id="finalMapBtn" ${finalUnlocked?"":"disabled"}>ENTRAR →</button>
      </article>
    </section>`);
    document.querySelectorAll("[data-station]").forEach(btn => btn.onclick = () => {
      stationIndex=Number(btn.dataset.station); view="stationIntro"; render();
    });
    const finalBtn=document.getElementById("finalMapBtn");
    if(finalBtn) finalBtn.onclick=()=>{view="finalIntro";render();}
  }

  function renderStationIntro() {
    const s=data.stations[stationIndex];
    shell(`<section class="intro-screen">
      <div class="route-anim">ESTACIÓN ${s.id}</div>
      <p class="eyebrow">${s.subtitle}</p><h1>${s.title}</h1>
      <p>Prepárate para superar 10 pruebas y conseguir tu siguiente sello.</p>
      <button class="primary big" id="enterStation">ENTRAR EN LA ESTACIÓN →</button>
      <button class="text-button" id="backMap">Volver al mapa</button>
    </section>`);
    document.getElementById("enterStation").onclick=()=>{questionIndex=0;feedback=null;view="question";render();};
    document.getElementById("backMap").onclick=()=>{view="map";render();};
  }

  function getQuestion() { return data.stations[stationIndex].questions[questionIndex]; }

  function renderQuestion() {
    const s=data.stations[stationIndex], q=getQuestion();
    const existing=state.answers[q.id] ?? "";
    if(s.id===1 && q.visual==="fichas"){
      return renderFichaQuestion(s,q);
    }
    if(s.id===2 && (q.visual==="temperature"||q.visual==="temperatures")){
      return renderTemperatureQuestion(s,q);
    }
    if(s.id===3 && q.visual==="division"){
      return renderDivisionQuestion(s,q);
    }
    const visual=renderVisual(q);
    shell(`<section class="question-layout">
      <aside class="question-sidebar">
        <p>ESTACIÓN ${s.id}</p><h3>${s.title}</h3>
        <div class="question-dots">${s.questions.map((_,i)=>`<button class="${i===questionIndex?"active":""} ${state.answers[s.questions[i].id]!==undefined?"answered":""}" data-index="${i}" aria-label="Ejercicio ${i+1}">${i+1}</button>`).join("")}</div>
        <button class="text-button" id="backMap2">← Volver al mapa</button>
      </aside>
      <section class="question-main">
        <div class="question-label">EJERCICIO ${questionIndex+1} DE 10</div>
        <h2>${q.prompt}</h2>
        ${visual}
        ${q.visual==="fichas"?`<div class="ficha-controls"><button id="pairBtn" class="secondary">Emparejar una pareja</button></div>`:""}
        <form id="answerForm" class="answer-form">
          ${q.visual==="temperatures"
            ? `<label>Primera temperatura<input name="temperature1" placeholder="-10"></label><label>Segunda temperatura<input name="temperature2" placeholder="13"></label>`
            : `<label>${q.answer==="expression3"?"Operación matemática":"Resultado"}<input name="answer" inputmode="${q.answer==="expression3"?"text":"decimal"}" autocomplete="off" value="${escapeHtml(existing)}" placeholder="${q.answer==="expression3"?"Ej. 5 - 2":"Escribe el resultado"}"></label>`}
          <button type="button" id="hintBtn" class="secondary">Necesito una pista</button>
          <button type="submit" class="primary">COMPROBAR</button>
        </form>
        ${feedback?`<div class="feedback ${feedback.type}" role="status"><b>${feedback.title}</b><span>${feedback.text}</span></div>`:""}
        <div class="question-nav">
          <button class="text-button" id="prevQ" ${questionIndex===0?"disabled":""}>← Anterior</button>
          ${isQuestionCorrect(q)?`<button class="primary" id="nextQ">${questionIndex===9?"FINALIZAR ESTACIÓN":"SIGUIENTE"} →</button>`:""}
        </div>
      </section>
    </section>`);
    bindQuestionEvents(s,q);
  }

  function ensureDivisionState(q){
    const amount=Math.abs(q.dividend);
    if(!state.divisionProgress[q.id]){
      state.divisionProgress[q.id]={locations:Array(amount).fill("reserve"),selected:null,checked:false,manualFichas:false};
      saveGame();
    }
    return state.divisionProgress[q.id];
  }

  function renderDivisionQuestion(s,q){
    const progress=ensureDivisionState(q);
    const amount=Math.abs(q.dividend);
    const divisor=Math.abs(q.divisor);
    const sign=q.dividend<0?"negative":"positive";
    const symbol=q.dividend<0?"−1":"+1";
    const existing=state.answers[q.id]??"";
    const imagined=(q.id==="s3q9"||q.id==="s3q10")&&!progress.manualFichas;

    let activity="";
    if(amount===0){
      activity=`<div class="zero-division"><div class="empty-reserve">0 fichas</div><div class="division-vessels">${Array.from({length:divisor},(_,i)=>`<div class="division-vessel" data-vessel="${i}"><b>RECIPIENTE ${i+1}: 0 fichas</b></div>`).join("")}</div></div>`;
    }else if(imagined){
      activity=`<div class="imagined-distribution">
        <p><b>Este reparto usa demasiadas fichas para mostrarlas todas.</b></p>
        <p>Imagínalas repartidas en grupos iguales y utiliza el resultado.</p>
        <div class="imagined-count">${amount} fichas ${q.dividend<0?"negativas":"positivas"} → ${divisor} recipientes</div>
        <button type="button" class="text-button ficha-fallback" id="useDivisionFichas">Hacer este ejercicio con fichas</button>
      </div>`;
    }else{
      const reserve=progress.locations.map((location,i)=>location==="reserve"?`<button type="button" class="division-chip ${sign} ${progress.selected===i?"selected":""}" data-chip="${i}" aria-label="Ficha ${i+1} ${q.dividend<0?"negativa":"positiva"}">${symbol}</button>`:"").join("");
      const vesselHtml=Array.from({length:divisor},(_,i)=>{
        const inside=progress.locations.map((location,j)=>location===i?`<button type="button" class="division-chip ${sign} ${progress.selected===j?"selected":""}" data-chip="${j}" aria-label="Ficha ${j+1}">${symbol}</button>`:"").join("");
        return `<div class="division-vessel" data-vessel="${i}">
          <b>RECIPIENTE ${i+1}: <span data-count="${i}">${progress.locations.filter(v=>v===i).length} fichas</span></b>
          <div class="division-vessel-content">${inside}</div>
        </div>`;
      }).join("");
      activity=`<div class="division-workspace">
        <div class="division-reserve" id="divisionReserve" data-reserve="true">
          <b>ZONA DE RESERVA</b>
          <div class="division-reserve-content">${reserve||`<span class="reserve-empty">Sin fichas en reserva</span>`}</div>
        </div>
        <div class="division-vessels">${vesselHtml}</div>
      </div>`;
    }

    shell(`<section class="question-layout">
      <aside class="question-sidebar">
        <p>ESTACIÓN 3</p><h3>${s.title}</h3>
        <div class="question-dots">${s.questions.map((_,i)=>`<button class="${i===questionIndex?"active":""} ${state.answers[s.questions[i].id]!==undefined?"answered":""}" data-index="${i}" aria-label="Ejercicio ${i+1}">${i+1}</button>`).join("")}</div>
        <button class="text-button" id="backMap2">← Volver al mapa</button>
      </aside>
      <section class="question-main">
        <div class="question-label">EJERCICIO ${questionIndex+1} DE 10</div>
        <h2>${q.prompt}</h2>
        ${activity}
        ${progress.manualFichas&&(q.id==="s3q9"||q.id==="s3q10")?`<button type="button" class="text-button" id="returnDirectDivision">Volver al resultado directo sin fichas</button>`:""}
        ${imagined||amount===0?"":`<button class="secondary" id="returnSelected">Devolver la ficha seleccionada a la reserva</button>
        <button class="primary" id="checkDivision">COMPROBAR REPARTO</button>`}
        ${progress.checked?`<div class="feedback success"><b>¡Excelente! Has repartido las fichas en ${divisor} grupos iguales</b><span>${Math.abs(q.dividend)} : ${divisor} = ${q.answer>0?"+":""}${q.answer}</span></div>`:""}
        <form id="answerForm" class="answer-form single-answer">
          <label>Resultado<input name="answer" inputmode="decimal" autocomplete="off" value="${escapeHtml(existing)}" placeholder="Escribe el resultado"></label>
          <button type="button" id="hintBtn" class="secondary">Necesito una pista</button>
          <button type="submit" class="primary">COMPROBAR</button>
        </form>
        ${feedback?`<div class="feedback ${feedback.type}" role="status"><b>${feedback.title}</b><span>${feedback.text}</span></div>`:""}
        <div class="question-nav">
          <button class="text-button" id="prevQ" ${questionIndex===0?"disabled":""}>← Anterior</button>
          ${isQuestionCorrect(q)?`<button class="primary" id="nextQ">${questionIndex===9?"FINALIZAR ESTACIÓN":"SIGUIENTE"} →</button>`:""}
        </div>
      </section>
    </section>`);
    bindDivisionEvents(s,q);
  }

  function bindDivisionEvents(s,q){
    document.querySelectorAll("[data-index]").forEach(b=>b.onclick=()=>{questionIndex=Number(b.dataset.index);feedback=null;render();});
    document.getElementById("backMap2").onclick=()=>{view="map";render();};
    document.getElementById("prevQ").onclick=()=>{if(questionIndex>0){questionIndex--;feedback=null;render();}};
    const useDivisionFichas=document.getElementById("useDivisionFichas");
    if(useDivisionFichas)useDivisionFichas.onclick=()=>{
      progress.manualFichas=true;
      progress.locations=Array(amount).fill("reserve");
      progress.selected=null;
      progress.checked=false;
      feedback=null;
      saveGame();
      render();
    };
    const returnDirectDivision=document.getElementById("returnDirectDivision");
    if(returnDirectDivision)returnDirectDivision.onclick=()=>{
      progress.manualFichas=false;
      progress.locations=Array(amount).fill("reserve");
      progress.selected=null;
      progress.checked=false;
      saveGame();
      feedback=null;
      render();
    };
    const next=document.getElementById("nextQ");
    if(next)next.onclick=()=>{if(questionIndex<9){questionIndex++;feedback=null;render();}else completeStation();};

    const progress=ensureDivisionState(q);
    const amount=Math.abs(q.dividend);
    const divisor=Math.abs(q.divisor);
    const perVessel=amount/divisor;

    document.querySelectorAll("[data-chip]").forEach(chip=>{
      chip.onclick=e=>{
        const i=Number(chip.dataset.chip);
        progress.selected=progress.selected===i?null:i;
        saveGame();render();
      };
      chip.onpointerdown=e=>{
        if(e.pointerType==="mouse"&&e.button!==0)return;
        e.preventDefault();
        const i=Number(chip.dataset.chip);
        const rect=chip.getBoundingClientRect();
        chip.setPointerCapture(e.pointerId);
        const ghost=chip.cloneNode(true);
        ghost.className=chip.className+" division-chip-ghost";
        ghost.style.left=`${e.clientX-rect.width/2}px`;
        ghost.style.top=`${e.clientY-rect.height/2}px`;
        document.body.appendChild(ghost);
        chip.classList.add("drag-source");

        const move=event=>{
          ghost.style.left=`${event.clientX-rect.width/2}px`;
          ghost.style.top=`${event.clientY-rect.height/2}px`;
        };
        const up=event=>{
          chip.removeEventListener("pointermove",move);
          chip.removeEventListener("pointerup",up);
          chip.removeEventListener("pointercancel",up);
          ghost.remove();
          chip.classList.remove("drag-source");
          const vessel=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-vessel]");
          const reserve=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-reserve]");
          if(vessel){
            const destination=Number(vessel.dataset.vessel);
            const count=progress.locations.filter(v=>v===destination).length;
            if(count>=perVessel){
              feedback={type:"error",title:"RECIPIENTE COMPLETO",text:"Este recipiente ya está completo."};
              saveGame();render();return;
            }
            progress.locations[i]=destination;
            progress.checked=false;
            feedback={type:"success",title:"FICHA COLOCADA",text:"La ficha ha entrado en el recipiente."};
          }else if(reserve){
            progress.locations[i]="reserve";
          }else{
            feedback={type:"hint",title:"DESTINO NO VÁLIDO",text:"Coloca la ficha dentro de un recipiente o devuélvela a la reserva."};
          }
          saveGame();render();
        };
        chip.addEventListener("pointermove",move);
        chip.addEventListener("pointerup",up);
        chip.addEventListener("pointercancel",up);
      };
    });

    document.querySelectorAll("[data-vessel]").forEach(vessel=>{
      vessel.onclick=e=>{
        if(progress.selected===null||e.target.closest("[data-chip]"))return;
        const i=Number(vessel.dataset.vessel);
        const count=progress.locations.filter(v=>v===i).length;
        if(count>=perVessel){feedback={type:"error",title:"RECIPIENTE COMPLETO",text:"Este recipiente ya está completo."};saveGame();render();return;}
        progress.locations[progress.selected]=i;
        progress.selected=null;
        progress.checked=false;
        saveGame();render();
      };
    });
    const reserve=document.getElementById("divisionReserve");
    if(reserve)reserve.onclick=e=>{
      if(progress.selected!==null&&!e.target.closest("[data-chip]")){
        progress.locations[progress.selected]="reserve";progress.selected=null;saveGame();render();
      }
    };
    const returnSelected=document.getElementById("returnSelected");
    if(returnSelected)returnSelected.onclick=()=>{
      if(progress.selected===null){feedback={type:"hint",title:"SELECCIONA UNA FICHA",text:"Primero selecciona una ficha y después pulsa este botón."};saveGame();render();return;}
      progress.locations[progress.selected]="reserve";progress.selected=null;progress.checked=false;saveGame();render();
    };
    const check=document.getElementById("checkDivision");
    if(check)check.onclick=()=>{
      const counts=Array.from({length:divisor},(_,i)=>progress.locations.filter(v=>v===i).length);
      if(progress.locations.some(v=>v==="reserve")){
        feedback={type:"error",title:"TODAVÍA QUEDAN FICHAS",text:"Coloca todas las fichas en los recipientes antes de comprobar."};
      }else if(counts.some(n=>n!==perVessel)){
        feedback={type:"error",title:"LOS GRUPOS NO SON IGUALES",text:"Intenta repartir para que todos los recipientes tengan la misma cantidad."};
      }else{
        progress.checked=true;
      }
      saveGame();render();
    };

    document.getElementById("hintBtn").onclick=()=>{
      state.hints[q.id]=(state.hints[q.id]||0)+1;saveGame();
      feedback={type:"hint",title:"PISTA",text:q.hint};render();
    };
    document.getElementById("answerForm").onsubmit=e=>{
      e.preventDefault();
      const raw=String(new FormData(e.currentTarget).get("answer")||"").trim();
      if(!raw){feedback={type:"error",title:"FALTA UNA RESPUESTA",text:"Escribe el resultado."};render();return;}
      state.attempts[q.id]=(state.attempts[q.id]||0)+1;
      if(checkAnswer(q,raw)){
        state.answers[q.id]=raw;
        feedback={type:"success",title:"¡MUY BIEN!",text:successMessage(q)};
      }else{
        state.wrongAttempts[q.id]=(state.wrongAttempts[q.id]||0)+1;
        state.answers[q.id]=raw;
        feedback={type:"error",title:"AÚN NO ES CORRECTO",text:errorMessage(q,raw)};
      }
      saveGame();render();
    };
  }

  function ensureFichaState(q){
    const total=(q.positives||0)+(q.negatives||0);
    if(!state.fichaProgress[q.id]){
      state.fichaProgress[q.id]={phase:q.id==="s1q10"?"direct":"build",circles:Array(total).fill(0),selected:[],buildCorrect:false,cancelled:[],cancelCorrect:false};
      saveGame();
    }else if(q.id==="s1q10"&&!state.fichaProgress[q.id].usedFichas&&state.fichaProgress[q.id].phase!=="direct"){
      state.fichaProgress[q.id].phase="direct";
      saveGame();
    }
    return state.fichaProgress[q.id];
  }

  function renderFichaQuestion(s,q){
    const progress=ensureFichaState(q);
    const positive=progress.circles.filter(v=>v===1).length;
    const negative=progress.circles.filter(v=>v===-1).length;
    const pending=progress.circles.filter(v=>v===0).length;

    let phaseHtml="";
    if(progress.phase==="direct"){
      phaseHtml=`<div class="direct-result-phase">
        <p class="phase-instruction">Ahora puedes imaginar las fichas y calcular el resultado directamente.</p>
        <form id="answerForm" class="answer-form single-answer">
          <label>Resultado<input name="answer" inputmode="decimal" autocomplete="off" value="" placeholder="Escribe el resultado"></label>
          <button type="button" id="hintBtn" class="secondary">Necesito una pista</button>
          <button type="submit" class="primary">COMPROBAR</button>
        </form>
        <button class="text-button ficha-fallback" id="useFichas">Si lo necesitas, hacer el ejercicio con fichas</button>
      </div>`;
    }else if(progress.phase==="build"){
      const circles=progress.circles.map((value,i)=>{
        const cls=value===1?"positive":value===-1?"negative":"empty";
        const label=value===1?"+1":value===-1?"−1":"vacío";
        return `<button class="build-circle ${cls}" data-circle="${i}" aria-label="Círculo ${i+1}: ${label}">${value===0?"":value===1?"+1":"−1"}</button>`;
      }).join("");
      phaseHtml=`<div class="construction-phase">
        <p class="phase-instruction">Pulsa sobre cada círculo para colocar las fichas positivas y negativas que representa la operación.</p>
        <div class="build-board">${circles}</div>
        <div class="ficha-counters">
          <span>Fichas positivas: <b>${positive}</b></span>
          <span>Fichas negativas: <b>${negative}</b></span>
          <span>Círculos pendientes: <b>${pending}</b></span>
        </div>
        ${progress.buildCorrect
          ? `<div class="feedback success"><b>¡Perfecto! Has representado correctamente la operación</b></div><button class="primary" id="startCancel">CONTINUAR: CANCELAR FICHAS →</button>`
          : `<button class="primary" id="checkBuild">COMPROBAR FICHAS</button>`}
      </div>`;
    }else if(progress.phase==="cancel"){
      const remaining=progress.circles.map((value,i)=>({value,i})).filter(x=>!progress.cancelled.includes(x.i));
      const circles=remaining.map(({value,i})=>{
        const selected=progress.selected.includes(i);
        return `<button class="cancel-circle ${value===1?"positive":"negative"} ${selected?"selected":""}" data-cancel="${i}" aria-label="${value===1?"Ficha positiva":"Ficha negativa"}">${value===1?"+1":"−1"}</button>`;
      }).join("");
      phaseHtml=`<div class="cancellation-phase">
        <p class="phase-instruction">Una ficha positiva (+1) y una ficha negativa (−1) se anulan porque su suma es cero.</p>
        <p class="phase-instruction">Selecciona una ficha azul y una roja.</p>
        <div class="cancel-board">${circles}</div>
        ${progress.cancelFlash?'<div class="zero-flash" aria-live="polite">0</div>':""}
      </div>`;
    }else{
      const remaining=progress.circles.filter((v,i)=>!progress.cancelled.includes(i));
      const positiveRemaining=remaining.filter(v=>v===1).length;
      const negativeRemaining=remaining.filter(v=>v===-1).length;
      const circles=remaining.map(v=>`<span class="cancel-circle ${v===1?"positive":"negative"}">${v===1?"+1":"−1"}</span>`).join("");
      phaseHtml=`<div class="result-phase">
        <p class="phase-instruction">¿Cuál es el resultado de la operación?</p>
        <div class="remaining-fichas">${circles}</div>
        <p class="result-explanation">${negativeRemaining>0&&positiveRemaining===0?`Quedan ${negativeRemaining} ficha${negativeRemaining===1?"":"s"} negativa${negativeRemaining===1?"":"s"}.`:positiveRemaining>0&&negativeRemaining===0?`Quedan ${positiveRemaining} ficha${positiveRemaining===1?"":"s"} positiva${positiveRemaining===1?"":"s"}.`:"No quedan fichas: el resultado es cero."}</p>
        <form id="answerForm" class="answer-form single-answer">
          <label>Resultado<input name="answer" inputmode="decimal" autocomplete="off" value="" placeholder="Escribe el resultado"></label>
          <button type="button" id="hintBtn" class="secondary">Necesito una pista</button>
          <button type="submit" class="primary">COMPROBAR</button>
        </form>
      </div>`;
    }

    shell(`<section class="question-layout">
      <aside class="question-sidebar">
        <p>ESTACIÓN 1</p><h3>${s.title}</h3>
        <div class="question-dots">${s.questions.map((_,i)=>`<button class="${i===questionIndex?"active":""} ${state.answers[s.questions[i].id]!==undefined?"answered":""}" data-index="${i}" aria-label="Ejercicio ${i+1}">${i+1}</button>`).join("")}</div>
        <button class="text-button" id="backMap2">← Volver al mapa</button>
      </aside>
      <section class="question-main">
        <div class="question-label">EJERCICIO ${questionIndex+1} DE 10</div>
        <h2>${q.prompt}</h2>
        ${phaseHtml}
        ${feedback?`<div class="feedback ${feedback.type}" role="status"><b>${feedback.title}</b><span>${feedback.text}</span></div>`:""}
        <div class="question-nav">
          <button class="text-button" id="prevQ" ${questionIndex===0?"disabled":""}>← Anterior</button>
          ${isQuestionCorrect(q)?`<button class="primary" id="nextQ">${questionIndex===9?"FINALIZAR ESTACIÓN":"SIGUIENTE"} →</button>`:""}
        </div>
      </section>
    </section>`);
    bindFichaEvents(s,q);
  }

  function bindFichaEvents(s,q){
    document.querySelectorAll("[data-index]").forEach(b=>b.onclick=()=>{questionIndex=Number(b.dataset.index);feedback=null;render();});
    document.getElementById("backMap2").onclick=()=>{view="map";render();};
    document.getElementById("prevQ").onclick=()=>{if(questionIndex>0){questionIndex--;feedback=null;render();}};
    const useFichas=document.getElementById("useFichas");
    if(useFichas)useFichas.onclick=()=>{
      const progress=ensureFichaState(q);
      progress.phase="build";
      progress.usedFichas=true;
      progress.buildCorrect=false;
      progress.cancelled=[];
      progress.selected=[];
      progress.circles=Array((q.positives||0)+(q.negatives||0)).fill(0);
      feedback=null;
      saveGame();
      render();
    };
    const next=document.getElementById("nextQ");
    if(next)next.onclick=()=>{if(questionIndex<9){questionIndex++;feedback=null;render();}else completeStation();};
    const progress=ensureFichaState(q);
    document.querySelectorAll("[data-circle]").forEach(button=>{
      button.onclick=()=>{
        const i=Number(button.dataset.circle);
        progress.circles[i]=progress.circles[i]===0?1:progress.circles[i]===1?-1:0;
        progress.buildCorrect=false;
        saveGame();render();
      };
    });
    const checkBuild=document.getElementById("checkBuild");
    if(checkBuild)checkBuild.onclick=()=>{
      const positive=progress.circles.filter(v=>v===1).length;
      const negative=progress.circles.filter(v=>v===-1).length;
      const pending=progress.circles.filter(v=>v===0).length;
      if(pending===0&&positive===q.positives&&negative===q.negatives){
        progress.buildCorrect=true;
        state.fichaProgress[q.id].buildCorrect=true;
        state.fichaProgress[q.id].builtCorrect=true;
        feedback={type:"success",title:"CONSTRUCCIÓN CORRECTA",text:"¡Perfecto! Has representado correctamente la operación"};
      }else{
        const positiveText=positive<q.positives?`faltan ${q.positives-positive} positivas`:positive>q.positives?`sobran ${positive-q.positives} positivas`:"";
        const negativeText=negative<q.negatives?`faltan ${q.negatives-negative} negativas`:negative>q.negatives?`sobran ${negative-q.negatives} negativas`:"";
        feedback={type:"error",title:"REPRESENTACIÓN INCOMPLETA",text:[positiveText,negativeText,pending?`hay ${pending} círculo${pending===1?"":"s"} vacío${pending===1?"":"s"}`:""].filter(Boolean).join(". ")+"."};
      }
      saveGame();render();
    };
    const startCancel=document.getElementById("startCancel");
    if(startCancel)startCancel.onclick=()=>{
      progress.phase="cancel";progress.cancelled=[];progress.selected=[];feedback=null;
      const hasPositive=progress.circles.includes(1),hasNegative=progress.circles.includes(-1);
      if(!hasPositive||!hasNegative){
        progress.phase="result";
        progress.cancelCorrect=true;
        state.fichaProgress[q.id].cancelCorrect=true;
      }
      saveGame();render();
    };

    document.querySelectorAll("[data-cancel]").forEach(button=>{
      button.onclick=()=>{
        const i=Number(button.dataset.cancel);
        if(progress.selected.includes(i))return;
        const selected=progress.selected;
        if(selected.length===0){
          selected.push(i);saveGame();render();return;
        }
        const first=selected[0];
        if(progress.circles[first]===progress.circles[i]){
          progress.selected=[];feedback={type:"error",title:"NO FORMAN UNA PAREJA",text:"Las fichas deben tener signos contrarios: una azul (+1) y otra roja (−1)."};saveGame();render();return;
        }
        progress.selected=[first,i];progress.cancelFlash=true;
        feedback={type:"success",title:"¡CERO!",text:"Una ficha positiva y una negativa se anulan."};
        saveGame();
        setTimeout(()=>{
          progress.cancelled.push(first,i);progress.selected=[];progress.cancelFlash=false;
          const remaining=progress.circles.map((v,index)=>({v,index})).filter(x=>!progress.cancelled.includes(x.index));
          const hasPositive=remaining.some(x=>x.v===1),hasNegative=remaining.some(x=>x.v===-1);
          if(!hasPositive||!hasNegative){progress.phase="result";progress.cancelCorrect=true;state.fichaProgress[q.id].cancelCorrect=true;}
          saveGame();render();
        },650);
      };
    });

    const hint=document.getElementById("hintBtn");
    if(hint)hint.onclick=()=>{
      state.hints[q.id]=(state.hints[q.id]||0)+1;saveGame();
      const remaining=progress.circles.filter((v,i)=>!progress.cancelled.includes(i));
      const pos=remaining.filter(v=>v===1).length,neg=remaining.filter(v=>v===-1).length;
      feedback={type:"hint",title:"PISTA",text:pos===0&&neg>0?`Han quedado ${neg} fichas negativas. El resultado será negativo.`:neg===0&&pos>0?`Han quedado ${pos} fichas positivas. El resultado será positivo.`:`Cuenta las fichas que han quedado después de cancelar.`};
      render();
    };
    const answerForm=document.getElementById("answerForm");
    if(answerForm)answerForm.onsubmit=e=>{
      e.preventDefault();const raw=String(new FormData(e.currentTarget).get("answer")||"").trim();
      if(!raw){feedback={type:"error",title:"FALTA UNA RESPUESTA",text:"Escribe el resultado."};render();return;}
      state.attempts[q.id]=(state.attempts[q.id]||0)+1;
      if(checkAnswer(q,raw)){state.answers[q.id]=raw;feedback={type:"success",title:"¡MUY BIEN!",text:"Resultado correcto. Las fichas que quedaron explican la respuesta."};}
      else{state.wrongAttempts[q.id]=(state.wrongAttempts[q.id]||0)+1;state.answers[q.id]=raw;feedback={type:"error",title:"AÚN NO ES CORRECTO",text:errorMessage(q,raw)};}
      saveGame();render();
    };
  }

  function ensureTemperatureState(q){
    if(!state.temperatureProgress[q.id]){
      state.temperatureProgress[q.id]={first:null,second:null,active:"first"};
      saveGame();
    }
    return state.temperatureProgress[q.id];
  }

  function temperatureRange(q){
    if(q.visual==="temperatures"){
      return {low:-12,high:12};
    }
    const values=(q.temps||[]).concat([0]);
    const lowValue=Math.min(...values),highValue=Math.max(...values);
    if(lowValue>=-10&&highValue<=10)return {low:-12,high:12};
    return {low:Math.floor(lowValue/5)*5-3,high:Math.ceil(highValue/5)*5+3};
  }

  function formatTemperature(value){
    if(value===null)return "Sin marcar";
    return `${value>0?"+":""}${value} °C`;
  }

  function renderTemperatureQuestion(s,q){
    const progress=ensureTemperatureState(q);
    const range=temperatureRange(q);
    const scale=Array.from({length:range.high-range.low+1},(_,i)=>range.high-i);
    const temperatureBottom=value=>18+((value-range.low)/(range.high-range.low))*484;
    const ticks=scale.map(v=>`<button type="button" class="temperature-tick ${v===0?"zero":""} ${v%5===0?"major":""}" data-temperature="${v}" aria-label="${v} grados Celsius" style="bottom:${temperatureBottom(v)}px"><span>${v>0?"+":""}${v}</span></button>`).join("");
    const firstPos=progress.first===null?null:temperatureBottom(progress.first);
    const secondPos=progress.second===null?null:temperatureBottom(progress.second);
    const lowMark=progress.first!==null&&progress.second!==null?Math.min(firstPos,secondPos):null;
    const highMark=progress.first!==null&&progress.second!==null?Math.max(firstPos,secondPos):null;
    const distance=progress.first!==null&&progress.second!==null?Math.abs(progress.second-progress.first):null;

    shell(`<section class="question-layout">
      <aside class="question-sidebar">
        <p>ESTACIÓN 2</p><h3>${s.title}</h3>
        <div class="question-dots">${s.questions.map((_,i)=>`<button class="${i===questionIndex?"active":""} ${state.answers[s.questions[i].id]!==undefined?"answered":""}" data-index="${i}" aria-label="Ejercicio ${i+1}">${i+1}</button>`).join("")}</div>
        <button class="text-button" id="backMap2">← Volver al mapa</button>
      </aside>
      <section class="question-main temperature-question">
        <div class="question-label">EJERCICIO ${questionIndex+1} DE 10</div>
        <h2>${q.prompt}</h2>
        <div class="temperature-instructions">Pulsa sobre la graduación para seleccionar las temperaturas.</div>
        <div class="temperature-workspace">
          <div class="temperature-controls">
            <button type="button" id="selectFirst" class="temperature-value first ${progress.active==="first"?"active":""}"><span>PRIMERA TEMPERATURA</span><b>${formatTemperature(progress.first)}</b></button>
            <button type="button" id="selectSecond" class="temperature-value second ${progress.active==="second"?"active":""}"><span>SEGUNDA TEMPERATURA</span><b>${formatTemperature(progress.second)}</b></button>
          </div>
          <div class="interactive-thermometer" id="thermometer" role="group" aria-label="Termómetro graduado">
            ${lowMark!==null?`<div class="temperature-range" style="bottom:${lowMark}px;height:${highMark-lowMark}px"></div>`:""}
            <div class="thermometer-track"></div>
            ${ticks}
            ${progress.first!==null?`<button type="button" class="temperature-marker first-marker" data-marker="first" style="bottom:${firstPos}px" aria-label="Primera temperatura ${formatTemperature(progress.first)}">●</button>`:""}
            ${progress.second!==null?`<button type="button" class="temperature-marker second-marker" data-marker="second" style="bottom:${secondPos}px" aria-label="Segunda temperatura ${formatTemperature(progress.second)}">●</button>`:""}
          </div>
        </div>
        <form id="answerForm" class="answer-form single-answer">
          <label>Resultado<input name="answer" inputmode="decimal" autocomplete="off" value="" placeholder="Escribe la diferencia"></label>
          <button type="button" id="hintBtn" class="secondary">Necesito una pista</button>
          <button type="submit" class="primary">COMPROBAR</button>
        </form>
        ${feedback?`<div class="feedback ${feedback.type}" role="status"><b>${feedback.title}</b><span>${feedback.text}</span></div>`:""}
        <div class="question-nav">
          <button class="text-button" id="prevQ" ${questionIndex===0?"disabled":""}>← Anterior</button>
          ${isQuestionCorrect(q)?`<button class="primary" id="nextQ">${questionIndex===9?"FINALIZAR ESTACIÓN":"SIGUIENTE"} →</button>`:""}
        </div>
      </section>
    </section>`);
    bindTemperatureEvents(s,q,range);
  }

  function bindTemperatureEvents(s,q,range){
    document.querySelectorAll("[data-index]").forEach(b=>b.onclick=()=>{questionIndex=Number(b.dataset.index);feedback=null;render();});
    document.getElementById("backMap2").onclick=()=>{view="map";render();};
    document.getElementById("prevQ").onclick=()=>{if(questionIndex>0){questionIndex--;feedback=null;render();}};
    const next=document.getElementById("nextQ");
    if(next)next.onclick=()=>{if(questionIndex<9){questionIndex++;feedback=null;render();}else completeStation();};

    const progress=ensureTemperatureState(q);
    document.getElementById("selectFirst").onclick=()=>{progress.active="first";saveGame();render();};
    document.getElementById("selectSecond").onclick=()=>{progress.active="second";saveGame();render();};

    function setTemperature(value){
      progress[progress.active]=value;
      if(progress.active==="first"&&progress.second===null)progress.active="second";
      else if(progress.active==="second")progress.active="first";
      saveGame();
      feedback=null;
      render();
    }

    document.querySelectorAll("[data-temperature]").forEach(tick=>{
      tick.onclick=()=>setTemperature(Number(tick.dataset.temperature));
    });

    document.querySelectorAll("[data-marker]").forEach(marker=>{
      marker.onpointerdown=e=>{
        e.preventDefault();
        const kind=marker.dataset.marker;
        progress.active=kind;
        const thermometer=document.getElementById("thermometer");
        const rect=thermometer.getBoundingClientRect();
        marker.setPointerCapture(e.pointerId);
        const move=event=>{
          const y=event.clientY-rect.top;
          const ratio=Math.max(0,Math.min(1,1-(y/rect.height)));
          const value=Math.round(range.low+(range.high-range.low)*ratio);
          progress[kind]=value;
          saveGame();
          renderTemperatureVisualOnly(progress,range);
        };
        const up=event=>{
          marker.removeEventListener("pointermove",move);
          marker.removeEventListener("pointerup",up);
          marker.removeEventListener("pointercancel",up);
          render();
        };
        marker.addEventListener("pointermove",move);
        marker.addEventListener("pointerup",up);
        marker.addEventListener("pointercancel",up);
      };
    });

    document.getElementById("hintBtn").onclick=()=>{
      state.hints[q.id]=(state.hints[q.id]||0)+1;saveGame();
      feedback={type:"hint",title:"PISTA",text:q.hint};render();
    };

    document.getElementById("answerForm").onsubmit=e=>{
      e.preventDefault();
      const raw=String(new FormData(e.currentTarget).get("answer")||"").trim();
      if(progress.first===null||progress.second===null){
        feedback={type:"error",title:"MARCA LAS DOS TEMPERATURAS",text:"Selecciona la primera y la segunda temperatura sobre el termómetro."};
        render();return;
      }
      state.attempts[q.id]=(state.attempts[q.id]||0)+1;
      if(q.visual==="temperature"){
        const morning=q.temps[0], afternoon=q.temps[1];
        if(progress.first!==morning||progress.second!==afternoon){
          feedback={type:"error",title:"REVISA LOS MARCADORES",text:"Revisa el enunciado. ¿Qué temperatura hacía por la mañana y cuál por la tarde?"};
          saveGame();render();return;
        }
      }
      const distance=Math.abs(progress.second-progress.first);
      const n=parseNumber(raw);
      if(q.answer==="temperatures23"){
        if(distance!==23){
          feedback={type:"error",title:"AÚN NO HAY 23 GRADOS",text:"Mueve los dos marcadores hasta que la distancia sea exactamente 23 grados."};
        }else{
          state.answers[q.id]=`${progress.first};${progress.second}`;
          feedback={type:"success",title:"¡EXCELENTE!",text:"Has inventado una pareja de temperaturas cuya diferencia es 23 °C."};
        }
      }else if(n!==null&&n===q.answer&&distance===q.answer){
        state.answers[q.id]=raw;
        feedback={type:"success",title:"¡MUY BIEN!",text:"Has localizado las temperaturas y contado correctamente la diferencia."};
      }else if(n!==null&&n!==q.answer&&distance===q.answer){
        feedback={type:"error",title:"BIEN LOCALIZADAS",text:"¡Bien! Has localizado las dos temperaturas. Ahora cuenta los grados que hay entre ambas."};
      }else{
        feedback={type:"error",title:"CUENTA LA DISTANCIA",text:"Revisa los grados comprendidos entre ambos marcadores."};
      }
      saveGame();render();
    };
  }

  function renderTemperatureVisualOnly(progress,range){
    const temperatureBottom=value=>18+((value-range.low)/(range.high-range.low))*484;
    const firstPos=progress.first===null?null:temperatureBottom(progress.first);
    const secondPos=progress.second===null?null:temperatureBottom(progress.second);
    document.querySelectorAll(".temperature-marker").forEach(marker=>{
      const value=progress[marker.dataset.marker];
      marker.style.bottom=`${temperatureBottom(value)}px`;
      marker.setAttribute("aria-label",`${marker.dataset.marker==="first"?"Primera":"Segunda"} temperatura ${formatTemperature(value)}`);
    });
    const buttons=document.querySelectorAll(".temperature-value");
    if(buttons[0])buttons[0].querySelector("b").textContent=formatTemperature(progress.first);
    if(buttons[1])buttons[1].querySelector("b").textContent=formatTemperature(progress.second);
    let rangeEl=document.querySelector(".temperature-range");
    if(progress.first!==null&&progress.second!==null){
      if(!rangeEl){
        rangeEl=document.createElement("div");
        rangeEl.className="temperature-range";
        document.getElementById("thermometer").prepend(rangeEl);
      }
      rangeEl.style.bottom=`${Math.min(firstPos,secondPos)}px`;
      rangeEl.style.height=`${Math.max(firstPos,secondPos)-Math.min(firstPos,secondPos)}px`;
    }
  }

  function bindQuestionEvents(s,q) {
    document.querySelectorAll("[data-index]").forEach(b=>b.onclick=()=>{questionIndex=Number(b.dataset.index);feedback=null;render();});
    document.getElementById("backMap2").onclick=()=>{view="map";render();};
    document.getElementById("prevQ").onclick=()=>{if(questionIndex>0){questionIndex--;feedback=null;render();}};
    const next=document.getElementById("nextQ");
    if(next) next.onclick=()=>{
      if(questionIndex<9){questionIndex++;feedback=null;render();}
      else completeStation();
    };
    document.getElementById("hintBtn").onclick=()=>{
      state.hints[q.id]=(state.hints[q.id]||0)+1;saveGame();
      feedback={type:"hint",title:"PISTA",text:q.hint};render();
    };
    document.getElementById("answerForm").onsubmit=e=>{
      e.preventDefault(); const form=new FormData(e.currentTarget);
      let raw;
      if(q.visual==="temperatures") raw=form.get("temperature1")+";"+form.get("temperature2");
      else raw=String(form.get("answer")||"").trim();
      if(!raw || raw===";"){feedback={type:"error",title:"FALTA UNA RESPUESTA",text:"Escribe tu resultado antes de comprobar."};render();return;}
      state.attempts[q.id]=(state.attempts[q.id]||0)+1;
      const correct=checkAnswer(q,raw);
      if(correct){
        state.answers[q.id]=raw;saveGame();
        feedback={type:"success",title:"¡MUY BIEN!",text:successMessage(q)};
      }else{
        state.wrongAttempts[q.id]=(state.wrongAttempts[q.id]||0)+1;
        state.answers[q.id]=raw;saveGame();
        feedback={type:"error",title:"AÚN NO ES CORRECTO",text:errorMessage(q,raw)};
      }
      render();
    };
    const pair=document.getElementById("pairBtn");
    if(pair) pair.onclick=()=>{
      const positive=document.querySelector(".ficha-board .ficha.positive:not(.pair)");
      const negative=document.querySelector(".ficha-board .ficha.negative:not(.pair)");
      if(!positive || !negative){
        feedback={type:"hint",title:"YA NO HAY MÁS PAREJAS",text:"Las fichas que quedan tienen todas el mismo signo y forman el resultado."};
        render();
        return;
      }
      positive.classList.add("pair");
      negative.classList.add("pair");
      feedback={type:"hint",title:"UNA PAREJA = CERO",text:"Una ficha azul (+1) y una roja (-1) se cancelan entre sí."};
      setTimeout(()=>{
        positive.remove();
        negative.remove();
        render();
      },650);
    };
  }

  function renderVisual(q) {
    if(q.visual==="fichas"){
      const pos=Array.from({length:q.positives||0},()=>'<span class="ficha positive" aria-label="Ficha positiva">+1</span>').join("");
      const neg=Array.from({length:q.negatives||0},()=>'<span class="ficha negative" aria-label="Ficha negativa">−1</span>').join("");
      return `<div class="pair-instructions"><b>Azul: positivo (+)</b><span>Una pareja azul-roja vale cero.</span><b>Roja: negativo (−)</b></div>
        <div class="ficha-board" aria-label="Representacion con fichas positivas y negativas">${pos}${neg}</div>
        <p class="pair-help">Pulsa <b>Emparejar una pareja</b> para cancelar una ficha azul con una roja. Repite hasta que no queden parejas.</p>`;
    }
    if(q.visual==="temperature"){
      const low=Math.min(...(q.temps||[0,10]),-10)-2, high=Math.max(...(q.temps||[0,10]),10)+2;
      const markers=(q.temps||[]).map((t,i)=>`<span class="temp-marker m${i+1}" style="bottom:${((t-low)/(high-low))*100}%">${t}°C</span>`).join("");
      return `<div class="thermo-wrap"><div class="thermometer"><i></i>${markers}</div><div class="thermo-scale"><span>${high}°</span><span>0°</span><span>${low}°</span></div></div>`;
    }
    if(q.visual==="temperatures") return `<div class="thermo-example">🌡️ Imagina ambas temperaturas sobre el termómetro.</div>`;
    if(q.visual==="jump") return `<div class="jump-visual"><div class="plane">✈</div><div class="sky">100 m</div><div class="sea">~~~<br><b>PEPE</b><br>−50 m</div></div>`;
    if(q.visual==="expression") return `<div class="equation-visual">¿Qué operación cumple?<br><b>[ operación ] = +3</b></div>`;
    return "";
  }

  function completeStation() {
    const s=data.stations[stationIndex];
    if(!stationComplete(s.id)){
      feedback={type:"error",title:"ESTACIÓN INCOMPLETA",text:"Todavía quedan ejercicios por responder correctamente."};render();return;
    }
    if(s.id===state.stationUnlocked) state.stationUnlocked=Math.min(s.id+1,4);
    saveGame();
    shell(`<section class="stamp-screen success-pop">
      <p class="eyebrow">ESTACIÓN COMPLETADA</p><h1>¡SELLO CONSEGUIDO!</h1>
      <div class="big-stamp">0${s.id}<span>SELLADO</span></div>
      <p>${stationScore(s.id)}/10 ejercicios correctos</p>
      <button class="primary big" id="continueMap">CONTINUAR EL VIAJE →</button>
    </section>`);
    document.getElementById("continueMap").onclick=()=>{feedback=null;view="map";render();};
  }

  function renderFinalIntro(){
    shell(`<section class="final-intro">
      <p class="eyebrow">LOS TRES SELLOS ESTÁN CONTIGO</p><h1>RETO FINAL</h1>
      <div class="three-stamps">${[1,2,3].map(n=>`<span>0${n}</span>`).join("")}</div>
      <p>La gran misión matemática te está esperando.</p>
      <button class="primary big" id="startFinal">ABRIR EL RETO FINAL →</button>
    </section>`);
    document.getElementById("startFinal").onclick=()=>{questionIndex=0;feedback=null;view="finalQuestion";render();};
  }

  function renderFinalQuestion(){
    const q=data.finalQuestions[questionIndex];
    const existing=state.answers[q.id]??"";
    shell(`<section class="question-layout final-layout">
      <aside class="question-sidebar"><p>RETO FINAL</p><h3>LA GRAN MISIÓN</h3><div class="question-dots">${data.finalQuestions.map((_,i)=>`<button class="${i===questionIndex?"active":""}" data-final="${i}">${i+1}</button>`).join("")}</div></aside>
      <section class="question-main"><div class="question-label">PRUEBA ${questionIndex+1} DE 3</div><h2>${q.prompt}</h2>
        <form id="finalAnswerForm" class="answer-form"><label>Resultado<input name="answer" value="${escapeHtml(existing)}" autocomplete="off"></label>
          <button type="button" id="finalHint" class="secondary">Necesito una pista</button><button type="submit" class="primary">COMPROBAR</button>
        </form>${feedback?`<div class="feedback ${feedback.type}"><b>${feedback.title}</b><span>${feedback.text}</span></div>`:""}
        <div class="question-nav"><button class="text-button" id="prevFinal" ${questionIndex===0?"disabled":""}>← Anterior</button>${isQuestionCorrect(q)?`<button class="primary" id="nextFinal">${questionIndex===2?"TERMINAR MISIÓN":"SIGUIENTE"} →</button>`:""}</div>
      </section>
    </section>`);
    document.querySelectorAll("[data-final]").forEach(b=>b.onclick=()=>{questionIndex=Number(b.dataset.final);feedback=null;render();});
    document.getElementById("prevFinal").onclick=()=>{if(questionIndex>0){questionIndex--;feedback=null;render();}};
    document.getElementById("finalHint").onclick=()=>{state.hints[q.id]=(state.hints[q.id]||0)+1;saveGame();feedback={type:"hint",title:"PISTA",text:q.hint};render();};
    document.getElementById("finalAnswerForm").onsubmit=e=>{
      e.preventDefault(); const raw=String(new FormData(e.currentTarget).get("answer")||"").trim();
      if(!raw){feedback={type:"error",title:"FALTA UNA RESPUESTA",text:"Escribe tu resultado."};render();return;}
      state.attempts[q.id]=(state.attempts[q.id]||0)+1;
      if(checkAnswer(q,raw)){state.answers[q.id]=raw;feedback={type:"success",title:"¡PRUEBA SUPERADA!",text:successMessage(q)};}
      else{state.wrongAttempts[q.id]=(state.wrongAttempts[q.id]||0)+1;state.answers[q.id]=raw;feedback={type:"error",title:"AÚN NO ES CORRECTO",text:errorMessage(q,raw)};}
      saveGame();render();
    };
    const next=document.getElementById("nextFinal");
    if(next) next.onclick=()=>{
      if(questionIndex<2){questionIndex++;feedback=null;render();}
      else if(data.finalQuestions.every(isQuestionCorrect)){finishGame();}else{feedback={type:"error",title:"MISIÓN INCOMPLETA",text:"Revisa las tres pruebas antes de finalizar."};render();}
    };
  }

  function finishGame(){
    state.finishedAt=Date.now();
    state.elapsedSeconds=Math.max(0,Math.round((state.finishedAt-state.startedAt)/1000));
    state.completed=true;saveGame();
    const records=getRecords();
    const record=makeRecord();
    const old=records.findIndex(r=>r.id===record.id);
    if(old>=0)records[old]=record;else records.push(record);
    saveRecords(records);
    view="finalCelebration";render();
  }

  function renderFinalCelebration(){
    shell(`<section class="stamp-screen celebration">
      <div class="confetti">✦ ✧ ★ ✦ ✧ ★</div><p class="eyebrow">MISIÓN COMPLETADA</p><h1>PASAPORTE COMPLETO</h1>
      <div class="three-stamps">${[1,2,3].map(n=>`<span>0${n}</span>`).join("")}</div>
      <p>Has completado las cuatro fases de la aventura.</p>
      <button class="primary big" id="showReport">VER MI INFORME →</button>
    </section>`);
    document.getElementById("showReport").onclick=()=>{view="report";render();};
  }

  function parseExpression(text) {
    text=String(text).replace(/x/g,"*").replace(/[−–]/g,"-").replace(/\s/g,"");
    if(!/^[0-9+\-*\/().]+$/.test(text)) return null;
    let i=0;
    function number(){let sign=1;if(text[i]==="+"){i++;}else if(text[i]==="-"){sign=-1;i++;}if(text[i]==="("){i++;const v=expression();if(text[i]!==")")return null;i++;return sign*v;}let start=i;while(i<text.length&&/[0-9.]/.test(text[i]))i++;if(start===i)return null;return sign*Number(text.slice(start,i));}
    function factor(){let v=number();if(v===null)return null;while(text[i]==="*"||text[i]==="/"){const op=text[i++];const b=number();if(b===null)return null;v=op==="*" ? v*b : v/b;}return v;}
    function expression(){let v=factor();if(v===null)return null;while(text[i]==="+"||text[i]==="-"){const op=text[i++];const b=factor();if(b===null)return null;v=op==="+"?v+b:v-b;}return v;}
    const value=expression();return i===text.length&&Number.isFinite(value)?value:null;
  }

  function parseNumber(text){
    const normalized=String(text).trim().replace(/,/g,".").replace(/[−–]/g,"-").replace(/°\s*[Cc]?/g,"");
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
    const n=Number(normalized);return Number.isFinite(n)?n:null;
  }

  function checkAnswer(q,raw){
    if(q.answer==="expression3"){
      return parseExpression(raw)!==null && parseExpression(raw)===3;
    }
    if(q.answer==="temperatures23"){
      const parts=String(raw).split(/[;,]/).map(parseNumber);
      return parts.length===2&&parts.every(n=>n!==null)&&Math.abs(parts[0]-parts[1])===23;
    }
    if(typeof q.answer==="number"){
      const n=parseNumber(raw); return n!==null&&n===q.answer;
    }
    return false;
  }

  function isQuestionCorrect(q){return state.answers[q.id]!==undefined&&checkAnswer(q,state.answers[q.id]);}

  function stationComplete(id){
    const s=data.stations.find(x=>x.id===id);
    return s.questions.every(isQuestionCorrect);
  }

  function stationScore(id){
    const s=data.stations.find(x=>x.id===id);
    return s.questions.filter(isQuestionCorrect).length;
  }

  function finalScore(){return data.finalQuestions.filter(isQuestionCorrect).length;}
  function correctCount(){return data.stations.reduce((n,s)=>n+stationScore(s.id),finalScore());}

  function successMessage(q){
    const list=["¡Excelente razonamiento!","Correcto: tu respuesta mantiene la pista matemática.","¡Bien hecho! Ese cálculo está resuelto.","¡Muy bien! Continúa con la misma estrategia."];
    return list[Math.abs(hash(q.id))%list.length];
  }
  function hash(s){let n=0;for(let i=0;i<s.length;i++)n=(n*31+s.charCodeAt(i))|0;return n;}

  function errorMessage(q,raw){
    if(q.visual==="temperature"||q.visual==="jump"||q.answer==="temperatures23"){
      return "Recuerda que una diferencia es una distancia. No señales el número mayor o menor: calcula los grados que hay entre ambos.";
    }
    if(q.visual==="division"){
      return "En la división fíjate primero en los signos: signos iguales dan positivo y signos diferentes dan negativo.";
    }
    if(q.answer==="expression3"){
      return "Comprueba tu operación sustituyendo paso a paso. Debes obtener exactamente el número 3.";
    }
    return "Revisa el signo y vuelve a seguir el desplazamiento paso a paso. Antes de continuar, intenta contar las fichas o unidades.";
  }

  function explanationFor(q){
    if(q.answer==="expression3")return "Una operación válida puede ser 5 - 2 = 3, 1 + 2 = 3 o cualquier expresión diferente que tenga exactamente 3 como resultado.";
    if(q.answer==="temperatures23")return "Dos temperaturas tienen diferencia 23 cuando sus valores están a una distancia absoluta de 23 grados.";
    if(q.answer==="temperatures23")return "Dos temperaturas tienen diferencia 23 cuando están separadas exactamente 23 grados.";
    if(q.visual==="temperature"){
      const [a,b]=q.temps||[];return `La distancia entre ${a} °C y ${b} °C es ${Math.abs(a-b)} °C.`;
    }
    if(q.visual==="division"){
      const d=q.dividend, v=q.divisor;
      if(d<0&&v<0||d>=0&&v>0)return `Los signos son iguales, por eso el cociente es positivo. ${d} dividido entre ${v} es ${q.answer}.`;
      return `Los signos son diferentes, por eso el cociente es negativo. ${d} dividido entre ${v} es ${q.answer}.`;
    }
    return `El procedimiento correcto conduce al resultado ${q.answer}.`;
  }

  function getRecords(){try{return JSON.parse(localStorage.getItem(RECORDS_KEY))||[];}catch(_){return[];}}
  function saveRecords(records){localStorage.setItem(RECORDS_KEY,JSON.stringify(records));}

  function makeRecord(){
    return {
      id: state.finishedAt ? String(state.startedAt)+"-"+String(state.finishedAt):String(Date.now()),
      student:{...state.student},finishedAt:state.finishedAt||Date.now(),elapsedSeconds:state.elapsedSeconds,
      points:correctCount(),grade:(correctCount()/33*10).toFixed(2),percentage:Math.round(correctCount()/33*100),
      stationResults:[1,2,3].map(id=>({station:id,correct:stationScore(id),errors:10-stationScore(id)})),
      finalResult:{correct:finalScore(),errors:3-finalScore()},
      answers:{...state.answers},attempts:{...state.attempts},hints:{...state.hints},wrongAttempts:{...state.wrongAttempts},
      fichaProgress:{...state.fichaProgress},
      temperatureProgress:{...state.temperatureProgress},
      divisionProgress:{...state.divisionProgress}
    };
  }

  function renderReport(){
    const record=makeRecord();
    shell(`<section class="report-screen" id="printReport">${window.PASAPORTE_REPORT.render(record,state)}</section>`);
  }

  function renderCredits(){
    shell(`<section class="credits-screen"><p class="eyebrow">CRÉDITOS</p><div class="passport-seal">PASAPORTE</div>
      <h2>Esta actividad interactiva ha sido realizada por Rafael Arrebola y Sergio Jodral, profesores de Matemáticas, utilizando tecnología de Inteligencia Artificial (IA) como herramienta de apoyo al diseño y desarrollo educativo</h2>
      <h1>PASAPORTE: NÚMEROS ENTEROS</h1><p>Una aventura matemática para aprender jugando.</p>
      <button class="primary" id="reportFromCredits">VOLVER AL INFORME</button>
    </section>`);
    document.getElementById("reportFromCredits").onclick=()=>{view="report";render();};
  }

  function formatTime(seconds){const s=Number(seconds)||0;const m=Math.floor(s/60),r=s%60;return `${m}:${String(r).padStart(2,"0")}`;}

  window.addEventListener("beforeunload",e=>{
    if(state.student.name&&!state.completed){e.preventDefault();e.returnValue=""; }
  });
  app.addEventListener("showCredits",()=>{view="credits";render();});

  render();
})();
