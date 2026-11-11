/* Virgínia Paz · S.P.A Terapêutico */
(function () {
  'use strict';

  // Número que recebe os agendamentos e as fichas (DDI + DDD + número, só dígitos)
  var WHATSAPP = '5548996685672';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function abrirWhatsApp(texto) {
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    var janela = window.open(url, '_blank', 'noopener');
    if (!janela) window.location.href = url;
  }
  function dataBR(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }
  function marcados(form, nome) {
    return $$('input[name="' + nome + '"]:checked', form).map(function (i) { return i.value; });
  }
  function valor(form, nome) {
    var el = form.elements[nome];
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }
  function mostrarErro(form, msg) {
    var e = $('.erro', form);
    if (!e) return;
    e.textContent = msg || '';
    e.hidden = !msg;
  }
  function validar(campos) {
    var primeiro = null;
    campos.forEach(function (c) {
      var ok = c.type === 'checkbox' ? c.checked : c.value.trim() !== '';
      c.classList.toggle('invalido', !ok);
      if (!ok && !primeiro) primeiro = c;
    });
    if (primeiro) primeiro.focus();
    return !primeiro;
  }

  /* Cabeçalho */
  var topo = $('#topo');
  var botaoMenu = $('.menu-btn');
  function aoRolar() { topo.classList.toggle('is-rolado', window.scrollY > 40); }
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });
  function menu(aberto) {
    topo.classList.toggle('menu-aberto', aberto);
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = aberto ? 'hidden' : '';
  }
  botaoMenu.addEventListener('click', function () { menu(!topo.classList.contains('menu-aberto')); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  /* Abas de atendimentos */
  var abas = $$('.aba');
  function ativarAba(aba, focar) {
    abas.forEach(function (a) {
      var ativa = a === aba;
      a.classList.toggle('is-ativa', ativa);
      a.setAttribute('aria-selected', String(ativa));
      a.tabIndex = ativa ? 0 : -1;
      var painel = document.getElementById(a.getAttribute('aria-controls'));
      painel.hidden = !ativa;
      painel.classList.toggle('is-ativo', ativa);
    });
    if (focar) aba.focus();
  }
  abas.forEach(function (aba, i) {
    aba.addEventListener('click', function () { ativarAba(aba); });
    aba.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var prox = (i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length;
      ativarAba(abas[prox], true);
    });
  });

  /* "Agendar" de cada atendimento já deixa o serviço escolhido */
  var selServico = $('#ag-servico');
  $$('[data-servico]').forEach(function (link) {
    link.addEventListener('click', function () {
      var alvo = link.getAttribute('data-servico');
      $$('option', selServico).forEach(function (o) { if (o.textContent === alvo) selServico.value = o.value; });
    });
  });

  /* Agendamento */
  var formAg = $('#form-agendar');
  var campoData = $('#ag-data');
  var hoje = new Date();
  campoData.min = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
  formAg.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validar($$('[required]', formAg))) { mostrarErro(formAg, 'Preencha seu nome, o atendimento e a data de preferência.'); return; }
    if (campoData.value < campoData.min) { campoData.classList.add('invalido'); mostrarErro(formAg, 'Escolha uma data a partir de hoje.'); return; }
    mostrarErro(formAg, '');
    var linhas = [
      'Olá, Virgínia! Gostaria de agendar um atendimento. 🌸',
      '',
      '*Nome:* ' + valor(formAg, 'nome'),
      '*Atendimento:* ' + valor(formAg, 'servico'),
      '*Onde:* ' + marcados(formAg, 'formato').join(''),
      '*Data de preferência:* ' + dataBR(valor(formAg, 'data')),
      '*Período:* ' + marcados(formAg, 'periodo').join('')
    ];
    var obs = valor(formAg, 'obs');
    if (obs) linhas.push('*Observações:* ' + obs);
    abrirWhatsApp(linhas.join('\n'));
  });

  /* Ficha de anamnese em 3 passos */
  var formAn = $('#form-anamnese');
  var passos = $$('.passo', formAn);
  var marcas = $$('.passos li', formAn);
  var btVoltar = $('[data-voltar]', formAn);
  var btAvancar = $('[data-avancar]', formAn);
  var btEnviar = $('button[type="submit"]', formAn);
  var atual = 0;
  function irPara(n) {
    atual = n;
    passos.forEach(function (p, i) { p.hidden = i !== n; p.classList.toggle('is-atual', i === n); });
    marcas.forEach(function (m, i) { m.classList.toggle('is-atual', i === n); m.classList.toggle('is-feito', i < n); });
    btVoltar.hidden = n === 0;
    btAvancar.hidden = n === passos.length - 1;
    btEnviar.hidden = n !== passos.length - 1;
    mostrarErro(formAn, '');
  }
  btAvancar.addEventListener('click', function () {
    if (!validar($$('[required]', passos[atual]))) { mostrarErro(formAn, 'Preencha seu nome para continuar.'); return; }
    irPara(atual + 1);
    formAn.scrollIntoView({ block: 'nearest' });
  });
  btVoltar.addEventListener('click', function () { irPara(atual - 1); });
  // "Nenhuma destas" desmarca as demais, e vice-versa
  $$('input[name="condicoes"]', formAn).forEach(function (c) {
    c.addEventListener('change', function () {
      if (!c.checked) return;
      var exclusivo = c.hasAttribute('data-exclusivo');
      $$('input[name="condicoes"]', formAn).forEach(function (o) {
        if (o !== c && (exclusivo || o.hasAttribute('data-exclusivo'))) o.checked = false;
      });
    });
  });
  formAn.addEventListener('submit', function (e) {
    e.preventDefault();
    if (atual !== passos.length - 1) { btAvancar.click(); return; }
    if (!valor(formAn, 'nome')) { irPara(0); validar([formAn.elements.nome]); mostrarErro(formAn, 'Preencha seu nome para continuar.'); return; }
    if (!formAn.elements.aceite.checked) { mostrarErro(formAn, 'Marque a autorização de envio para continuar.'); return; }
    mostrarErro(formAn, '');
    var lista = function (nome) { var v = marcados(formAn, nome); return v.length ? v.join(', ') : 'Não informado'; };
    var linhas = [
      '*Ficha de anamnese · S.P.A Terapêutico* 🌿',
      '',
      '*Nome:* ' + valor(formAn, 'nome')
    ];
    if (valor(formAn, 'nascimento')) linhas.push('*Nascimento:* ' + dataBR(valor(formAn, 'nascimento')));
    if (valor(formAn, 'cidade')) linhas.push('*Cidade / hospedagem:* ' + valor(formAn, 'cidade'));
    linhas.push('*O que busca:* ' + lista('busca'));
    linhas.push('', '*Regiões de tensão:* ' + lista('regioes'));
    linhas.push('*Condições de saúde:* ' + lista('condicoes'));
    if (valor(formAn, 'detalhes')) linhas.push('*Medicamentos / detalhes:* ' + valor(formAn, 'detalhes'));
    linhas.push('', '*Pressão do toque:* ' + lista('pressao'));
    if (valor(formAn, 'aromas')) linhas.push('*Aromas:* ' + valor(formAn, 'aromas'));
    if (valor(formAn, 'mais')) linhas.push('*Observações:* ' + valor(formAn, 'mais'));
    linhas.push('', '_Autorizo o uso destas informações para a preparação do meu atendimento._');
    abrirWhatsApp(linhas.join('\n'));
  });
  $$('input, select, textarea').forEach(function (c) {
    c.addEventListener('input', function () { c.classList.remove('invalido'); });
  });

  /* Entrada suave das seções */
  var revelar = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visivel'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelar.forEach(function (el) { obs.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add('is-visivel'); });
  }

  var ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
