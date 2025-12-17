# Novas Funcionalidades - Sistema de Roleta Mimo e Cor

## 1. Exportação de Participantes em CSV

### Descrição
Permite exportar todos os participantes de uma campanha em formato CSV para uso em campanhas de marketing futuras.

### Como usar
1. Acesse o painel admin
2. Na seção "Marketing e Exportação" (card azul), clique em "Exportar CSV"
3. O arquivo será baixado automaticamente com o nome: `participantes_mimo_cor_AAAA-MM-DD.csv`

### Formato do CSV
```
Nome,Telefone,Data/Hora,Ganhou
"João Silva","(11) 98765-4321","17/12/2024 21:30","Não"
"Maria Santos","(11) 97654-3210","17/12/2024 21:35","Sim"
```

### Campos incluídos
- **Nome**: Nome completo do participante
- **Telefone**: Telefone formatado
- **Data/Hora**: Quando participou (formato brasileiro)
- **Ganhou**: Se foi o ganhador ou não

---

## 2. Limpeza Automática ao Desativar Campanha

### Descrição
Ao desativar uma campanha, o sistema pergunta se você deseja limpar automaticamente os participantes da lista.

### Como funciona
1. Clique em "Desativar" no painel admin
2. Uma mensagem aparece perguntando:
   ```
   Deseja limpar os participantes ao desativar a campanha?
   
   ✅ SIM - Remove todos os participantes da lista
   ❌ NÃO - Mantém os participantes no banco
   ```
3. Escolha sua opção:
   - **SIM**: Campanha é desativada E participantes são removidos
   - **NÃO**: Apenas a campanha é desativada, participantes permanecem

### Quando usar cada opção

**Escolha SIM (limpar) quando:**
- Já exportou o CSV para marketing
- Quer começar uma nova campanha "do zero"
- Não precisa mais dos dados dos participantes

**Escolha NÃO (manter) quando:**
- Ainda não exportou o CSV
- Quer revisar os dados antes de apagar
- Precisa dos dados para relatórios futuros

---

## Fluxo Recomendado

### Fim de uma campanha:
1. **Sortear ganhador** (se ainda não houver)
2. **Exportar CSV** dos participantes para marketing
3. **Desativar campanha** escolhendo limpar participantes
4. **Nova campanha** começa com banco limpo

### Importante
- Sempre exporte o CSV ANTES de limpar os participantes!
- A limpeza de participantes não pode ser desfeita
- O CSV pode ser importado para qualquer ferramenta de email marketing

---

## Benefícios

✅ **Dados para marketing**: Use telefone e nome para WhatsApp marketing
✅ **Banco organizado**: Não acumula participantes antigos
✅ **Novas campanhas limpas**: Cada campanha começa zerada
✅ **Flexibilidade**: Você escolhe quando limpar
✅ **Segurança**: Confirmação dupla antes de deletar
