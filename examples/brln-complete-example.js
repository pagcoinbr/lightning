#!/usr/bin/env node

const lightning = require('../index');
const config = require('../config/brln-elements-config');
const fs = require('fs');

async function runCompleteIntegration() {
  console.log('🚀 BRLN-OS Integration Example');
  console.log('================================\n');
  
  try {
    // Carregar configurações
    const {elements: elementsConfig, lnd: lndConfig} = config.loadConfig();
    
    // 1. Conectar ao Elements Core
    console.log('🔗 Conectando ao Elements Core...');
    const {elements} = lightning.elementsRpc(elementsConfig);
    
    const elementsInfo = await lightning.getElementsInfo({elements});
    console.log('✅ Elements conectado:', elementsInfo.chain);
    
    // 2. Conectar ao LND (se disponível)
    console.log('\n⚡ Conectando ao LND...');
    try {
      if (fs.existsSync(lndConfig.cert) && fs.existsSync(lndConfig.macaroon)) {
        const {lnd} = lightning.authenticatedLndGrpc({
          cert: fs.readFileSync(lndConfig.cert),
          macaroon: fs.readFileSync(lndConfig.macaroon),
          socket: lndConfig.socket
        });
        
        const lndInfo = await lightning.getWalletInfo({lnd});
        console.log('✅ LND conectado:', lndInfo.alias || 'No alias');
        
        // Demonstrar interoperabilidade
        console.log('\n🔄 Demonstrando interoperabilidade...');
        
        // Balance Lightning
        const lnBalance = await lightning.getChannelBalance({lnd});
        console.log(`💰 Lightning Balance: ${lnBalance.channel_balance} satoshis`);
        
        // Balance On-chain Bitcoin (via LND)
        const btcBalance = await lightning.getChainBalance({lnd});
        console.log(`₿ Bitcoin Balance: ${btcBalance.chain_balance} satoshis`);
        
      } else {
        console.log('⚠️ LND certificados não encontrados, pulando conexão LND');
      }
    } catch (lndError) {
      console.log('⚠️ LND não disponível:', lndError.message);
    }
    
    // 3. Verificar Liquid Assets
    console.log('\n💎 Verificando Liquid Assets...');
    const liquidBalance = await lightning.getElementsBalance({elements});
    console.log(`🌊 L-BTC Balance: ${liquidBalance.balance} L-BTC`);
    
    const assets = await lightning.getLiquidAssets({elements});
    console.log(`📊 Total Assets: ${assets.assets.length}`);
    
    // 4. Criar endereços
    console.log('\n🏠 Criando endereços...');
    
    const liquidAddress = await lightning.createElementsAddress({
      elements,
      label: 'brln-integration-test'
    });
    console.log(`🌊 Liquid Address: ${liquidAddress.address}`);
    
    console.log('\n🎉 Integração completa bem-sucedida!');
    console.log('\nBRLN-OS agora suporta:');
    console.log('• ⚡ Lightning Network (via LND)');
    console.log('• ₿ Bitcoin On-chain (via LND)');
    console.log('• 🌊 Liquid Network (via Elements)');
    console.log('• 💎 Liquid Assets');
    console.log('• 🔄 Interoperabilidade entre redes');
    
  } catch (error) {
    console.error('\n❌ Erro na integração:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runCompleteIntegration();
}

module.exports = runCompleteIntegration;
