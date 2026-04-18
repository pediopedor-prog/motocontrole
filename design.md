# MotoControle - Design do Aplicativo

## Paleta de Cores
- **Primary**: #1B5E20 (Verde escuro - representa dinheiro/financeiro)
- **Accent**: #4CAF50 (Verde médio - botões e destaques)
- **Background Light**: #F5F7FA
- **Background Dark**: #121212
- **Surface Light**: #FFFFFF
- **Surface Dark**: #1E1E1E
- **Foreground Light**: #1A1A1A
- **Foreground Dark**: #F0F0F0
- **Muted Light**: #6B7280
- **Muted Dark**: #9CA3AF
- **Error**: #EF4444 / #F87171
- **Warning**: #F59E0B / #FBBF24
- **Success**: #22C55E / #4ADE80

## Telas do Aplicativo

### 1. Dashboard (Tela Inicial)
Cards/blocos em grid 2 colunas mostrando indicadores financeiros. Cada bloco tem ícone, título e valor. Blocos podem ser ativados/desativados nas configurações. Gráfico de barras semanal na parte inferior. Alerta de meta quando abaixo do esperado.

### 2. Moto - Lançamento
Formulário com seleção de app (iFood, 99, Uber Eats, Rappi, Lalamove, Loggi), campo de valor ganho, campo de KM rodado, seletor de data. Lista dos últimos lançamentos abaixo do formulário com opção de editar/excluir.

### 3. Moto - Média
Cards com médias calculadas: Média de KM/dia, Média de ganho/dia, Média de lucro/dia, Custo médio por KM. Filtros por período (dia, semana, mês). Gráfico de linha mostrando evolução. Acompanhamento semanal com progresso em barra.

### 4. Moto - Manutenção
Lista de itens de manutenção (Pneu traseiro, Pneu dianteiro, Óleo, Corrente, Pastilha de freio, etc.). Botão para adicionar nova manutenção com campos: item, KM, valor, local (opcional), data. Histórico de últimas trocas por item. Gráfico de barras de gastos com manutenção mês a mês.

### 5. Moto - Custo Real
Comparativo de ganhos vs gastos com a moto. Filtros por dia/mês/ano. Gráfico de barras comparativo. Cards com totais.

### 6. Moto - Previsão
Formulário para cadastrar itens de manutenção previstos no ano (pneu, óleo, aro, freio). Campos: item, valor unitário, quantidade de trocas no ano, KM estimado anual. Cálculo automático do custo por KM previsto.

### 7. Moto - Configurações
Editar custo por KM. Gerenciar lista de aplicativos (adicionar/remover). Gerenciar itens de manutenção. Configurações gerais do módulo Moto.

### 8. Financeiro - Visão Geral
4 cards: Ganhos, Gastos, Contas a Vencer, Contas Vencidas. Gráfico de ganhos vs gastos.

### 9. Financeiro - Lançamento
Formulário para lançar ganhos e gastos. Categorias editáveis. Suporte a contas parceladas (calcula e distribui nos meses seguintes). Lista de últimos lançamentos com editar/excluir.

### 10. Financeiro - Relatório
Pesquisa avançada por período (dia, semana, mês, ano). Filtros por tipo (ganhos, gastos, contas a vencer). Gráfico dinâmico baseado na pesquisa.

### 11. Financeiro - Gráfico
Gráfico de pizza de ganhos por fonte (apps + renda extra). Gráfico de pizza de gastos (incluindo manutenção da moto).

### 12. Investimento
Formulário para registrar aportes. Campo de porcentagem de rendimento editável. Histórico de aportes. Opção de sacar/diminuir valor. Gráfico de linha de crescimento mês a mês com rendimentos somados.

### 13. Renda Extra
Formulário simples para registrar rendas extras (nome, valor, data). Lista de rendas extras. Gráfico de pizza separando cada fonte de renda extra.

## Fluxos Principais

### Fluxo de Lançamento Moto
Usuário abre Moto > Lançamento > Seleciona app > Informa valor e KM > Salva > Dados refletem no Dashboard e Média.

### Fluxo de Manutenção
Usuário abre Moto > Manutenção > Adiciona manutenção > Informa item, KM, valor, local > Salva > Gasto aparece automaticamente no Financeiro.

### Fluxo Financeiro
Usuário abre Financeiro > Lançamento > Escolhe ganho ou gasto > Informa categoria, valor, data > Se parcelado, distribui nos meses > Salva.

### Fluxo de Meta
Sistema calcula contas da semana > Divide pelos dias restantes > Mostra meta diária no Dashboard > Alerta se abaixo da meta.

## Navegação
Bottom tabs com 5 itens: Dashboard, Moto, Financeiro, Investimento, Renda Extra. Dentro de Moto e Financeiro, navegação por sub-telas via stack navigation com header.
