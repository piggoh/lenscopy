import fetch from 'node-fetch';
import { PublicKey } from '@solana/web3.js';

// Configuration
const HELIUS_API_KEY = '77e76692-d441-4212-96ea-79b93c83a2ad'; // Replace with actual key
const BASE_URL = 'https://api.helius.xyz/v0/';

async function fetchTransactionDetails(address) {
  if (!validateAddress(address)) {
    console.error('Invalid Solana address format');
    return null;
  }

  try {
    // Fetch recent transactions with full details
    const transactions = await fetchTransactions(address, 5); // Get first 5 txs
    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for this address');
      return null;
    }

    // Display raw metadata of first transaction
    console.log('First Transaction Metadata:');
    console.log('--------------------------');
    console.log(transactions[0]);

    return {
      address,
      totalTransactions: transactions.length,
      sampleTransaction: transactions[0] // Return first tx for inspection
    };
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Helper functions
function validateAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

async function fetchTransactions(address, limit = 5) {
  const url = `${BASE_URL}addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

// Using your own wallet address
async function main() {
  // You can use ANY valid Solana address here, including your own wallet
  const myWalletAddress = '4y34oxREo5XJogMEb7B1kJJXYPBH8uYc9vu2fA8HxdFt'; // Replace with your wallet address
  
  console.log(`Fetching data for address: ${myWalletAddress}`);
  const result = await fetchTransactionDetails(myWalletAddress);
  
  if (result) {
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Address: ${result.address}`);
    console.log(`Total Transactions Found: ${result.totalTransactions}`);
    console.log('\nTip: To see full transaction data, check the "sampleTransaction" object above');
  }
}

main().catch(console.error);

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

// Refined logic to extract relevant transfer info (filtered for user-to-user)

const filtered = transactions.map((tx) => {
  const transfers = [];

  // Filter SOL transfers (native)
  const nativeTransfers = tx.nativeTransfers?.filter(t => {
    if (!CONFIG.FILTER_APP_INTERACTIONS) return true;
    return t.from !== '11111111111111111111111111111111' &&
           t.to !== '11111111111111111111111111111111';
  }) || [];

  for (const t of nativeTransfers) {
    transfers.push({
      type: 'SOL',
      from: t.from,
      to: t.to,
      amount: t.amount / LAMPORTS_PER_SOL,
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      value: (t.amount / LAMPORTS_PER_SOL) * 20 // Assume $20 per SOL
    });
  }

  // Filter Token transfers (like USDC)
  const tokenTransfers = tx.tokenTransfers?.filter(t => {
    if (!CONFIG.FILTER_APP_INTERACTIONS) return true;
    return t.fromUserAccount !== '11111111111111111111111111111111' &&
           t.toUserAccount !== '11111111111111111111111111111111';
  }) || [];

  for (const t of tokenTransfers) {
    const meta = TOKEN_METADATA[t.mint] || { symbol: 'UNKNOWN', decimals: 9, name: 'Unknown Token' };
    const amount = t.amount / Math.pow(10, meta.decimals);

    transfers.push({
      type: 'Token',
      from: t.fromUserAccount,
      to: t.toUserAccount,
      amount,
      symbol: meta.symbol,
      name: meta.name,
      decimals: meta.decimals,
      value: amount * (meta.symbol === 'USDC' ? 1 : 0) // Add more pricing logic if needed
    });
  }

  return {
    signature: tx.signature,
    date: new Date(tx.blockTime * 1000).toISOString(),
    success: !tx.meta?.err,
    fee: tx.fee / LAMPORTS_PER_SOL,
    transfers,
    totalValue: transfers.reduce((sum, t) => sum + (t.value || 0), 0)
  };
});
