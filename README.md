# 💰 Gestor Financeiro v1.0.0

Um sistema web completo, moderno e responsivo para controlo e planeamento financeiro pessoal ou empresarial. O projeto foi construído utilizando **React** e **Vite**, integrado nativamente com o ecossistema do **Supabase** para autenticação segura e persistência de dados em tempo real, além de contar com uma interface elegante estilizada via **Tailwind CSS**.

---

## 🚀 Funcionalidades Principais

* **🔒 Autenticação Robusta:** Registo de novos utilizadores com e-mail e palavra-passe, validação de segurança complexa, início de sessão seguro e fluxo completo de recuperação/redefinição de palavra-passe integrado com templates HTML no Supabase.
* **📊 Painel de Dashboard Geral:** Visualização dinâmica dos totais de Entradas (Receitas), Saídas (Despesas) e o Saldo do período selecionado através de cartões informativos.
* **🗓️ Filtro por Competência & Centro de Pesquisa:** Navegação fácil entre meses e anos, além de um sistema de filtragem avançado por descrição, categorias e status de pagamento.
* **💼 CRUD de Transações:** Registo, edição, listagem e exclusão de movimentações com suporte a máscaras monetárias padrão `pt-BR`, diferenciação de tipos (Entrada/Saída), anexação opcional de dados de pagamento (Pix, Conta, Banco) e datas de vencimento.
* **⚠️ Painel Inteligente de Alertas:** Identificação automática de contas em atraso ou próximas da data de vencimento com mudança de cor dinâmica com base no status (Vencida ou Em Aberto).
* **🎯 Controlo de Orçamentos e Metas:** Definição de limites de gastos mensais por categorias específicas e acompanhamento do progresso através de barras visuais com alertas de teto máximo atingido.
* **📄 Exportação de Relatórios:** Geração instantânea e download de relatórios estruturados em formato PDF recorrendo ao `jsPDF` e `jspdf-autotable`.
* **🌓 Suporte a Dark Mode:** Interface totalmente adaptada tanto para o tema claro como para o tema escuro.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** [React.js](https://react.dev/) + [Vite](https://vite.dev/) (Build super rápido e Hot Module Replacement)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Utilitários modernos de CSS e suporte nativo a dark mode)
* **Base de Dados & Auth:** [Supabase](https://supabase.com/) (PostgreSQL na nuvem e GoTrue Auth)
* **Ícones:** [Lucide React](https://lucide.dev/) (Conjunto de ícones minimalistas e consistentes)
* **Notificações:** [React Hot Toast](https://react-hot-toast.com/) (Alertas visuais flutuantes em tempo real)
* **Relatórios:** [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) & [jspdf-autotable](https://github.com/simonbengtsson/jspdf-autotable)

---

## 📂 Estrutura de Pastas e Componentes

A arquitetura do projeto encontra-se modularizada da seguinte forma:

```text
src/
├── components/
│   ├── AlertsPanel.jsx        # Gestão e exibição de alertas de vencimento
│   ├── AuthRecovery.jsx       # Interface para redefinição de palavra-passe
│   ├── BudgetPanel.jsx        # Painel de controlo de orçamentos e metas mensais
│   ├── CompetenceBar.jsx      # Barra de navegação cronológica (mês/ano)
│   ├── DashboardView.jsx      # Visão geral com gráficos e resumos consolidados
│   ├── DeleteModal.jsx        # Janela modal de confirmação de exclusão
│   ├── FilterCenter.jsx       # Central de filtros e buscas de transações
│   ├── Sidebar.jsx            # Menu de navegação lateral interno do sistema
│   ├── SummaryCards.jsx       # Blocos de visualização de Saldo/Entradas/Saídas
│   ├── TransactionModal.jsx   # Formulação de criação e edição de lançamentos
│   └── TransactionTable.jsx   # Listagem paginada e interativa de transações
├── utils/
│   └── AuthHelpers.js         # Validações nativas de strings e utilitários de Auth
├── App.jsx                    # Core do projeto, controlo de estados e roteamento básico
├── main.jsx                   # Ponto de entrada do React e inicialização do DOM
├── index.css                  # Diretivas globais do Tailwind e variáveis de tema
└── supabaseClient.js          # Configuração e inicialização do cliente Supabase