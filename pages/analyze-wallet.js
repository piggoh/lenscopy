// analyze-wallet.js
import { fetchWalletData } from './data-fetcher.js';
import * as metrics from './metrics.js';

async function analyzeWallet(walletAddress) {
  try {
    console.log(`Fetching data for ${walletAddress}...`);
    const walletData = await fetchWalletData(walletAddress);
    
    console.log('Calculating metrics...');
    const results = {
      activity: metrics.calculateActivityMetrics(walletData),
      volatility: metrics.calculateVolatility(walletData),
      diversity: metrics.calculatePortfolioDiversity(walletData)
    };
    
    console.log('Analysis complete:');
    console.log(results);
    
    return results;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Run with your wallet address
analyzeWallet('your-wallet-address-here');