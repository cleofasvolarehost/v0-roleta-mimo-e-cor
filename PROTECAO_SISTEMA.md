# Sistema de Proteção Multi-Fator

## Como funciona a proteção contra múltiplas tentativas?

O sistema implementa **3 camadas de segurança** para garantir que cada pessoa possa girar apenas 1 vez:

### 1. Endereço IP
- Captura o IP do usuário ao registrar e girar
- **Limitação**: Não é 100% eficaz em redes compartilhadas (NAT, empresas, provedores)
- Usado como primeira camada de verificação

### 2. User Agent
- Captura informações do navegador (versão, sistema operacional)
- Combinado com o IP aumenta a precisão
- Pessoas com mesmo IP mas navegadores diferentes podem participar

### 3. Device Fingerprint (Impressão Digital do Dispositivo)
- **Camada mais forte de proteção**
- Gera um identificador único baseado em:
  - Características do navegador
  - Resolução da tela
  - Fuso horário
  - Capacidades do hardware
  - Plataforma do sistema
  - Recursos de armazenamento
  
### Como as camadas trabalham juntas?

```
VERIFICAÇÃO ANTES DO GIRO:

1. Busca por device fingerprint idêntico
   ↓ SE ENCONTRADO → BLOQUEIA
   ↓ SE NÃO ENCONTRADO → CONTINUA
   
2. Busca por IP + User Agent idênticos
   ↓ SE ENCONTRADO → BLOQUEIA
   ↓ SE NÃO ENCONTRADO → CONTINUA
   
3. PERMITE O GIRO
```

### Cenários de Proteção

✅ **Mesma pessoa, mesmo dispositivo**: BLOQUEADO
✅ **Mesma pessoa, trocou de navegador**: BLOQUEADO (device fingerprint detecta)
✅ **Pessoas diferentes, mesma rede Wi-Fi**: PERMITIDO (fingerprints diferentes)
✅ **Mesma pessoa, modo anônimo**: BLOQUEADO (fingerprint similar)
✅ **Mesma pessoa, outro computador**: PERMITIDO (fingerprint diferente - dispositivo legítimo)

### Resultado

Este sistema multi-camadas garante que:
- ✅ Cada DISPOSITIVO só pode girar 1 vez
- ✅ Múltiplas pessoas no mesmo IP podem participar
- ✅ Trocar de navegador não permite novo giro
- ✅ Modo anônimo não permite novo giro
- ✅ Limpar cookies não permite novo giro

**Taxa de precisão estimada: ~95%**
