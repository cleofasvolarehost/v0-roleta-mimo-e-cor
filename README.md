# 🎯 Roleta da Sorte - Mimo e Cor

Sistema de roleta com sorteio de prêmio único para campanhas promocionais.

## 🎁 Funcionalidades

### Para Participantes
- ✅ Cadastro simples com apenas o nome
- ✅ Uma tentativa por pessoa
- ✅ Visualização do ganhador
- ✅ Interface responsiva e animada

### Para Administradores
- ✅ Login seguro (usuário: `superadmin`, senha: `malucobeleza`)
- ✅ Ativar campanha por 1 hora
- ✅ Desativar campanha manualmente
- ✅ Ver todos os participantes em tempo real
- ✅ Identificar o ganhador automaticamente
- ✅ Estatísticas completas

## 🎲 Como Funciona

### Sistema de Sorteio
- **Apenas 1 ganhador** por campanha
- **Probabilidade**: ~1% de ganhar (ideal para 100 participantes)
- **Prêmio**: Vale Compra de R$ 50
- **Duração**: 1 hora após ativação pelo admin

### Regras
1. Cada pessoa pode girar apenas **uma vez**
2. A campanha deve estar **ativa** para participar
3. Após 1 hora, a campanha **desativa automaticamente**
4. O ganhador é selecionado **aleatoriamente** durante os giros
5. Quando há um ganhador, ninguém mais pode ganhar naquela campanha

## 🚀 Usando o Sistema

### Como Participante

1. Acesse a página inicial
2. Clique em "Girar Agora"
3. Digite seu nome
4. Gire a roleta
5. Veja se você ganhou!

### Como Administrador

1. Acesse `/admin` ou clique em "Admin" no topo
2. Faça login:
   - **Usuário**: `superadmin`
   - **Senha**: `malucobeleza`
3. No painel admin:
   - Clique em **"Ativar (1 hora)"** para iniciar a campanha
   - Acompanhe os participantes em tempo real
   - Veja quando aparecer o ganhador
   - Clique em **"Desativar"** para encerrar manualmente (se necessário)

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **players**: Armazena os participantes
- **prizes**: Prêmios disponíveis (R$ 50)
- **spins**: Registros de cada giro (inclui `is_winner`)
- **campaigns**: Controle das campanhas (ativa/inativa, tempo, ganhador)
- **admins**: Credenciais de acesso admin

### Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Constraint único: uma tentativa por pessoa
- ✅ Validação de campanha ativa
- ✅ Senha admin com sessão segura
- ✅ Apenas 1 ganhador por campanha

## 🎨 Tecnologias

- **Next.js 15** (App Router)
- **React 19**
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS v4**
- **shadcn/ui**
- **TypeScript**

## 📝 Scripts SQL

Execute os scripts na ordem:

1. `scripts/001_create_tables.sql` - Cria tabelas básicas
2. `scripts/002_simplify_prizes.sql` - Simplifica para apenas R$ 50
3. `scripts/003_simplify_players_table.sql` - Remove campos desnecessários
4. `scripts/004_single_winner_system.sql` - Implementa sistema de ganhador único

## 🔐 Credenciais Admin

```
Usuário: superadmin
Senha: malucobeleza
```

⚠️ **Importante**: Altere essas credenciais em produção!

## 📱 Páginas

- `/` - Página inicial
- `/wheel` - Roleta (participar)
- `/ganhador` - Ver ganhador
- `/admin/login` - Login admin
- `/admin` - Painel admin

## 🎯 Fluxo Completo

1. Admin faz login em `/admin`
2. Admin clica em "Ativar (1 hora)"
3. Participantes acessam `/wheel`
4. Cada pessoa gira uma vez
5. Sistema sorteia 1 ganhador automaticamente
6. Ganhador aparece em `/ganhador` e no painel admin
7. Após 1 hora, campanha desativa automaticamente
8. Admin pode iniciar nova campanha

---

Desenvolvido para **Mimo e Cor** 💝
