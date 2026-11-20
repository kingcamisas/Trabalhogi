var Q = [
  ["Quando você precisa resolver um problema, o que costuma fazer?",
   "Tomo a iniciativa e busco resolver rapidamente.",
   "Converso com as pessoas e busco ideias.",
   "Procuro manter a calma e ajudar a encontrar uma solução.",
   "Analiso os detalhes antes de tomar uma decisão."],

  ["Em um trabalho em equipe, como você costuma agir?",
   "Assumo a liderança e organizo o que precisa ser feito.",
   "Motivo o grupo e incentivo a participação.",
   "Apoio os colegas e procuro manter a harmonia.",
   "Organizo as tarefas e verifico se tudo está correto."],

  ["O que mais te motiva no ambiente de trabalho?",
   "Desafios, metas e resultados.",
   "Reconhecimento, interação e novas ideias.",
   "Segurança, cooperação e tranquilidade.",
   "Qualidade, organização e precisão."],

  ["Como você reage diante de mudanças inesperadas?",
   "Encaro como um desafio e ajo rapidamente.",
   "Vejo uma oportunidade de experimentar algo novo.",
   "Preciso de um tempo para me adaptar.",
   "Analiso os impactos e planejo como agir."],

  ["Qual característica mais combina com você?",
   "Determinado(a) e objetivo(a).",
   "Comunicativo(a) e entusiasmado(a).",
   "Paciente e colaborativo(a).",
   "Analítico(a) e cuidadoso(a)."]
];

var P = [
  {
    k: "D",
    n: "Dominância",
    t: "O realizador",
    c: "#c9494d",
    d: "Pessoas que tendem a ser objetivas, decididas, competitivas e orientadas a resultados.",
    ch: "desenvolver paciência e ouvir diferentes perspectivas."
  },
  {
    k: "I",
    n: "Influência",
    t: "O comunicador",
    c: "#d9a521",
    d: "Pessoas que tendem a ser comunicativas, entusiasmadas, sociáveis e persuasivas.",
    ch: "manter o foco e organizar prioridades."
  },
  {
    k: "S",
    n: "Estabilidade",
    t: "O apoiador",
    c: "#2f9a6b",
    d: "Pessoas que tendem a ser pacientes, cooperativas, acolhedoras e constantes.",
    ch: "adaptar-se a mudanças e expressar suas opiniões."
  },
  {
    k: "C",
    n: "Conformidade",
    t: "O analista",
    c: "#4a78b8",
    d: "Pessoas que tendem a ser cuidadosas, detalhistas, organizadas e analíticas.",
    ch: "evitar o excesso de análise e lidar com imprevistos."
  }
];

var L = "ABCD";
var ans = [];
var box = document.getElementById("qs");
var go = document.getElementById("go");
var res = document.getElementById("res");

var API = "https://script.google.com/macros/s/AKfycbyWsYkwoq9Yo68VXBdnvAFbzmb_mCMoCCKWbHSJA6uhFz14NlSAS6EJoJmulqyml3cz/exec";

var idUsuario = "";
var envioInicial = Promise.resolve();
var iniciado = false;
var sent = false;
var estatisticasTimer = null;

// IDENTIFICAÇÃO ANÔNIMA
function obterIdUsuario() {
  try {
    var id = sessionStorage.getItem("disc_id");

    if (!id) {
      id = "DISC-" + Date.now() + "-" +
        Math.random().toString(36).substring(2, 12);

      sessionStorage.setItem("disc_id", id);
    }

    return id;

  } catch (e) {
    return "DISC-" + Date.now() + "-" +
      Math.random().toString(36).substring(2, 12);
  }
}

idUsuario = obterIdUsuario();

// ENVIA DADOS PARA O GOOGLE
function enviarDados(dados) {
  dados.id = idUsuario;

  return fetch(API, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(dados)
  });
}

// REGISTRA ACESSO
function registrarAcesso() {
  try {
    if (sessionStorage.getItem("disc_visit_registered") === idUsuario) {
      return Promise.resolve();
    }

    sessionStorage.setItem("disc_visit_registered", idUsuario);

  } catch (e) {}

  return enviarDados({
    acao: "access"
  }).catch(function(e) {
    console.error("Erro ao registrar acesso:", e);
  });
}

envioInicial = registrarAcesso();

// REGISTRA INÍCIO
function iniciarQuestionario() {
  if (iniciado) return;

  iniciado = true;

  envioInicial.then(function() {
    return enviarDados({
      acao: "start"
    });
  }).catch(function(e) {
    console.error("Erro ao iniciar questionário:", e);
  });
}

// ENVIA PROGRESSO E RESPOSTAS
function salvarProgresso() {
  if (!iniciado) return;

  var respostas = [];

  for (var i = 0; i < Q.length; i++) {
    respostas.push(
      ans[i] === undefined ? "" : L[ans[i]]
    );
  }

  envioInicial.then(function() {
    return enviarDados({
      acao: "progress",
      respostas: respostas
    });
  }).catch(function(e) {
    console.error("Erro ao salvar respostas:", e);
  });
}

// REGISTRA ABANDONO AO SAIR DA PÁGINA
var paginaConcluida = false;

function registrarAbandono() {
  if (!iniciado || paginaConcluida) return;

  var dados = {
    id: idUsuario,
    acao: "abandon"
  };

  try {
    var blob = new Blob(
      [JSON.stringify(dados)],
      { type: "text/plain;charset=utf-8" }
    );

    navigator.sendBeacon(API, blob);

  } catch (e) {}
}

document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "hidden") {
    registrarAbandono();
  }
});

window.addEventListener("pagehide", registrarAbandono);

// CRIA AS PERGUNTAS
Q.forEach(function(q, i) {
  var s = document.createElement("section");
  s.id = "q" + i;

  var h =
    '<div class="glass reveal">' +
    '<div class="q-n">Pergunta ' + (i + 1) +
    ' de ' + Q.length + '</div>' +
    '<h2>' + q[0] + '</h2>';

  for (var j = 0; j < 4; j++) {
    h +=
      '<label class="opt">' +
      '<input type="radio" name="q' + i +
      '" value="' + j + '">' +
      '<b>' + L[j] + '</b>' +
      q[j + 1] +
      '</label>';
  }

  s.innerHTML = h + '</div>';
  box.appendChild(s);

  s.addEventListener("change", function(e) {
    if (!e.target.matches('input[type="radio"]')) return;

    iniciarQuestionario();

    ans[i] = Number(e.target.value);

    var n = ans.filter(function(x) {
      return x !== undefined;
    }).length;

    go.disabled = n < Q.length;

    document.getElementById("st").textContent =
      n < Q.length
        ? "Faltam " + (Q.length - n) +
          " pergunta(s) para liberar o resultado."
        : "Tudo respondido. Veja o que o seu perfil revela.";

    salvarProgresso();

    var nx = document.getElementById(
      i < Q.length - 1 ? "q" + (i + 1) : "fim"
    );

    setTimeout(function() {
      nx.scrollIntoView({ behavior: "smooth" });
    }, 450);
  });
});

// RESULTADO INDIVIDUAL
go.onclick = function() {
  if (ans.filter(function(x) {
    return x !== undefined;
  }).length !== Q.length) {
    return;
  }

  var sc = [0, 0, 0, 0];

  ans.forEach(function(a) {
    sc[a]++;
  });

  var mx = Math.max.apply(null, sc);

  var top = P.filter(function(p, i) {
    return sc[i] === mx;
  });

  var pct = sc.map(function(v) {
    return Math.round(v / Q.length * 100);
  });

  var title = top.map(function(p) {
    return p.k + " – " + p.n;
  }).join(" + ");

  document.getElementById("rt").textContent = title;

  document.getElementById("rd").textContent =
    top.map(function(p) {
      return p.t + ": " + p.d;
    }).join(" ");

  document.getElementById("rc").textContent =
    top.map(function(p) {
      return p.ch;
    }).join(" ");

  var b = "";

  P.forEach(function(p, i) {
    b +=
      '<div class="row">' +
      '<div class="l"><span>' +
      p.k + ' – ' + p.n +
      '</span><span>' + pct[i] + '%</span></div>' +
      '<div class="track"><div class="fill" data-w="' +
      pct[i] + '" style="background:' + p.c +
      '"></div></div></div>';
  });

  document.getElementById("bars").innerHTML = b;

  var t =
    "RESULTADO DO TESTE DISC – RH2 • ESCOLA MULTI\n\n" +
    "Perfil predominante: " + title + "\n" +
    top.map(function(p) {
      return p.t + ": " + p.d;
    }).join("\n") +
    "\n\nDistribuição:\n" +
    P.map(function(p, i) {
      return "- " + p.k + " – " + p.n +
        ": " + pct[i] + "% (" + sc[i] +
        " de " + Q.length + ")";
    }).join("\n") +
    "\n\nPonto de desenvolvimento: " +
    top.map(function(p) {
      return p.ch;
    }).join(" ") +
    "\n\nObservação: o DISC indica tendências de comportamento e não define quem a pessoa é.";

  document.getElementById("sum").value = t;

  res.classList.add("on");

  // REGISTRA CONCLUSÃO
  paginaConcluida = true;
  sent = true;

  envioInicial.then(function() {
    return enviarDados({
      acao: "complete",
      respostas: ans.map(function(a) {
        return L[a];
      }),
      pontuacoes: {
        D: sc[0],
        I: sc[1],
        S: sc[2],
        C: sc[3]
      },
      resultado: title
    });
  }).catch(function(e) {
    console.error("Erro ao salvar resultado:", e);
  });

  res.scrollIntoView({ behavior: "smooth" });

  setTimeout(function() {
    document.querySelectorAll(".fill").forEach(function(f) {
      f.style.width = f.dataset.w + "%";
    });
  }, 600);

  carregarEstatisticas();
};

// COPIAR RESUMO
var msg = document.getElementById("msg");

document.getElementById("cp").onclick = function() {
  var ta = document.getElementById("sum");

  function ok() {
    msg.textContent = "Resumo copiado.";
  }

  function fb() {
    ta.select();

    try {
      document.execCommand("copy");
      ok();
    } catch (e) {
      msg.textContent = "Selecione o texto acima e copie manualmente.";
    }
  }

  try {
    navigator.clipboard.writeText(ta.value).then(ok, fb);
  } catch (e) {
    fb();
  }
};

// IMPRIMIR
document.getElementById("pr").onclick = function() {
  try {
    window.print();
  } catch (e) {
    msg.textContent = "Use a opção de imprimir do navegador.";
  }
};

// REFAZER
document.getElementById("rs").onclick = function() {
  ans = [];

  document.querySelectorAll('input[type="radio"]').forEach(function(i) {
    i.checked = false;
  });

  iniciado = false;
  paginaConcluida = false;
  sent = false;

  go.disabled = true;

  res.classList.remove("on");

  document.getElementById("st").textContent =
    "Responda todas as perguntas para liberar o resultado.";

  msg.textContent = "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

// CONSULTA ESTATÍSTICAS USANDO JSONP
function consultarEstatisticas() {
  return new Promise(function(resolve, reject) {
    var nomeCallback = "discCallback_" + Date.now() +
      "_" + Math.floor(Math.random() * 10000);

    var script = document.createElement("script");

    var terminou = false;

    var temporizador = setTimeout(function() {
      finalizar(new Error("Tempo esgotado."));
    }, 15000);

    function finalizar(erro, dados) {
      if (terminou) return;

      terminou = true;
      clearTimeout(temporizador);

      try {
        delete window[nomeCallback];
      } catch (e) {
        window[nomeCallback] = undefined;
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      if (erro) reject(erro);
      else resolve(dados);
    }

    window[nomeCallback] = function(dados) {
      finalizar(null, dados);
    };

    script.onerror = function() {
      finalizar(new Error("Não foi possível consultar o Google."));
    };

    script.src = API +
      "?acao=estatisticas&callback=" +
      nomeCallback + "&t=" + Date.now();

    document.body.appendChild(script);
  });
}

// ANIMA NÚMEROS
function countUp(el, to) {
  var t0 = performance.now();

  (function f(t) {
    var k = Math.min(1, (t - t0) / 1200);

    el.textContent = Math.round(
      to * (1 - Math.pow(1 - k, 3))
    );

    if (k < 1) requestAnimationFrame(f);
  })(t0);
}

// ATUALIZA GRÁFICO E ESTATÍSTICAS
function carregarEstatisticas() {
  var gs = document.getElementById("gs");

  gs.textContent = "Atualizando estatísticas...";

  consultarEstatisticas().then(function(d) {
    if (!d || typeof d.totalAcessos !== "number") {
      throw new Error("Resposta inválida.");
    }

    gs.textContent = "";

    countUp(
      document.getElementById("kv"),
      d.totalAcessos
    );

    countUp(
      document.getElementById("kr"),
      d.concluidos
    );

    var valores = [
      d.dominancia || 0,
      d.influencia || 0,
      d.estabilidade || 0,
      d.conformidade || 0
    ];

    var total = valores.reduce(function(a, b) {
      return a + b;
    }, 0);

    var svg = document.getElementById("dn");
    var lg = document.getElementById("lg");

    var C = 2 * Math.PI * 42;
    var off = 0;
    var s = "";
    var l = "";

    P.forEach(function(pf, i) {
      var pc = total ? valores[i] / total : 0;
      var len = pc * C;

      s +=
        '<circle cx="60" cy="60" r="42" fill="none" ' +
        'stroke="' + pf.c + '" stroke-width="18" ' +
        'stroke-dasharray="0 ' + C + '" ' +
        'data-len="' + len + '" data-c="' + C + '" ' +
        'stroke-dashoffset="' + (-off) + '"/>' ;

      off += len;

      l +=
        '<div><i style="background:' + pf.c +
        '"></i>' + pf.k + ' – ' + pf.n +
        ': ' + Math.round(pc * 100) + '%</div>';
    });

    svg.innerHTML = s;

    lg.innerHTML = l +
      '<div style="color:var(--mut);font-weight:400">' +
      'Base: ' + total + ' respostas</div>';

    setTimeout(function() {
      svg.querySelectorAll("circle").forEach(function(c) {
        c.setAttribute(
          "stroke-dasharray",
          c.dataset.len + " " + c.dataset.c
        );
      });
    }, 200);

  }).catch(function(e) {
    console.error("Estatísticas:", e);
    gs.textContent =
      "Não foi possível atualizar as estatísticas. Tente novamente.";
  });
}

// ATUALIZA ESTATÍSTICAS AO ABRIR O SITE
carregarEstatisticas();

// ATUALIZA PERIODICAMENTE
estatisticasTimer = setInterval(function() {
  carregarEstatisticas();
}, 30000);

// ANIMAÇÕES ORIGINAIS
var rv = [].slice.call(document.querySelectorAll(".reveal"));
var orbs = [].slice.call(document.querySelectorAll(".orb"));
var bar = document.getElementById("bar");
var tick = false;

function upd() {
  tick = false;

  var h = innerHeight;
  var y = scrollY;
  var m = document.documentElement.scrollHeight - h;

  bar.style.transform =
    "scaleX(" + (m > 0 ? Math.min(1, y / m) : 0) + ")";

  orbs.forEach(function(o) {
    o.style.transform =
      "translateY(" + (y * o.dataset.s) + "px)";
  });

  rv.forEach(function(el) {
    var r = el.getBoundingClientRect();

    if (!r.height) return;

    var c = (r.top + r.height / 2) / h;
    var d = Math.min(1, Math.abs(c - 0.5) * 2);
    var p = 1 - Math.pow(d, 1.6);

    el.style.opacity = Math.max(0.15, p);

    el.style.transform =
      "translateY(" + ((c - 0.5) * 60) +
      "px) scale(" + (0.92 + 0.08 * p) + ")";
  });
}

function rq() {
  if (!tick) {
    tick = true;
    requestAnimationFrame(upd);
  }
}

addEventListener("scroll", rq, { passive: true });
addEventListener("resize", rq);

upd();
