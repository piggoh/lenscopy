import fetch from 'node-fetch';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Configuration - MUST UPDATE THESE
const CONFIG = {
  HELIUS_API_KEY: '77e76692-d441-4212-96ea-79b93c83a2ad', // REPLACE THIS
  WALLET_ADDRESS: '4y34oxREo5XJogMEb7B1kJJXYPBH8uYc9vu2fA8HxdFt', // Test address
  MAX_TRANSACTIONS: 100,
  BATCH_SIZE: 50,
  MONTHS_TO_ANALYZE: 3
};

const BASE_URL = 'https://api.helius.xyz/v0/';

async function fetchCompleteTransactionHistory(address) {
  let allTransactions = [];
  let beforeSignature = null;
  const threeMonthsAgo = Date.now() - (CONFIG.MONTHS_TO_ANALYZE * 30 * 24 * 60 * 60 * 1000);

  try {
    while (allTransactions.length < CONFIG.MAX_TRANSACTIONS) {
      const url = new URL(`${BASE_URL}addresses/${address}/transactions`);
      url.searchParams.append('api-key', CONFIG.HELIUS_API_KEY);
      url.searchParams.append('limit', CONFIG.BATCH_SIZE.toString());
      if (beforeSignature) url.searchParams.append('before', beforeSignature);

      console.log(`Fetching batch before ${beforeSignature || 'start'}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody}`);
      }

      const transactions = await response.json();
      if (transactions.length === 0) {
        console.log('Reached end of transaction history');
        break;
      }

      // Check if oldest tx is beyond our time window
      const oldestTx = transactions[transactions.length - 1];
      if (!oldestTx.timestamp || new Date(oldestTx.timestamp * 1000) < new Date(threeMonthsAgo)) {
        console.log('Reached 3-month cutoff');
        break;
      }

      allTransactions = [...allTransactions, ...transactions];
      beforeSignature = oldestTx.signature;
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return allTransactions;
  } catch (error) {
    console.error('Fetch Error:', error.message);
    return null;
  }
}

async function main() {
  try {
    // 1. Validate address
    new PublicKey(CONFIG.WALLET_ADDRESS);
    console.log('✅ Address is valid');

    // 2. Fetch transactions
    console.log('⏳ Fetching transactions...');
    const transactions = await fetchCompleteTransactionHistory(CONFIG.WALLET_ADDRESS);
    
    if (!transactions || transactions.length === 0) {
      throw new Error(`
        No transactions found. Possible reasons:
        1. Wrong API key
        2. New wallet with no history
        3. Address not on mainnet
        4. Helius API issues
      `);
    }

    // 3. Show sample data
    console.log('\n🎉 Success! Found', transactions.length, 'transactions');
    console.log('\nSample Transaction:');
    console.log('------------------');
    const sample = transactions[0];
    console.log({
      signature: sample.signature,
      date: sample.timestamp ? new Date(sample.timestamp * 1000).toISOString() : 'No timestamp',
      fee: (sample.fee || 0) / LAMPORTS_PER_SOL + ' SOL',
      type: sample.type || 'Unknown',
      description: sample.description || 'No description'
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nDebug Steps:');
    console.log('1. Verify address at https://explorer.solana.com/address/' + CONFIG.WALLET_ADDRESS);
    console.log('2. Check API key at https://dev.helius.xyz/dashboard');
    console.log('3. Try test address: vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg');
  }
}

main();

// import fetch from 'node-fetch';
// import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// // Configuration
// const CONFIG = {
//   HELIUS_API_KEY: '77e76692-d441-4212-96ea-79b93c83a2ad',
//   WALLET_ADDRESS: '4y34oxREo5XJogMEb7B1kJJXYPBH8uYc9vu2fA8HxdFt',
//   MAX_TRANSACTIONS: 1000,
//   BATCH_SIZE: 50,
//   FILTER_APP_INTERACTIONS: true // New config for requirement #1
// };

// // Enhanced token metadata cache
// const TOKEN_METADATA = {
//   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
//     symbol: 'USDC',
//     decimals: 6,
//     name: 'USD Coin'
//   }
//   // Add more tokens as needed
// };

// async function fetchAllTransactions(address, apiKey) {
//   let allTransactions = [];
//   let beforeSignature = null;
  
//   while (allTransactions.length < CONFIG.MAX_TRANSACTIONS) {
//     const url = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
//     url.searchParams.append('api-key', apiKey);
//     url.searchParams.append('limit', CONFIG.BATCH_SIZE.toString());
//     if (beforeSignature) url.searchParams.append('before', beforeSignature);

//     const response = await fetch(url);
//     if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
//     const transactions = await response.json();
//     if (transactions.length === 0) break;
    
//     allTransactions = [...allTransactions, ...transactions];
//     beforeSignature = transactions[transactions.length - 1].signature;
    
//     await new Promise(resolve => setTimeout(resolve, 200));
//   }
  
//   return allTransactions;
// }

// function processTransactions(transactions) {
//   return transactions
//     .map(tx => {
//       // Filter out app interactions if enabled (Requirement #1)
//       if (CONFIG.FILTER_APP_INTERACTIONS && 
//           tx.instructions?.some(i => i.programId === '11111111111111111111111111111111')) {
//         return null;
//       }

//       const date = tx.blockTime ? new Date(tx.blockTime * 1000) : null;
      
//       // Enhanced token handling (Requirement #2)
//       const tokenTransfers = (tx.tokenTransfers || []).map(t => {
//         const meta = TOKEN_METADATA[t.mint] || { decimals: 9, symbol: 'UNKNOWN', name: 'Unknown Token' };
//         return {
//           type: 'Token',
//           symbol: meta.symbol,
//           name: meta.name,
//           from: t.fromUserAccount,
//           to: t.toUserAccount,
//           amount: t.amount / Math.pow(10, meta.decimals),
//           value: null, // Will be filled later if we have price data
//           mint: t.mint
//         };
//       });

//       const solTransfers = (tx.nativeTransfers || []).map(t => ({
//         type: 'SOL',
//         symbol: 'SOL',
//         name: 'Solana',
//         from: t.from,
//         to: t.to,
//         amount: t.amount / LAMPORTS_PER_SOL,
//         value: null
//       }));

//       return {
//         signature: tx.signature,
//         timestamp: tx.blockTime,
//         date: date?.toISOString() || 'Pending',
//         fee: tx.fee / LAMPORTS_PER_SOL,
//         success: !tx.meta?.err,
//         program: tx.instructions?.[0]?.programId,
//         transfers: [...solTransfers, ...tokenTransfers],
//         isAppInteraction: tx.instructions?.some(i => i.programId === '11111111111111111111111111111111')
//       };
//     })
//     .filter(tx => tx !== null); // Remove filtered transactions
// }

// function analyzeTransactions(transactions) {
//   // Requirement #3: Get first 10 and last 10
//   const first10 = transactions.slice(0, 10);
//   const last10 = transactions.slice(-10);
  
//   // Requirement #4: Calculate values (mock - replace with real price feed)
//   const solPrice = 20; // $20/SOL mock price
//   const tokenPrices = { USDC: 1 }; // Mock prices
  
//   const withValues = transactions.map(tx => {
//     const valuedTransfers = tx.transfers.map(t => {
//       let value = 0;
//       if (t.type === 'SOL') value = t.amount * solPrice;
//       if (t.type === 'Token' && tokenPrices[t.symbol]) value = t.amount * tokenPrices[t.symbol];
//       return { ...t, value };
//     });
    
//     const totalValue = valuedTransfers.reduce((sum, t) => sum + (t.value || 0), 0);
//     return { ...tx, transfers: valuedTransfers, totalValue };
//   });

//   return {
//     first10: withValues.slice(0, 10),
//     last10: withValues.slice(-10),
//     all: withValues,
//     stats: {
//       totalSOL: withValues.reduce((sum, tx) => sum + 
//         tx.transfers.filter(t => t.type === 'SOL').reduce((s, t) => s + t.amount, 0), 0),
//       totalValue: withValues.reduce((sum, tx) => sum + tx.totalValue, 0)
//     }
//   };
// }

// (async () => {
//   try {
//     new PublicKey(CONFIG.WALLET_ADDRESS);
    
//     const rawTransactions = await fetchAllTransactions(
//       CONFIG.WALLET_ADDRESS,
//       CONFIG.HELIUS_API_KEY
//     );
    
//     const processed = processTransactions(rawTransactions);
//     const analysis = analyzeTransactions(processed);

//     console.log('\n=== FIRST 10 TRANSACTIONS ===');
//     analysis.first10.forEach((tx, i) => {
//       console.log(`\n#${i+1}: ${tx.signature}`);
//       console.log(`📅 ${tx.date} | Fee: ${tx.fee} SOL | Value: $${tx.totalValue?.toFixed(2) || 'N/A'}`);
//       tx.transfers.forEach((t, j) => {
//         console.log(`   ${j+1}. ${t.symbol} ${t.amount} ($${t.value?.toFixed(2) || '?'})`);
//         console.log(`      From: ${t.from?.slice(0,4)}...${t.from?.slice(-4)}`);
//         console.log(`      To: ${t.to?.slice(0,4)}...${t.to?.slice(-4)}`);
//       });
//     });

//     console.log('\n=== LAST 10 TRANSACTIONS ===');
//     analysis.last10.forEach((tx, i) => {
//       console.log(`\n#${i+1}: ${tx.signature}`);
//       console.log(`📅 ${tx.date} | Fee: ${tx.fee} SOL | Value: $${tx.totalValue?.toFixed(2) || 'N/A'}`);
//       tx.transfers.forEach((t, j) => {
//         console.log(`   ${j+1}. ${t.symbol} ${t.amount} ($${t.value?.toFixed(2) || '?'})`);
//         console.log(`      From: ${t.from?.slice(0,4)}...${t.from?.slice(-4)}`);
//         console.log(`      To: ${t.to?.slice(0,4)}...${t.to?.slice(-4)}`);
//       });
//     });

//     console.log('\n=== SUMMARY ===');
//     console.log(`Total Transactions: ${processed.length}`);
//     console.log(`Total SOL Moved: ${analysis.stats.totalSOL}`);
//     console.log(`Estimated Total Value: $${analysis.stats.totalValue.toFixed(2)}`);

//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// })();