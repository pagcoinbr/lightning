
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const lightning = require('../index');
const config = require('../config/brln-elements-config');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração Lightning + Elements
let elementsClient = null;
let lndClient = null;

// Inicializar clientes
async function initializeClients() {
    try {
        // Elements Client
        const {elements: elementsConfig} = config.loadConfig();
        const {elements} = lightning.elementsRpc(elementsConfig);
        elementsClient = elements;
        console.log('✅ Elements client initialized');
        
        // LND Client (se disponível)
        const {lnd: lndConfig} = config.loadConfig();
        if (fs.existsSync(lndConfig.cert) && fs.existsSync(lndConfig.macaroon)) {
            const {lnd} = lightning.authenticatedLndGrpc({
                cert: fs.readFileSync(lndConfig.cert),
                macaroon: fs.readFileSync(lndConfig.macaroon),
                socket: lndConfig.socket
            });
            lndClient = lnd;
            console.log('✅ LND client initialized');
        }
    } catch (error) {
        console.error('❌ Error initializing clients:', error.message);
    }
}

// === ENDPOINTS PARA COMPATIBILIDADE COM SEU FRONTEND ===

// Status do sistema (compatível com seu frontend)
app.get('/status', (req, res) => {
    exec('free -h && top -bn1 | grep "Cpu(s)" && docker ps --format "table {{.Names}}\\t{{.Status}}"', 
        (error, stdout, stderr) => {
            if (error) {
                return res.status(500).text('Erro ao obter status');
            }
            
            const lines = stdout.split('\n');
            let status = {
                cpu: 'CPU: N/A',
                ram: 'RAM: N/A', 
                lnd: 'LND: Verificando...',
                bitcoind: 'Bitcoind: Verificando...',
                elements: 'Elements: Verificando...',
                tor: 'Tor: Verificando...'
            };
            
            // Parse system info
            lines.forEach(line => {
                if (line.includes('Cpu(s)')) {
                    status.cpu = `CPU: ${line.match(/(\d+\.\d+)%/)?.[1] || 'N/A'}%`;
                }
                if (line.includes('Mem:')) {
                    status.ram = `RAM: ${line}`;
                }
                // Parse docker containers
                if (line.includes('lnd')) {
                    status.lnd = line.includes('Up') ? 'LND: Online' : 'LND: Offline';
                }
                if (line.includes('bitcoin')) {
                    status.bitcoind = line.includes('Up') ? 'Bitcoind: Online' : 'Bitcoind: Offline';
                }
                if (line.includes('elements')) {
                    status.elements = line.includes('Up') ? 'Elements: Online' : 'Elements: Offline';
                }
                if (line.includes('tor')) {
                    status.tor = line.includes('Up') ? 'Tor: Online' : 'Tor: Offline';
                }
            });
            
            // Format response compatível com seu frontend
            const response = [
                status.cpu,
                status.ram,
                status.lnd,
                status.bitcoind, 
                status.elements,
                status.tor,
                'Blockchain: Synced'
            ].join('\n');
            
            res.type('text/plain').send(response);
        }
    );
});

// Saldos das carteiras
app.get('/balances', async (req, res) => {
    try {
        const balances = {
            bitcoin: 0,
            lightning: 0,
            liquid: 0,
            assets: []
        };
        
        // Bitcoin + Lightning via LND
        if (lndClient) {
            try {
                const chainBalance = await lightning.getChainBalance({lnd: lndClient});
                balances.bitcoin = chainBalance.chain_balance || 0;
                
                const channelBalance = await lightning.getChannelBalance({lnd: lndClient});
                balances.lightning = channelBalance.channel_balance || 0;
            } catch (error) {
                console.log('LND balance error:', error.message);
            }
        }
        
        // Liquid via Elements
        if (elementsClient) {
            try {
                const liquidBalance = await lightning.getElementsBalance({
                    elements: elementsClient
                });
                balances.liquid = liquidBalance.balance || 0;
                
                const assets = await lightning.getLiquidAssets({
                    elements: elementsClient
                });
                balances.assets = assets.assets || [];
            } catch (error) {
                console.log('Elements balance error:', error.message);
            }
        }
        
        res.json(balances);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// Criar endereços
app.post('/address', async (req, res) => {
    try {
        const {network, type} = req.body; // network: bitcoin, lightning, liquid
        
        let address = null;
        
        if (network === 'bitcoin' && lndClient) {
            const result = await lightning.createChainAddress({
                lnd: lndClient,
                format: type || 'p2wpkh'
            });
            address = result.address;
        } else if (network === 'liquid' && elementsClient) {
            const result = await lightning.createElementsAddress({
                elements: elementsClient,
                format: type || 'bech32'
            });
            address = result.address;
        }
        
        res.json({address, network, type});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// Enviar transações
app.post('/send', async (req, res) => {
    try {
        const {network, address, amount, asset} = req.body;
        
        let result = null;
        
        if (network === 'bitcoin' && lndClient) {
            result = await lightning.sendToChainAddress({
                lnd: lndClient,
                address,
                tokens: parseInt(amount)
            });
        } else if (network === 'liquid' && elementsClient) {
            result = await lightning.sendToElementsAddress({
                elements: elementsClient,
                address,
                tokens: parseInt(amount),
                asset: asset || 'bitcoin'
            });
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// Info dos clientes
app.get('/info', async (req, res) => {
    try {
        const info = {
            lnd: null,
            elements: null
        };
        
        if (lndClient) {
            info.lnd = await lightning.getWalletInfo({lnd: lndClient});
        }
        
        if (elementsClient) {
            info.elements = await lightning.getElementsInfo({elements: elementsClient});
        }
        
        res.json(info);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// Controle de containers (compatível com seu frontend)
app.post('/container/:action/:name', (req, res) => {
    const {action, name} = req.params; // action: start, stop, restart
    
    const command = `docker ${action} ${name}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({error: error.message});
        }
        res.json({success: true, output: stdout});
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        clients: {
            elements: !!elementsClient,
            lnd: !!lndClient
        }
    });
});

// Inicializar servidor
async function startServer() {
    await initializeClients();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 BRLN-OS Lightning+Elements Server running on port ${PORT}`);
        console.log(`📡 Frontend can access: http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);
