# MotoControle

Aplicativo mobile de **controle financeiro completo para motoboys** e entregadores de aplicativo. Desenvolvido com React Native e Expo, o MotoControle permite gerenciar ganhos por aplicativo, custos com a moto, manutenção, finanças pessoais, investimentos e rendas extras, tudo em um único lugar com dados armazenados localmente no dispositivo.

---

## Versões e Tecnologias

| Tecnologia | Versão |
|---|---|
| React Native | 0.81.5 |
| Expo SDK | 54 |
| Expo Router | 6.0.19 |
| React | 19.1.0 |
| TypeScript | 5.9.3 |
| NativeWind (Tailwind CSS) | 4.2.1 |
| Tailwind CSS | 3.4.17 |
| Node.js (recomendado) | 22.x |
| Gerenciador de pacotes | pnpm 9.12.0 |

---

## Funcionalidades

### Dashboard
Tela inicial com blocos personalizáveis mostrando indicadores financeiros em tempo real: saldo, lucro líquido, ganhos da semana e do mês, KM rodado, valor por KM, custos mensais e renda extra. Inclui gráfico de barras semanal e comparativo de ganhos vs gastos com barra de progresso visual. Sistema de alerta de meta semanal que calcula automaticamente quanto o motoboy precisa ganhar por dia para cobrir as contas.

### Moto (6 sub-telas)
- **Lançamento**: Registro de ganhos por aplicativo (iFood, 99Food, Uber Eats, Rappi, Lalamove, Loggi) com valor e KM rodado. Lista de últimos lançamentos com opção de exclusão.
- **Média**: Estatísticas calculadas automaticamente com filtro por semana/mês. Mostra ganho total, lucro líquido, KM total, valor por KM, média por dia, KM por dia, custo de manutenção. Gráfico de pizza por aplicativo e gráfico de barras semanal.
- **Manutenção**: Registro de trocas e reparos (pneu, óleo, corrente, pastilha de freio, etc.) com KM, valor, local e data. Exibe últimas trocas por item e gráfico de gastos mensais. Gastos de manutenção são automaticamente registrados no módulo Financeiro.
- **Custo Real**: Comparativo detalhado entre ganhos e custos reais da moto, incluindo custo por KM e manutenção, com filtro mensal/anual.
- **Previsão**: Cadastro de itens de manutenção previstos para o ano com cálculo automático do custo anual e custo por KM previsto.
- **Configurações**: Edição do custo por KM, gerenciamento da lista de aplicativos e itens de manutenção.

### Financeiro (4 sub-telas)
- **Visão Geral**: Cards com ganhos, gastos, contas a vencer e contas vencidas. Gráfico comparativo e listagem de próximas contas.
- **Lançamento**: Formulário completo para registrar ganhos e gastos com categorias editáveis, suporte a contas fixas e parceladas (distribui automaticamente nos meses seguintes).
- **Relatório**: Pesquisa avançada por período (semana, mês, ano) com filtros por tipo (ganhos, gastos, todos). Gráfico comparativo dinâmico.
- **Gráfico**: Gráficos de pizza mostrando ganhos por fonte (apps + renda extra) e gastos por categoria.

### Investimento
Registro de aportes e resgates com percentual de rendimento editável. Gráfico de crescimento dos investimentos ao longo do tempo. Histórico completo de operações.

### Renda Extra
Registro de rendas extras com nome, valor e data. Gráfico de pizza separando cada fonte de renda extra. Totais mensais e gerais.

---

## Estrutura do Projeto

```
motocontrole-app/
├── app/                          # Telas do aplicativo (Expo Router)
│   ├── _layout.tsx               # Layout raiz com providers
│   └── (tabs)/                   # Navegação por abas
│       ├── _layout.tsx           # Configuração das 5 abas
│       ├── index.tsx             # Dashboard
│       ├── moto.tsx              # Moto (6 sub-telas)
│       ├── financeiro.tsx        # Financeiro (4 sub-telas)
│       ├── investimento.tsx      # Investimentos
│       └── renda-extra.tsx       # Renda Extra
├── components/                   # Componentes reutilizáveis
│   ├── screen-container.tsx      # Container com SafeArea
│   ├── haptic-tab.tsx            # Tab com feedback háptico
│   └── ui/
│       ├── card.tsx              # Cards e StatCards
│       ├── icon-symbol.tsx       # Mapeamento de ícones
│       └── simple-chart.tsx      # Gráficos (barras e pizza)
├── lib/                          # Lógica de negócio
│   ├── database.ts               # Banco de dados local (AsyncStorage)
│   ├── calculations.ts           # Cálculos financeiros
│   ├── data-context.tsx          # Context Provider global
│   ├── utils.ts                  # Utilitários (cn)
│   └── theme-provider.tsx        # Tema claro/escuro
├── hooks/                        # React Hooks
│   ├── use-colors.ts             # Cores do tema
│   └── use-color-scheme.ts       # Detecção claro/escuro
├── constants/
│   └── theme.ts                  # Paleta de cores
├── __tests__/                    # Testes unitários
│   └── calculations.test.ts      # 24 testes
├── assets/images/                # Ícones e splash screen
├── theme.config.js               # Configuração de cores (verde financeiro)
├── tailwind.config.js            # Configuração do Tailwind CSS
├── app.config.ts                 # Configuração do Expo
├── tsconfig.json                 # Configuração do TypeScript
├── package.json                  # Dependências
├── design.md                     # Documento de design
├── todo.md                       # Rastreamento de funcionalidades
└── vitest.config.ts              # Configuração de testes
```

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** versão 22.x ou superior — [nodejs.org](https://nodejs.org/)
2. **pnpm** versão 9.x — instale com `npm install -g pnpm@9`
3. **Expo CLI** — já incluído como dependência, mas pode instalar globalmente com `npm install -g expo-cli`
4. **Expo Go** (opcional) — aplicativo para testar no celular, disponível na App Store e Google Play

---

## Como Rodar Localmente

### 1. Instalar dependências

```bash
cd motocontrole-app
pnpm install
```

### 2. Iniciar o servidor de desenvolvimento

```bash
# Iniciar apenas o Metro Bundler (frontend mobile)
npx expo start

# Ou iniciar com preview web
npx expo start --web
```

### 3. Testar no dispositivo

Após iniciar o servidor, você verá um QR Code no terminal.

| Plataforma | Como testar |
|---|---|
| **iOS** | Abra a câmera do iPhone e escaneie o QR Code. O app abrirá no Expo Go. |
| **Android** | Abra o app Expo Go e escaneie o QR Code. |
| **Web** | Pressione `w` no terminal ou acesse `http://localhost:8081` no navegador. |

### 4. Rodar testes

```bash
pnpm test
```

Os 24 testes unitários cobrem todas as funções de cálculo financeiro, formatação de valores e datas, e lógica de filtragem por período.

---

## Como Compilar para Produção

### Compilar com EAS Build (recomendado)

O Expo Application Services (EAS) é a forma mais simples de gerar os binários para as lojas.

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Fazer login no Expo
eas login

# Compilar para Android (APK/AAB)
eas build --platform android

# Compilar para iOS (IPA)
eas build --platform ios

# Compilar para ambos
eas build --platform all
```

### Compilar localmente (sem EAS)

```bash
# Android - gerar APK
npx expo run:android --variant release

# iOS - gerar build (requer macOS com Xcode)
npx expo run:ios --configuration Release
```

> **Nota**: Para compilar para iOS, é necessário um Mac com Xcode instalado e uma conta Apple Developer. Para Android, o Android Studio deve estar configurado com o SDK adequado.

---

## Banco de Dados

O aplicativo utiliza **AsyncStorage** para persistência local. Todos os dados ficam armazenados no dispositivo do usuário, sem necessidade de internet ou servidor externo. Os dados persistem entre sessões e reinicializações do app.

| Coleção | Descrição |
|---|---|
| `moto_earnings` | Ganhos por aplicativo (valor, KM, app, data) |
| `maintenance` | Registros de manutenção da moto |
| `maintenance_forecast` | Previsões de manutenção anual |
| `financial_entries` | Lançamentos financeiros (ganhos/gastos/parcelas) |
| `investments` | Aportes e resgates de investimentos |
| `extra_income` | Registros de renda extra |
| `config` | Configurações do app (custo/KM, apps, itens) |

---

## Lista Completa de Dependências

### Dependências de Produção

| Pacote | Versão | Função |
|---|---|---|
| `expo` | ~54.0.29 | Framework mobile |
| `react` | 19.1.0 | Biblioteca UI |
| `react-native` | 0.81.5 | Runtime mobile |
| `expo-router` | ~6.0.19 | Navegação por rotas |
| `nativewind` | ^4.2.1 | Tailwind CSS para React Native |
| `@react-native-async-storage/async-storage` | ^2.2.0 | Banco de dados local |
| `@react-navigation/bottom-tabs` | ^7.8.12 | Navegação por abas |
| `react-native-gesture-handler` | ~2.28.0 | Gestos touch |
| `react-native-reanimated` | ~4.1.6 | Animações |
| `react-native-safe-area-context` | ~5.6.2 | SafeArea |
| `react-native-screens` | ~4.16.0 | Navegação nativa |
| `react-native-svg` | 15.12.1 | Gráficos SVG |
| `expo-haptics` | ~15.0.8 | Feedback háptico |
| `expo-status-bar` | ~3.0.9 | Barra de status |
| `@expo/vector-icons` | ^15.0.3 | Ícones |
| `clsx` | ^2.1.1 | Utilitário de classes |
| `tailwind-merge` | ^2.6.0 | Merge de classes Tailwind |
| `zod` | ^4.2.1 | Validação de schemas |

### Dependências de Desenvolvimento

| Pacote | Versão | Função |
|---|---|---|
| `typescript` | ~5.9.3 | Tipagem estática |
| `vitest` | ^2.1.9 | Framework de testes |
| `tailwindcss` | ^3.4.17 | Engine CSS |
| `eslint` | ^9.39.2 | Linting |
| `prettier` | ^3.7.4 | Formatação de código |

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia servidor + Metro Bundler |
| `pnpm dev:metro` | Inicia apenas o Metro Bundler |
| `pnpm test` | Roda os testes unitários |
| `pnpm check` | Verifica tipos TypeScript |
| `pnpm lint` | Verifica código com ESLint |
| `pnpm format` | Formata código com Prettier |
| `pnpm android` | Inicia no emulador Android |
| `pnpm ios` | Inicia no simulador iOS |

---

## Licença

Projeto desenvolvido sob encomenda. Todos os direitos reservados ao proprietário.
