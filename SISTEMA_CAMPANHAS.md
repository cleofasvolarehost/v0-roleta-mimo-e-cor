# Sistema de Campanhas - Mimo e Cor

## Como Funciona

### Múltiplas Campanhas
O sistema permite que você realize várias campanhas ao longo do tempo. Cada campanha é independente:

- **Uma pessoa pode participar de várias campanhas diferentes**
- **Mas não pode girar duas vezes na MESMA campanha**

### Ciclo de uma Campanha

1. **Ativar Campanha** (Painel Admin)
   - Clique em "Ativar (1 hora)"
   - A campanha fica ativa por exatamente 1 hora
   - Todas as pessoas podem começar a girar

2. **Durante a Campanha** (1 hora)
   - Cada pessoa pode girar a roleta UMA VEZ
   - 2% de chance de ganhar ao girar (ideal para ~100 pessoas)
   - O primeiro que ganhar leva o prêmio de R$ 50

3. **Fim da Campanha**
   - Campanha expira automaticamente após 1 hora
   - Você pode sortear manualmente se ninguém ganhou automaticamente
   - Veja quem ganhou no painel admin (nome + telefone)
   - Ligue para o ganhador para avisar

4. **Limpar para Nova Campanha**
   - Clique em "Limpar Participantes" no painel admin
   - Remove todos os participantes da campanha atual
   - Sistema está pronto para uma nova campanha
   - As mesmas pessoas podem participar novamente!

### Proteção Anti-Fraude

O sistema usa 3 camadas de proteção **por campanha**:

1. **IP Address** - Endereço de internet
2. **User Agent** - Tipo de navegador e dispositivo
3. **Device Fingerprint** - Impressão digital única do navegador

Isso impede que alguém:
- Gire duas vezes mudando de nome
- Use modo anônimo para tentar de novo
- Limpe cookies para burlar o sistema

**MAS:** Essas proteções são **por campanha**. Quando você limpa os participantes e inicia uma nova campanha, todos podem participar novamente!

### Exemplo Prático

**Campanha 1 (Segunda-feira)**
- João participa e não ganha
- Maria participa e GANHA
- Pedro participa mas não ganha

**Campanha 2 (Sexta-feira)**
- Você limpa os participantes
- Ativa nova campanha
- João, Maria e Pedro podem participar de novo!
- Ana (nova pessoa) também pode participar
- Um novo ganhador será sorteado

## Dicas Importantes

- Sempre limpe os participantes antes de iniciar uma nova campanha
- Guarde o nome e telefone do ganhador antes de limpar
- Compartilhe o link `/ganhador` nas redes sociais após sortear
- Use o telefone do ganhador para entrar em contato
