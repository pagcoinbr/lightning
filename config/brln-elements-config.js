// Configuração para integração BRLN-OS + Elements + Lightning

const fs = require('fs');
const path = require('path');

// Configurações Elements Core (baseadas no docker-compose.yml do brln-os)
const elementsConfig = {
  host: process.env.ELEMENTS_HOST || 'localhost',
  port: process.env.ELEMENTS_PORT || 7041,  // Porta mainnet
  user: process.env.ELEMENTS_RPC_USER || 'test',
  password: process.env.ELEMENTS_RPC_PASSWORD || 'test',
  timeout: 30000
};

// Configurações LND (baseadas no docker-compose.yml do brln-os)
const lndConfig = {
  socket: process.env.LND_HOST || 'localhost:10009',
  cert: process.env.LND_TLS_CERT_PATH || '/data/lnd/tls.cert',
  macaroon: process.env.LND_MACAROON_PATH || '/data/lnd/data/chain/bitcoin/mainnet/admin.macaroon'
};

// Função para carregar configurações a partir de variáveis de ambiente ou arquivo
function loadConfig() {
  // Tentar carregar arquivo .env se existir
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key] = value.replace(/"/g, '');
      }
    });
  }
  
  return {
    elements: elementsConfig,
    lnd: lndConfig
  };
}

module.exports = {
  loadConfig,
  elementsConfig,
  lndConfig
};
