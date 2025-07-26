# BRLN-OS Lightning + Elements Integration

Esta é uma extensão do projeto [Lightning](https://github.com/alexbosworth/lightning) do Alex Bosworth que adiciona suporte completo ao Elements Core (Liquid Network), criando uma integração simbiótica com o BRLN-OS.

## 🌟 Funcionalidades Adicionadas

### Elements/Liquid Support
- ✅ Conexão RPC com Elements Core
- ✅ Operações básicas da Liquid Network
- ✅ Gestão de L-BTC e Liquid Assets
- ✅ Transações confidenciais
- ✅ Operações de Peg-in/Peg-out
- ✅ Compatibilidade com BRLN-OS Docker setup

### Métodos Disponíveis

#### Elements RPC Client
```javascript
const {elementsRpc} = require('lightning');
const {elements} = elementsRpc({
  host: 'localhost',
  port: 7041,
  user: 'test', 
  password: 'test'
});
```

#### Elements Methods
```javascript
const lightning = require('lightning');

// Informações da blockchain
const info = await lightning.getElementsInfo({elements});

// Saldo L-BTC
const balance = await lightning.getElementsBalance({elements});

// Criar endereço
const address = await lightning.createElementsAddress({elements});

// Enviar L-BTC
const tx = await lightning.sendToElementsAddress({
  elements,
  address: 'lq1...',
  tokens: 100000 // satoshis
});

// Listar assets
const assets = await lightning.getLiquidAssets({elements});
```

## 🚀 Uso Rápido

### 1. Teste Básico
```bash
npm run brln_test
```

### 2. Teste Elements
```bash  
npm run brln_elements
```

### 3. Monitorar Assets
```bash
npm run brln_monitor
```

### 4. Programaticamente
```javascript
const lightning = require('lightning');
const {loadConfig} = require('./config/brln-elements-config');

async function example() {
  const {elements: config} = loadConfig();
  const {elements} = lightning.elementsRpc(config);
  
  // Use qualquer método Elements
  const info = await lightning.getElementsInfo({elements});
  console.log(info);
}
```

## ⚙️ Configuração

O projeto usa as mesmas configurações do BRLN-OS:
- **Elements RPC**: localhost:7041 (mainnet) ou localhost:7040 (testnet)
- **Credenciais**: configuradas via docker-compose.yml do BRLN-OS
- **LND**: mantém compatibilidade total com funcionalidade original

## 🔗 Integração com BRLN-OS

Esta extensão é totalmente compatível com:
- ✅ Bitcoin Core (via LND)
- ✅ Lightning Network (funcionalidade original)
- ✅ Elements Core (nova funcionalidade)
- ✅ Docker containers do BRLN-OS
- ✅ Configurações de rede (mainnet/testnet)

## 📚 Métodos Elements Disponíveis

| Método | Descrição |
|--------|-----------|
| `elementsRpc()` | Criar cliente RPC Elements |
| `getElementsInfo()` | Informações da blockchain Liquid |
| `getElementsBalance()` | Saldo L-BTC ou asset específico |
| `createElementsAddress()` | Criar novo endereço Liquid |
| `sendToElementsAddress()` | Enviar L-BTC/assets |
| `getLiquidAssets()` | Listar todos os assets |

## 🛠️ Desenvolvimento

Para adicionar novos métodos Elements:

1. Criar método em `elements_methods/`
2. Adicionar export em `elements_methods/index.js`
3. Importar e exportar em `index.js`
4. Atualizar documentação

## 🤝 Contribuições

Esta extensão mantém total compatibilidade com o projeto original do Alex Bosworth e adiciona funcionalidades Elements de forma não-invasiva.

**Repositório Original**: https://github.com/alexbosworth/lightning
**BRLN-OS**: https://github.com/pagcoinbr/brln-os
