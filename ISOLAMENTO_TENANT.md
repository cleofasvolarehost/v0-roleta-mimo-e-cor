# Isolamento de Dados por Tenant

## O que foi implementado

Este sistema agora tem **isolamento completo de dados** entre projetos que compartilham o mesmo banco de dados Supabase.

## Como funciona

### Tenants cadastrados no banco

1. **Mimo e Cor** - ID: `e6bf97e8-d59c-4d34-be02-e61912a5e4c8`
2. **Wordnet Tecnologia** - ID: `bbb96177-5010-4517-98da-be1bb53c3c1a`

### Isolamento implementado

Todas as operações agora filtram por `tenant_id`:

- **Cadastro de jogadores** - Apenas jogadores da Mimo e Cor
- **Campanhas** - Apenas campanhas da Mimo e Cor
- **Giros** - Apenas giros da Mimo e Cor
- **Prêmios** - Apenas prêmios da Mimo e Cor
- **Estatísticas** - Apenas dados da Mimo e Cor

### Arquivo de configuração

O arquivo `lib/config.ts` contém o `TENANT_ID` da Mimo e Cor que é usado em todas as queries.

### Garantias

- Dados da Mimo e Cor **nunca** aparecem na Wordnet
- Dados da Wordnet **nunca** aparecem na Mimo e Cor
- Cada projeto funciona de forma completamente independente
- Ativar/desativar campanha em um projeto não afeta o outro
- Participantes são isolados por projeto

### Segurança

Todos os filtros foram adicionados em:
- Inserções (`INSERT`) - Inclui tenant_id automaticamente
- Consultas (`SELECT`) - Filtra por tenant_id
- Atualizações (`UPDATE`) - Filtra por tenant_id
- Exclusões (`DELETE`) - Filtra por tenant_id

## Testado e funcionando

O sistema foi testado e está funcionando corretamente com isolamento total de dados entre projetos.
