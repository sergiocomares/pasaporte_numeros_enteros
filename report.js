(function(){
  "use strict";

  const data=window.PASAPORTE_DATA;

  function parseExpression(text){
    text=String(text).replace(/x/g,"*").replace(/[−–]/g,"-").replace(/\s/g,"");
    if(!/^[0-9+\-*\/().]+$/.test(text))return null;
    let i=0;
    function number(){let sign=1;if(text[i]==="+"){i++;}else if(text[i]==="-"){sign=-1;i++;}if(text[i]==="("){i++;const v=expression();if(text[i]!==")")return null;i++;return sign*v;}const start=i;while(i<text.length&&/[0-9.]/.test(text[i]))i++;if(start===i)return null;return sign*Number(text.slice(start,i));}
    function factor(){let v=number();if(v===null)return null;while(text[i]==="*"||text[i]==="/"){const op=text[i++],b=number();if(b===null)return null;v=op==="*"?v*b:v/b;}return v;}
    function expression(){let v=factor();if(v===null)return null;while(text[i]==="+"||text[i]==="-"){const op=text[i++],b=factor();if(b===null)return null;v=op==="+"?v+b:v-b;}return v;}
    const value=expression();return i===text.length&&Number.isFinite(value)?value:null;
  }

  function parseNumber(text){
    const t=String(text).trim().replace(/,/g,".").replace(/[−–]/g,"-").replace(/°\s*[Cc]?/g,"");
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))return null;
    const n=Number(t);return Number.isFinite(n)?n:null;
  }

  function correct(q,raw){
    if(raw==null||raw==="")return false;
    if(q.answer==="expression3")return parseExpression(raw)===3;
    if(q.answer==="temperatures23"){const p=String(raw).split(/[;,]/).map(parseNumber);return p.length===2&&p.every(n=>n!==null)&&Math.abs(p[0]-p[1])===23;}
    if(typeof q.answer==="number"){const n=parseNumber(raw);return n!==null&&n===q.answer;}
    return false;
  }

  function escapeHtml(value){
    return String(value==null?"":value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function formatTime(seconds){seconds=Number(seconds)||0;return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;}

  function correctAnswer(q){
    if(q.answer==="expression3")return "Operación cuyo resultado sea +3";
    if(q.answer==="temperatures23")return "Dos temperaturas separadas por 23 °C";
    return typeof q.answer==="number"?String(q.answer>=0&&q.answer!==0?"+"+q.answer:q.answer):"";
  }

  function explanation(q){
    if(q.answer==="expression3")return "El resultado de la operación debe ser exactamente 3.";
    if(q.answer==="temperatures23")return "La distancia absoluta entre las dos temperaturas debe ser 23.";
    if(q.visual==="temperature"){const [a,b]=q.temps||[];return `La distancia entre ${a} °C y ${b} °C es ${Math.abs(a-b)} °C.`;}
    if(q.visual==="division"){
      if(q.dividend<0&&q.divisor<0||q.dividend>=0&&q.divisor>0)return "Los signos son iguales, así que el cociente es positivo.";
      return "Los signos son diferentes, así que el cociente es negativo.";
    }
    if(q.answer==="number"||typeof q.answer==="number")return `El procedimiento y el signo dan ${correctAnswer(q)}.`;
    return "Sigue el desplazamiento paso a paso y verifica el signo.";
  }

  function analysis(record){
    const scores=[...record.stationResults.map(r=>r.correct),record.finalResult.correct];
    const names=["la suma y resta de números enteros","las diferencias de temperatura","la división de números enteros","el reto final"];
    const strong=scores.map((n,i)=>n>=8?names[i]:null).filter(Boolean);
    const weak=scores.map((n,i)=>n<8?names[i]:null).filter(Boolean);
    let text;
    if(weak.length===0)text="Has demostrado un dominio muy completo de las cuatro partes de la misión.";
    else if(strong.length===0)text="Has iniciado la misión con interés. Necesitas repasar con calma las reglas de los números enteros.";
    else text=`Has demostrado buenos resultados en ${strong.join(" y ")}. Ahora conviene reforzar ${weak.join(" y ")}.`;
    return text;
  }

  function recommendations(record){
    const scores=[record.stationResults[0].correct,record.stationResults[1].correct,record.stationResults[2].correct,record.finalResult.correct];
    const names=["Suma y resta con fichas","Diferencias de temperatura","División de enteros","Reto final"];
    const strong=scores.map((n,i)=>n>=8?names[i]:null).filter(Boolean);
    const weak=scores.map((n,i)=>n<8?names[i]:null).filter(Boolean);
    const repeat=[];
    [...data.stations.flatMap(s=>s.questions),...data.finalQuestions].forEach(q=>{
      if(!correct(q,record.answers?.[q.id]))repeat.push(q.prompt.replace(/<[^>]+>/g," "));
    });
    return {strong:strong.length?strong:["Aún no hay una sección dominada claramente"],weak:weak.length?weak:["Mantén y amplía todos los contenidos"],repeat:repeat.slice(0,5)};
  }

  function render(record,state){
    if(!record)record=state?buildFallback(state):null;
    if(!record)return "<section>No hay informe disponible.</section>";
    const all=data.stations.flatMap(s=>s.questions).concat(data.finalQuestions);
    const review=all.map(q=>{
      const raw=record.answers?.[q.id];
      const ok=correct(q,raw);
      const ficha=record.fichaProgress?.[q.id];
      const fichaColumns=q.visual==="fichas"
        ? `<td>${ficha?.builtCorrect?"Sí":"No"}</td><td>${ficha?.cancelCorrect?"Sí":"No"}</td>`
        : `<td>—</td><td>—</td>`;
      return `<tr class="${ok?"ok-row":"bad-row"}"><td>${q.prompt.replace(/\n/g," ")}</td><td>${raw==null||raw===""?"Sin respuesta":escapeHtml(raw)}</td><td>${escapeHtml(correctAnswer(q))}</td><td><b>${ok?"✓ Acierto":"× Error"}</b></td><td>${ok?"Respuesta correcta":escapeHtml(explanation(q))}</td>${fichaColumns}</tr>`;
    }).join("");
    const stats=recommendations(record);
    const max=[10,10,10,3];
    const vals=[...record.stationResults.map(r=>r.correct),record.finalResult.correct];
    const barLabels=["Est. 1","Est. 2","Est. 3","Final"];
    const bars=vals.map((v,i)=>`<div class="bar-item"><span>${barLabels[i]}</span><div class="bar-track"><i style="height:${v/max[i]*100}%"></i></div><b>${v}/${max[i]}</b></div>`).join("");
    const date=record.student.date?new Date(record.student.date+"T12:00:00").toLocaleDateString("es-ES"):new Date(record.finishedAt).toLocaleDateString("es-ES");

    return `<article class="academic-report">
      <header class="report-header"><div><p>PASAPORTE · INFORME INDIVIDUAL</p><h1>Resultados de la misión</h1></div><div class="report-seal">NÚMEROS<br><b>ENTEROS</b></div></header>
      <section class="report-data"><div><b>Alumno</b><span>${escapeHtml(record.student.name)}</span></div><div><b>Curso y grupo</b><span>${escapeHtml(record.student.course)}</span></div><div><b>Fecha</b><span>${escapeHtml(date)}</span></div><div><b>Tiempo empleado</b><span>${formatTime(record.elapsedSeconds)}</span></div></section>
      <section class="report-summary"><div><span>PUNTUACIÓN</span><strong>${record.points}<small>/33</small></strong></div><div><span>NOTA</span><strong>${record.grade}<small>/10</small></strong></div><div><span>ACIERTOS</span><strong>${record.points}</strong></div><div><span>ERRORES</span><strong>${33-record.points}</strong></div></section>
      <section class="report-section"><h2>Resultados por estaciones</h2><table><thead><tr><th>Apartado</th><th>Aciertos</th><th>Errores</th><th>Puntuación</th></tr></thead><tbody>
      ${[["Estación 1",record.stationResults[0]],["Estación 2",record.stationResults[1]],["Estación 3",record.stationResults[2]],["Reto final",{correct:record.finalResult.correct,errors:record.finalResult.errors}]].map((x,i)=>`<tr><td>${x[0]}</td><td>${x[1].correct}</td><td>${x[1].errors}</td><td>${x[1].correct}/${max[i]}</td></tr>`).join("")}
      </tbody></table><div class="bar-chart" aria-label="Grafico de resultados">${bars}</div></section>
      <section class="report-section"><h2>Revisión de los ejercicios</h2><div class="table-wrap"><table class="review-table"><thead><tr><th>Enunciado</th><th>Respuesta</th><th>Respuesta correcta</th><th>Resultado</th><th>Procedimiento</th><th>Construcción</th><th>Cancelación</th></tr></thead><tbody>${review}</tbody></table></div></section>
      <section class="report-section learning-analysis"><h2>Análisis del aprendizaje</h2><p>${escapeHtml(analysis(record))}</p></section>
      <section class="recommendations"><article><h3>LO QUE DOMINAS</h3><ul>${stats.strong.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></article><article><h3>LO QUE DEBES MEJORAR</h3><ul>${stats.weak.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></article><article><h3>EJERCICIOS PARA REPETIR</h3><ul>${stats.repeat.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></article></section>
      <footer class="report-motivator">¡Cada intento te hace avanzar!<span>PASAPORTE: NÚMEROS ENTEROS</span></footer>
      <div class="report-actions no-print"><button class="primary" id="printReportBtn">Descargar / imprimir informe PDF</button><button class="secondary" id="creditsBtn">Créditos</button></div>
    </article>`;
  }

  function buildFallback(state){return {student:state.student,elapsedSeconds:state.elapsedSeconds,points:0,grade:"0.00",stationResults:[1,2,3].map(()=>({correct:0,errors:10})),finalResult:{correct:0,errors:3},answers:state.answers};}

  document.addEventListener("click",e=>{
    if(e.target.id==="printReportBtn")window.print();
    if(e.target.id==="creditsBtn"){
      const app=document.getElementById("app");
      if(app) app.dispatchEvent(new CustomEvent("showCredits"));
    }
  });

  window.PASAPORTE_REPORT={
    render,
    bindCredits(callback){
      document.addEventListener("click",e=>{if(e.target.id==="creditsBtn")callback();});
    }
  };
})();
