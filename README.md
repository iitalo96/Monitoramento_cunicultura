Monitoramento de Cunicultura

Simulador acadêmico de monitoramento ambiental para cunicultura, desenvolvido com HTML, CSS e JavaScript. O painel apresenta temperatura, umidade do ar e o estado simulado de um ventilador, com critérios ajustáveis, estatísticas, gráfico e exportação de dados.

> Esta versão funciona inteiramente no navegador. As leituras são simuladas e o estado do ventilador é apenas visual: não há conexão com sensores, relés, microcontroladores, API ou broker MQTT.

## Funcionalidades

- Exibição da última temperatura, umidade e situação do ventilador.
- Configuração dos limites de acionamento diretamente na interface.
- Novas leituras automáticas a cada 5 segundos.
- Botões para pausar, continuar e gerar uma leitura manualmente.
- Máxima, mínima, média e mediana de cada variável.
- Gráfico de temperatura e umidade construído com Canvas.
- Histórico em memória com até 30 leituras e tabela com as 12 mais recentes.
- Exportação das leituras em CSV e limpeza do histórico.
- Interface responsiva, com adaptações para telas menores e redução de animações conforme a preferência do dispositivo.

## Tecnologias e arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura do painel, cartões, campos, botões, tabela e área do gráfico. |
| `style.css` | Cores, layout, responsividade e animações. |
| `monitor.js` | Simulação, regra do ventilador, estatísticas, gráfico e exportação. |
| `README.md` | Documentação do projeto. |

O projeto usa JavaScript puro e APIs nativas do navegador. Não exige framework, instalação de pacotes, Node.js ou compilação.

## Como executar

1. Baixe os arquivos do projeto.
2. Mantenha `index.html`, `style.css` e `monitor.js` na mesma pasta, com esses nomes.
3. Abra `index.html` em um navegador moderno com JavaScript habilitado.

A aplicação carrega cinco leituras demonstrativas e inicia a geração automática de dados. Os horários das cinco leituras iniciais são fixos; as novas leituras usam o horário local do navegador.

Depois de baixar os arquivos, o simulador pode funcionar sem internet. O código usa recursos como `Array.prototype.at()` e Canvas 2D, que precisam estar disponíveis no navegador.

## Como usar

| Controle | Comportamento |
| --- | --- |
| Temperatura mínima para ligar | Altera o limite de temperatura; padrão de 30 °C. |
| Umidade mínima para ligar | Altera o limite de umidade; padrão de 50%. |
| Pausar / Continuar | Interrompe ou retoma a geração automática. |
| Nova leitura | Adiciona uma leitura aleatória, inclusive com a simulação pausada. |
| Limpar tabela | Apaga todas as leituras em memória, incluindo os dados do gráfico e das estatísticas. |
| Exportar CSV | Baixa todas as leituras mantidas em memória. |

Os limites são aplicados durante a edição, sem botão de salvar. Ao sair do campo, a temperatura é ajustada para a faixa de 15 a 45 °C e a umidade para a faixa de 10 a 100%. Campos vazios usam os valores padrão no cálculo.

Limpar o histórico não pausa a simulação: novas leituras voltam a aparecer no próximo ciclo. Para manter o painel sem registros, pause antes de limpar.

## Regra de acionamento do ventilador

A versão documentada usa o operador lógico **E (`&&`)**. O ventilador aparece como ligado somente quando as duas condições são verdadeiras:

```javascript
function ventiladorDeveLigar(leitura) {
  const limites = limitesAtuais();
  return leitura.temperatura >= limites.temperatura && leitura.umidade >= limites.umidade;
}
```

Exemplos com os limites padrão de 30 °C e 50%:

| Temperatura | Umidade | Ventilador |
| --- | --- | --- |
| 29 °C | 45% | Desligado |
| 31 °C | 45% | Desligado |
| 29 °C | 60% | Desligado |
| 30 °C | 50% | Ligado |
| 31 °C | 60% | Ligado |

Quando pelo menos um dos valores fica abaixo do respectivo limite, o estado passa a desligado. Não há histerese nem tempo mínimo de funcionamento.

O texto “Ambiente dentro do critério” representa o resultado dessa regra de software. Os limites são parâmetros de demonstração, sem validação zootécnica implementada.

### Possível alteração para a regra OU

Se o objetivo for ligar ao atingir **qualquer um** dos limites, a condição deve usar `||`:

```javascript
return leitura.temperatura >= limites.temperatura || leitura.umidade >= limites.umidade;
```

Essa alteração não está aplicada nos arquivos documentados. Para implementá-la de forma consistente, também é necessário atualizar a descrição em `index.html`, a expressão em `atualizarRegra()` e as mensagens em `atualizarLeituraAtual()`.

## Dados, estatísticas e gráfico

Cada leitura contém os seguintes campos:

```javascript
{
  id: 1,
  horario: "19:44:35",
  temperatura: 27.4,
  umidade: 68.2
}
```

`criarLeitura()` gera temperaturas aproximadamente entre 18 e 37 °C e umidades entre 35 e 90%, arredondadas para uma casa decimal. Os valores são aleatórios e independentes; não representam medições ambientais.

Ao ultrapassar 30 registros, a leitura mais antiga é removida. As estatísticas e o gráfico usam todos os registros ainda mantidos em memória. A tabela mostra apenas os 12 mais recentes, do mais novo para o mais antigo.

A média é a soma dos valores dividida pela quantidade de registros. A mediana é o valor central após a ordenação; quando há uma quantidade par de registros, usa-se a média dos dois valores centrais.

O gráfico apresenta temperatura em laranja e umidade em azul, compartilhando uma escala numérica de 0 a 100, embora sejam grandezas com unidades diferentes. As leituras são igualmente espaçadas no eixo horizontal; a distância entre pontos não representa necessariamente o tempo transcorrido.

### Persistência e recálculo

Os dados ficam somente na variável `leituras`. Recarregar ou fechar a página perde o histórico da sessão; ao abrir novamente, o código restaura as cinco amostras iniciais. Não há banco de dados ou `localStorage`.

O estado do ventilador não é armazenado em cada leitura. Ele é recalculado usando os limites atuais, tanto na tabela quanto na exportação. Por isso, mudar os limites pode alterar o estado exibido para registros antigos.

## Exportação CSV

O botão **Exportar CSV** gera um arquivo com nome no formato `leituras-cunicultura-AAAA-MM-DD.csv` e as colunas:

```text
Horário;Temperatura (°C);Umidade (%);Status do ventilador
```

- Inclui até 30 registros, em ordem do mais antigo para o mais novo.
- Usa ponto e vírgula como separador e ponto como separador decimal.
- Usa UTF-8 com BOM para facilitar a identificação dos caracteres acentuados.
- A data do nome do arquivo é calculada em UTC; os horários das novas leituras são locais.
- O botão fica desabilitado quando não existem registros.

Se uma planilha abrir tudo em uma única coluna, importe o arquivo selecionando ponto e vírgula como delimitador e confira o reconhecimento dos números decimais.

## Organização do JavaScript

| Função | Finalidade |
| --- | --- |
| `limitesAtuais()` | Obtém os limites informados, com valores padrão para entradas vazias ou inválidas. |
| `ventiladorDeveLigar()` | Avalia a condição de acionamento. |
| `criarLeitura()` | Gera uma amostra simulada. |
| `adicionarLeitura()` | Insere a amostra e limita a quantidade de registros. |
| `calcularEstatisticas()` | Calcula máxima, mínima, média e mediana. |
| `atualizarInterface()` | Atualiza regra, cartões, estatísticas, tabela e gráfico. |
| `desenharGrafico()` | Desenha as séries no Canvas. |
| `normalizarCampo()` | Ajusta os limites ao sair dos campos de entrada. |
| `alternarSimulacao()` / `reiniciarTemporizador()` | Controlam a geração periódica. |
| `exportarCsv()` | Monta e baixa o arquivo de leituras. |

## Configuração no código

No início de `monitor.js`:

```javascript
const INTERVALO_ATUALIZACAO = 5000; // Milissegundos entre leituras
const MAXIMO_LEITURAS = 30;        // Quantidade máxima em memória
```

Ao modificar o intervalo, atualize também o texto de 5 segundos no rodapé de `index.html`. Para mudar a quantidade de linhas da tabela, ajuste `slice(0, 12)` em `atualizarTabela()`.

Para alterar os limites padrão, mantenha coerentes os valores dos campos e da expressão inicial em `index.html`, os padrões em `limitesAtuais()` e os parâmetros de `normalizarCampo()` nos eventos `blur`.

As cores principais ficam nas variáveis de `:root` em `style.css`. O layout tem adaptações nas larguras de 920 e 720 pixels.

## Limitações conhecidas

- Não realiza leitura de sensores nem aciona equipamentos físicos.
- Não possui backend, autenticação, comunicação MQTT ou armazenamento permanente.
- Não registra a data completa de cada amostra, somente seu horário.
- O estado histórico do ventilador depende dos limites atuais.
- Após limpar os registros, o título, a mensagem e a cor do resumo ambiental podem permanecer com o estado anterior até chegar uma nova leitura; os cartões numéricos e o status do ventilador são redefinidos.

## Verificação manual sugerida

1. Abra a página e confirme os cinco registros iniciais.
2. Aguarde um ciclo e confira a inclusão de uma nova leitura.
3. Pause e verifique que o contador para de aumentar automaticamente.
4. Clique em **Nova leitura** e confirme a inclusão mesmo com a simulação pausada.
5. Com a simulação pausada, ajuste os limites acima e abaixo dos valores atuais para conferir a regra E.
6. Exporte o CSV e confira suas quatro colunas e a quantidade de registros.
7. Limpe o histórico e confirme a remoção das linhas, pontos do gráfico e estatísticas.
8. Clique em **Continuar** e confira a retomada da geração automática.

Esses passos são um roteiro de verificação; esta documentação foi elaborada pela leitura dos três arquivos fornecidos, sem execução de testes de navegador.

## Evoluções possíveis

- Substituir os dados aleatórios por leituras recebidas de sensores.
- Implementar comunicação com uma API ou MQTT sobre WebSocket.
- Armazenar leituras, configurações e eventos de acionamento em banco de dados.
- Adicionar data completa, identificação do dispositivo e detecção de dados desatualizados.
- Definir e implementar histerese e comportamento diante de falhas antes de controlar equipamentos reais.

Esses itens são propostas futuras e não fazem parte da versão atual.

## Adicionar esta documentação ao GitHub

Coloque este `README.md` na pasta do projeto, substituindo o README vazio, se ainda for o arquivo existente. No PowerShell, dentro da pasta do repositório, execute:

```powershell
git add README.md
git commit -m "Adiciona documentacao do monitoramento de cunicultura"
git push -u origin index
```

O comando considera a branch `index`, utilizada neste repositório. Ele envia o commit ao GitHub; não publica automaticamente uma página web.
