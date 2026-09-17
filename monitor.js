const INTERVALO_ATUALIZACAO = 5000;
const MAXIMO_LEITURAS = 30;

let leituras = [
  { id: 1, horario: "19:44:35", temperatura: 27.4, umidade: 68.2 },
  { id: 2, horario: "19:44:40", temperatura: 29.1, umidade: 60.8 },
  { id: 3, horario: "19:44:45", temperatura: 31.3, umidade: 47.6 },
  { id: 4, horario: "19:44:50", temperatura: 30.5, umidade: 49.2 },
  { id: 5, horario: "19:44:55", temperatura: 28.8, umidade: 56.4 }
];

let simulacaoAtiva = true;
let temporizador;

const elementos = {
  temperatura: document.getElementById("temp"),
  umidade: document.getElementById("humidity"),
  statusVentilador: document.getElementById("fan-status"),
  iconeVentilador: document.getElementById("fan-icon"),
  resumo: document.getElementById("summary"),
  statusAmbiente: document.getElementById("environment-status"),
  mensagemAmbiente: document.getElementById("environment-message"),
  atualizadoEm: document.getElementById("updated-at"),
  limiteTemperatura: document.getElementById("temperature-limit"),
  limiteUmidade: document.getElementById("humidity-limit"),
  expressaoRegra: document.getElementById("rule-expression"),
  corpoTabela: document.getElementById("readings-body"),
  mensagemVazia: document.getElementById("empty-message"),
  quantidadeRegistros: document.getElementById("record-count"),
  botaoSimulacao: document.getElementById("toggle-simulation"),
  statusConexao: document.getElementById("connection-status"),
  textoConexao: document.getElementById("connection-text"),
  botaoLimpar: document.getElementById("clear-table"),
  botaoExportar: document.getElementById("export-csv"),
  canvas: document.getElementById("history-chart")
};

function numeroValido(campo, padrao) {
  const numero = Number(campo.value);
  return campo.value !== "" && Number.isFinite(numero) ? numero : padrao;
}

function limitesAtuais() {
  return {
    temperatura: numeroValido(elementos.limiteTemperatura, 30),
    umidade: numeroValido(elementos.limiteUmidade, 50)
  };
}

function ventiladorDeveLigar(leitura) {
  const limites = limitesAtuais();
  return leitura.temperatura >= limites.temperatura && leitura.umidade >= limites.umidade;
}

function formatarNumero(numero) {
  return numero.toFixed(1).replace(".", ",");
}

function criarLeitura() {
  return {
    id: (leituras.at(-1)?.id || 0) + 1,
    horario: new Date().toLocaleTimeString("pt-BR"),
    temperatura: Number((18 + Math.random() * 19).toFixed(1)),
    umidade: Number((35 + Math.random() * 55).toFixed(1))
  };
}

function adicionarLeitura() {
  leituras.push(criarLeitura());
  if (leituras.length > MAXIMO_LEITURAS) leituras.shift();
  atualizarInterface();
}

function calcularEstatisticas(valores) {
  if (!valores.length) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  const mediana = ordenados.length % 2
    ? ordenados[meio]
    : (ordenados[meio - 1] + ordenados[meio]) / 2;

  return {
    maxima: Math.max(...valores),
    minima: Math.min(...valores),
    media: valores.reduce((soma, valor) => soma + valor, 0) / valores.length,
    mediana
  };
}

function atualizarLeituraAtual() {
  const ultima = leituras.at(-1);
  if (!ultima) {
    elementos.temperatura.textContent = "--";
    elementos.umidade.textContent = "--";
    elementos.statusVentilador.textContent = "Aguardando";
    elementos.iconeVentilador.classList.remove("spinning");
    elementos.atualizadoEm.textContent = "Ainda não atualizado";
    return;
  }

  const ligado = ventiladorDeveLigar(ultima);
  elementos.temperatura.textContent = formatarNumero(ultima.temperatura);
  elementos.umidade.textContent = formatarNumero(ultima.umidade);
  elementos.statusVentilador.textContent = ligado ? "Ligado" : "Desligado";
  elementos.iconeVentilador.classList.toggle("spinning", ligado);
  elementos.resumo.classList.toggle("alert", ligado);
  elementos.resumo.classList.toggle("comfortable", !ligado);
  elementos.statusAmbiente.textContent = ligado ? "Ventilação necessária" : "Ambiente dentro do critério";
  elementos.mensagemAmbiente.textContent = ligado
    ? "Os dois limites definidos foram atingidos. O ventilador foi ligado."
    : "O ventilador permanece desligado porque pelo menos um dos limites não foi atingido.";
  elementos.atualizadoEm.textContent = `Atualizado ${ultima.horario}`;
}

function preencherEstatisticas(prefixo, estatisticas, unidade) {
  ["max", "min", "mean", "median"].forEach((sufixo) => {
    document.getElementById(`${prefixo}-${sufixo}`).textContent = "--";
  });
  if (!estatisticas) return;

  document.getElementById(`${prefixo}-max`).textContent = `${formatarNumero(estatisticas.maxima)} ${unidade}`;
  document.getElementById(`${prefixo}-min`).textContent = `${formatarNumero(estatisticas.minima)} ${unidade}`;
  document.getElementById(`${prefixo}-mean`).textContent = `${formatarNumero(estatisticas.media)} ${unidade}`;
  document.getElementById(`${prefixo}-median`).textContent = `${formatarNumero(estatisticas.mediana)} ${unidade}`;
}

function atualizarEstatisticas() {
  preencherEstatisticas("temp", calcularEstatisticas(leituras.map((item) => item.temperatura)), "°C");
  preencherEstatisticas("humidity", calcularEstatisticas(leituras.map((item) => item.umidade)), "%");
  elementos.quantidadeRegistros.textContent = `${leituras.length} ${leituras.length === 1 ? "registro" : "registros"}`;
}

function atualizarTabela() {
  elementos.corpoTabela.innerHTML = "";
  const recentes = [...leituras].reverse().slice(0, 12);
  elementos.mensagemVazia.classList.toggle("hidden", recentes.length > 0);
  elementos.botaoLimpar.disabled = recentes.length === 0;
  elementos.botaoExportar.disabled = recentes.length === 0;

  recentes.forEach((leitura) => {
    const ligado = ventiladorDeveLigar(leitura);
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${leitura.horario}</td>
      <td>${formatarNumero(leitura.temperatura)} °C</td>
      <td>${formatarNumero(leitura.umidade)}%</td>
      <td><span class="status-pill ${ligado ? "on" : "off"}">${ligado ? "Ligado" : "Desligado"}</span></td>
    `;
    elementos.corpoTabela.appendChild(linha);
  });
}

function atualizarRegra() {
  const limites = limitesAtuais();
  elementos.expressaoRegra.innerHTML = `T ≥ ${limites.temperatura} °C <b>e</b> U ≥ ${limites.umidade}%`;
}

function desenharGrafico() {
  const canvas = elementos.canvas;
  const contexto = canvas.getContext("2d");
  const proporcao = window.devicePixelRatio || 1;
  const largura = canvas.clientWidth;
  const altura = canvas.clientHeight;
  canvas.width = largura * proporcao;
  canvas.height = altura * proporcao;
  contexto.setTransform(proporcao, 0, 0, proporcao, 0, 0);
  contexto.clearRect(0, 0, largura, altura);

  const margem = { topo: 42, direita: 24, baixo: 42, esquerda: 46 };
  const areaLargura = largura - margem.esquerda - margem.direita;
  const areaAltura = altura - margem.topo - margem.baixo;

  contexto.font = "12px system-ui";
  contexto.fillStyle = "#667a73";
  contexto.strokeStyle = "#dce8e3";
  contexto.lineWidth = 1;

  for (let valor = 0; valor <= 100; valor += 20) {
    const y = margem.topo + areaAltura - (valor / 100) * areaAltura;
    contexto.beginPath(); contexto.moveTo(margem.esquerda, y); contexto.lineTo(largura - margem.direita, y); contexto.stroke();
    contexto.fillText(String(valor), 13, y + 4);
  }

  contexto.fillStyle = "#e06a3a"; contexto.fillRect(margem.esquerda, 12, 18, 4);
  contexto.fillStyle = "#52665f"; contexto.fillText("Temperatura (°C)", margem.esquerda + 24, 18);
  contexto.fillStyle = "#2475a8"; contexto.fillRect(margem.esquerda + 150, 12, 18, 4);
  contexto.fillStyle = "#52665f"; contexto.fillText("Umidade (%)", margem.esquerda + 174, 18);

  if (!leituras.length) {
    contexto.textAlign = "center"; contexto.fillText("Nenhuma leitura disponível", largura / 2, altura / 2); contexto.textAlign = "left";
    return;
  }

  const xDaLeitura = (indice) => margem.esquerda + (leituras.length === 1 ? areaLargura / 2 : (indice / (leituras.length - 1)) * areaLargura);
  const yDoValor = (valor) => margem.topo + areaAltura - (valor / 100) * areaAltura;

  function desenharLinha(chave, cor) {
    contexto.beginPath(); contexto.strokeStyle = cor; contexto.lineWidth = 3;
    leituras.forEach((leitura, indice) => {
      const x = xDaLeitura(indice); const y = yDoValor(leitura[chave]);
      indice === 0 ? contexto.moveTo(x, y) : contexto.lineTo(x, y);
    });
    contexto.stroke();
    contexto.fillStyle = cor;
    leituras.forEach((leitura, indice) => { contexto.beginPath(); contexto.arc(xDaLeitura(indice), yDoValor(leitura[chave]), 3, 0, Math.PI * 2); contexto.fill(); });
  }

  desenharLinha("temperatura", "#e06a3a");
  desenharLinha("umidade", "#2475a8");

  const passoRotulo = Math.max(1, Math.ceil(leituras.length / 8));
  contexto.fillStyle = "#667a73"; contexto.textAlign = "center";
  leituras.forEach((leitura, indice) => { if (indice % passoRotulo === 0 || indice === leituras.length - 1) contexto.fillText(leitura.horario, xDaLeitura(indice), altura - 14); });
  contexto.textAlign = "left";
}

function atualizarInterface() {
  atualizarRegra();
  atualizarLeituraAtual();
  atualizarEstatisticas();
  atualizarTabela();
  desenharGrafico();
}

function normalizarCampo(campo, minimo, maximo, padrao) {
  const valor = Math.min(maximo, Math.max(minimo, Number(campo.value) || padrao));
  campo.value = valor;
  atualizarInterface();
}

function alternarSimulacao() {
  simulacaoAtiva = !simulacaoAtiva;
  elementos.botaoSimulacao.textContent = simulacaoAtiva ? "⏸ Pausar" : "▶ Continuar";
  elementos.statusConexao.classList.toggle("online", simulacaoAtiva);
  elementos.statusConexao.classList.toggle("paused", !simulacaoAtiva);
  elementos.textoConexao.textContent = simulacaoAtiva ? "Simulação ativa" : "Simulação pausada";
  reiniciarTemporizador();
}

function reiniciarTemporizador() {
  clearInterval(temporizador);
  if (simulacaoAtiva) temporizador = setInterval(adicionarLeitura, INTERVALO_ATUALIZACAO);
}

function exportarCsv() {
  if (!leituras.length) return;
  const cabecalho = "Horário;Temperatura (°C);Umidade (%);Status do ventilador";
  const linhas = leituras.map((leitura) => [
    leitura.horario,
    leitura.temperatura.toFixed(1),
    leitura.umidade.toFixed(1),
    ventiladorDeveLigar(leitura) ? "Ligado" : "Desligado"
  ].join(";"));

  const arquivo = new Blob(["\ufeff" + [cabecalho, ...linhas].join("\n")], { type: "text/csv;charset=utf-8;" });
  const endereco = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = endereco;
  link.download = `leituras-cunicultura-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(endereco);
}

elementos.limiteTemperatura.addEventListener("focus", (evento) => evento.currentTarget.select());
elementos.limiteUmidade.addEventListener("focus", (evento) => evento.currentTarget.select());
elementos.limiteTemperatura.addEventListener("input", atualizarInterface);
elementos.limiteUmidade.addEventListener("input", atualizarInterface);
elementos.limiteTemperatura.addEventListener("blur", () => normalizarCampo(elementos.limiteTemperatura, 15, 45, 30));
elementos.limiteUmidade.addEventListener("blur", () => normalizarCampo(elementos.limiteUmidade, 10, 100, 50));
document.getElementById("new-reading").addEventListener("click", adicionarLeitura);
elementos.botaoSimulacao.addEventListener("click", alternarSimulacao);
elementos.botaoLimpar.addEventListener("click", () => { leituras = []; atualizarInterface(); });
elementos.botaoExportar.addEventListener("click", exportarCsv);
window.addEventListener("resize", desenharGrafico);

atualizarInterface();
reiniciarTemporizador();
