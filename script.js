var Q=[
["Quando você precisa resolver um problema, o que costuma fazer?","Tomo a iniciativa e busco resolver rapidamente.","Converso com as pessoas e busco ideias.","Procuro manter a calma e ajudar a encontrar uma solução.","Analiso os detalhes antes de tomar uma decisão."],
["Em um trabalho em equipe, como você costuma agir?","Assumo a liderança e organizo o que precisa ser feito.","Motivo o grupo e incentivo a participação.","Apoio os colegas e procuro manter a harmonia.","Organizo as tarefas e verifico se tudo está correto."],
["O que mais te motiva no ambiente de trabalho?","Desafios, metas e resultados.","Reconhecimento, interação e novas ideias.","Segurança, cooperação e tranquilidade.","Qualidade, organização e precisão."],
["Como você reage diante de mudanças inesperadas?","Encaro como um desafio e ajo rapidamente.","Vejo uma oportunidade de experimentar algo novo.","Preciso de um tempo para me adaptar.","Analiso os impactos e planejo como agir."],
["Qual característica mais combina com você?","Determinado(a) e objetivo(a).","Comunicativo(a) e entusiasmado(a).","Paciente e colaborativo(a).","Analítico(a) e cuidadoso(a)."]];
var P=[
{k:"D",n:"Dominância",t:"O realizador",c:"#c9494d",d:"Pessoas que tendem a ser objetivas, decididas, competitivas e orientadas a resultados.",ch:"desenvolver paciência e ouvir diferentes perspectivas."},
{k:"I",n:"Influência",t:"O comunicador",c:"#d9a521",d:"Pessoas que tendem a ser comunicativas, entusiasmadas, sociáveis e persuasivas.",ch:"manter o foco e organizar prioridades."},
{k:"S",n:"Estabilidade",t:"O apoiador",c:"#2f9a6b",d:"Pessoas que tendem a ser pacientes, cooperativas, acolhedoras e constantes.",ch:"adaptar-se a mudanças e expressar suas opiniões."},
{k:"C",n:"Conformidade",t:"O analista",c:"#4a78b8",d:"Pessoas que tendem a ser cuidadosas, detalhistas, organizadas e analíticas.",ch:"evitar o excesso de análise e lidar com imprevistos."}];
var L="ABCD",ans=[],box=document.getElementById("qs"),go=document.getElementById("go");
Q.forEach(function(q,i){
  var s=document.createElement("section");s.id="q"+i;
  var h='<div class="glass reveal"><div class="q-n">Pergunta '+(i+1)+' de '+Q.length+'</div><h2>'+q[0]+'</h2>';
  for(var j=0;j<4;j++)h+='<label class="opt"><input type="radio" name="q'+i+'" value="'+j+'"><b>'+L[j]+'</b>'+q[j+1]+'</label>';
  s.innerHTML=h+'</div>';box.appendChild(s);
  s.addEventListener("change",function(e){
    ans[i]=+e.target.value;var n=ans.filter(function(x){return x!==undefined}).length;
    go.disabled=n<Q.length;
    document.getElementById("st").textContent=n<Q.length?"Faltam "+(Q.length-n)+" pergunta(s) para liberar o resultado.":"Tudo respondido. Veja o que o seu perfil revela.";
    var nx=document.getElementById(i<Q.length-1?"q"+(i+1):"fim");
    setTimeout(function(){nx.scrollIntoView({behavior:"smooth"})},450);
  });
});
var res=document.getElementById("res");
go.onclick=function(){
  var sc=[0,0,0,0];ans.forEach(function(a){sc[a]++});
  var mx=Math.max.apply(null,sc),top=P.filter(function(p,i){return sc[i]===mx});
  var pct=sc.map(function(v){return Math.round(v/Q.length*100)});
  var title=top.map(function(p){return p.k+" – "+p.n}).join(" + ");
  document.getElementById("rt").textContent=title;
  document.getElementById("rd").textContent=top.map(function(p){return p.t+": "+p.d}).join(" ");
  document.getElementById("rc").textContent=top.map(function(p){return p.ch}).join(" ");
  var b="";P.forEach(function(p,i){b+='<div class="row"><div class="l"><span>'+p.k+' – '+p.n+'</span><span>'+pct[i]+'%</span></div><div class="track"><div class="fill" data-w="'+pct[i]+'" style="background:'+p.c+'"></div></div></div>'});
  document.getElementById("bars").innerHTML=b;
  var t="RESULTADO DO TESTE DISC – RH2 • ESCOLA MULTI\n\nPerfil predominante: "+title+"\n"+top.map(function(p){return p.t+": "+p.d}).join("\n")+"\n\nDistribuição:\n"+P.map(function(p,i){return "- "+p.k+" – "+p.n+": "+pct[i]+"% ("+sc[i]+" de "+Q.length+")"}).join("\n")+"\n\nPonto de desenvolvimento: "+top.map(function(p){return p.ch}).join(" ")+"\n\nObservação: o DISC indica tendências de comportamento e não define quem a pessoa é.";
  document.getElementById("sum").value=t;
  res.classList.add("on");
  res.scrollIntoView({behavior:"smooth"});
  setTimeout(function(){document.querySelectorAll(".fill").forEach(function(f){f.style.width=f.dataset.w+"%"})},600);
};
var msg=document.getElementById("msg");
document.getElementById("cp").onclick=function(){
  var ta=document.getElementById("sum");
  function ok(){msg.textContent="Resumo copiado."}
  function fb(){ta.select();try{document.execCommand("copy");ok()}catch(e){msg.textContent="Selecione o texto acima e copie manualmente."}}
  try{navigator.clipboard.writeText(ta.value).then(ok,fb)}catch(e){fb()}
};
document.getElementById("pr").onclick=function(){try{window.print()}catch(e){msg.textContent="Use a opção de imprimir do navegador."}};
document.getElementById("rs").onclick=function(){
  ans=[];document.querySelectorAll("input").forEach(function(i){i.checked=false});
  go.disabled=true;res.classList.remove("on");document.getElementById("st").textContent="Responda todas as perguntas para liberar o resultado.";msg.textContent="";
  window.scrollTo({top:0,behavior:"smooth"});
};
/* animações guiadas pela rolagem */
var rv=[].slice.call(document.querySelectorAll(".reveal")),orbs=[].slice.call(document.querySelectorAll(".orb")),bar=document.getElementById("bar"),tick=false;
function upd(){
  tick=false;var h=innerHeight,y=scrollY,m=document.documentElement.scrollHeight-h;
  bar.style.transform="scaleX("+(m>0?Math.min(1,y/m):0)+")";
  orbs.forEach(function(o){o.style.transform="translateY("+(y*o.dataset.s)+"px)"});
  rv.forEach(function(el){
    var r=el.getBoundingClientRect();if(!r.height)return;
    var c=(r.top+r.height/2)/h;           /* 0.5 = centro da tela */
    var d=Math.min(1,Math.abs(c-.5)*2);     /* 0 no centro, 1 nas bordas */
    var p=1-Math.pow(d,1.6);
    el.style.opacity=Math.max(.15,p);
    el.style.transform="translateY("+((c-.5)*60)+"px) scale("+(.92+.08*p)+")";
  });
}
function rq(){if(!tick){tick=true;requestAnimationFrame(upd)}}
addEventListener("scroll",rq,{passive:true});addEventListener("resize",rq);upd();
