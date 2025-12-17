# Problema de Isolamento por Tenant - RESOLVIDO

## Problema Identificado
Quando um telefone era cadastrado no projeto Wordnet, o mesmo telefone não podia ser usado no projeto Mimo e Cor, mesmo sendo projetos completamente separados.

## Causa Raiz
O campo `phone` na tabela `players` tinha um constraint único **GLOBAL**:
```sql
CREATE UNIQUE INDEX players_phone_key ON players(phone);
```

Isso impedia que o mesmo telefone existisse em múltiplos tenants.

## Solução Implementada
Removemos o constraint global e criamos um constraint único **POR TENANT**:
```sql
CREATE UNIQUE INDEX players_phone_tenant_key 
  ON players(tenant_id, phone);
```

## Resultado
Agora o isolamento está completo:
- ✅ Mimo e Cor (tenant: `e6bf97e8-d59c-4d34-be02-e61912a5e4c8`) pode usar qualquer telefone
- ✅ Wordnet (tenant: `bbb96177-5010-4517-98da-be1bb53c3c1a`) pode usar os MESMOS telefones
- ✅ Dentro de cada tenant, o telefone permanece único (sem duplicatas)

## Verificação
Você pode testar cadastrando o mesmo telefone em ambos os projetos - agora funciona!

## Scripts Atualizados
- `scripts/008_add_phone_field.sql` - Corrigido para usar constraint por tenant
- `scripts/011_fix_phone_tenant_isolation.sql` - Novo script com a correção aplicada
</parameter>
