# dashML ERP - Especializado para Mercado Livre 🚀

Bem-vindo ao **dashML**, um sistema ERP SaaS moderno, minimalista, rápido e responsivo, desenvolvido especificamente para vendedores do Mercado Livre.

Este projeto segue à risca os princípios de **Clean Architecture**, **Clean Code** e **SOLID**, fornecendo uma separação clara entre as regras de negócio puras (Core), os serviços de persistência e criptografia (Infrastructure) e a interface do usuário com rotas de API (Presentation).

---

## 🛠️ Stack Tecnológica

* **Frontend & Backend**: Next.js 16 (App Router) + React 19 + TypeScript
* **Estilização**: Tailwind CSS v4 (Tema Escuro Minimalista estilo Stripe/Linear)
* **Banco de Dados**: SQLite local em desenvolvimento (Prisma ORM), facilmente alternável para PostgreSQL em produção (Supabase)
* **Autenticação**: Cookies Seguros HttpOnly + JWT (com a biblioteca `jose` para validação no Edge/Middleware) + BcryptJS para criptografia de senhas
* **Ícones**: Lucide React

---

## 📐 Arquitetura do Projeto (Clean Architecture)

A estrutura de pastas do projeto foi projetada para desacoplar a lógica de negócio dos detalhes de infraestrutura:

```
src/
├── core/                         # Regras de Negócio Puras (Enterprise Business Rules)
│   ├── entities/                 # Entidades de Domínio (User, Sale, Product, etc.)
│   ├── use-cases/                # Casos de Uso da Aplicação (RegisterUser, LoginUser, etc.)
│   ├── repositories/             # Contratos (Interfaces) de Repositórios de Dados
│   └── services/                 # Contratos (Interfaces) de Serviços de Criptografia/Tokens
│
├── infrastructure/               # Detalhes e Ferramentas (Frameworks & Drivers)
│   ├── database/                 # Repositórios Concretos usando Prisma Client
│   └── services/                 # Implementações Concretas (BcryptHashService, JwtTokenService)
│
├── app/                          # Camada de Entrega (Presentation / Delivery Mechanism)
│   ├── (auth)/                   # Telas de Autenticação (/login, /register, /recover-password)
│   ├── (dashboard)/              # Telas administrativas protegidas (/dashboard e módulos)
│   ├── api/                      # Rotas HTTP REST que instanciam e chamam os Casos de Uso
│   ├── globals.css               # Estilos Globais e tokens do Design System
│   └── middleware.ts             # Interceptador de requisições que protege o Dashboard via JWT
│
├── components/                   # Componentes Visuais Reutilizáveis
│   ├── ui/                       # Componentes base de UI (Button, Input, Card)
│   └── shared/                   # Componentes compartilhados (Sidebar, Header, etc.)
│
├── lib/                          # Instanciações globais (Prisma Client singleton, cn)
```

---

## 💾 Modelagem do Banco de Dados (Tabelas Criadas)

No arquivo `prisma/schema.prisma` foram definidas todas as tabelas e relacionamentos necessários para as 15 etapas do ERP:

1. **`User`**: Usuários do sistema com níveis de acesso (`ADMIN`, `EMPLOYEE`, `FINANCE`, `VIEWER`).
2. **`MLIntegration`**: Chaves e tokens OAuth para autenticação automática da API do Mercado Livre.
3. **`Supplier`**: Cadastro de fornecedores de mercadorias.
4. **`Product`**: Detalhes do produto (SKU, código ML, custos de aquisição, preços de venda, estoque).
5. **`StockMovement`**: Registro detalhado de entradas, saídas e ajustes de inventário.
6. **`Customer`**: Cadastro de clientes unificados e métricas de compras.
7. **`Sale`**: Histórico de vendas com custos e taxas detalhadas (lucro bruto, líquido, margem e ROI).
8. **`Complaint`**: Gestão de reclamações do Mercado Livre e impacto financeiro.
9. **`Return`**: Gestão de devoluções e cancelamento de vendas.
10. **`Listing`**: Estatísticas de anúncios ativos (visitas, vendas e taxa de conversão).
11. **`FinancialRecord`**: Controle de despesas operacionais fixas e variáveis.
12. **`Notification`**: Alertas em tempo real do sistema.
13. **`SystemLog`**: Log de auditoria das ações realizadas pelos operadores.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
* Node.js v18 ou superior instalado.
* npm (gerenciador de pacotes).

### 2. Instalação das Dependências
No terminal, execute:
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
O arquivo `.env` já foi gerado na raiz. Ele contém:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key-dashml-erp-2026-dynamic-token"
```

### 4. Rodar o Servidor de Desenvolvimento
Inicie a aplicação local com:
```bash
npm run dev
```
Abra o navegador em [http://localhost:3000](http://localhost:3000).

---

## 🧪 Como Testar a Etapa 1 (Fluxo Completo de Autenticação)

Siga os passos abaixo para validar o funcionamento completo da Etapa 1:

1. **Acesso Inicial**: Abra o navegador em `http://localhost:3000`. Como você não está logado, o Middleware interceptará a requisição e o redirecionará automaticamente para a tela `/login`.
2. **Navegação de Proteção**: Tente digitar diretamente na barra de endereços `http://localhost:3000/dashboard`. Você será bloqueado e jogado de volta para `/login`, provando que a proteção de rotas JWT HttpOnly está ativa.
3. **Criar uma Conta**:
   * Clique em "Cadastre-se gratuitamente" na tela de login.
   * Preencha seu nome, e-mail (ex: `admin@dashml.com`) e crie uma senha forte (min. 6 caracteres).
   * Clique em **Criar Conta**.
   * O sistema registrará os dados no banco local SQLite, fará o hash da senha usando `bcryptjs` e mostrará uma notificação verde de sucesso, redirecionando você para a tela de login.
4. **Fazer Login**:
   * Insira o e-mail e a senha criados e clique em **Entrar**.
   * O servidor validará as credenciais, gerará o JWT e o salvará em um cookie `HttpOnly` seguro.
   * Você será redirecionado para a tela `/dashboard` protegida.
5. **Navegar pelo ERP**:
   * Uma vez no dashboard, você verá as estatísticas do sistema ativo e a estrutura de pastas descrita.
   * Use a **Sidebar** para navegar pelos demais módulos do menu. Todos possuem páginas placeholder modernas indicando em qual etapa serão desenvolvidos, sem quebrar a navegação (sem 404).
6. **Encerrar Sessão (Logout)**:
   * Clique em **Sair do ERP** no rodapé da Sidebar.
   * O cookie seguro será removido e você será redirecionado imediatamente para `/login`. Tentar voltar ao painel usando o botão "Voltar" do navegador não funcionará.
