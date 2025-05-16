import fetch from 'node-fetch';
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Configuration
const HELIUS_API_KEY = '77e76692-d441-4212-96ea-79b93c83a2ad';
const BASE_URL = 'https://api.helius.xyz/v0/';

// Create connection to Solana blockchain
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

// Cache for token metadata to avoid repeated API calls
const tokenMetadataCache = new Map();

// Function to fetch token metadata with rate limiting
async function fetchTokenMetadata(mintAddress) {
  if (tokenMetadataCache.has(mintAddress)) {
    return tokenMetadataCache.get(mintAddress);
  }

  try {
    // Add delay between API calls
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const url = `${BASE_URL}token-metadata?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [mintAddress] })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.length > 0) {
      tokenMetadataCache.set(mintAddress, data[0]);
      return data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}

// Helper function to validate Solana address
function validateSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to calculate wallet metrics
async function calculateWalletMetrics(transactions) {
  const metrics = {
    activeDays: new Set(),
    interactedWallets: new Set(),
    assetHistory: new Map(), // Map of token -> array of {timestamp, value}
    firstTransactionDate: null,
    lastTransactionDate: null
  };

  // Sort transactions by timestamp
  const sortedTransactions = transactions.sort((a, b) => a.timestamp - b.timestamp);
  
  if (sortedTransactions.length > 0) {
    metrics.firstTransactionDate = new Date(sortedTransactions[0].timestamp * 1000);
    metrics.lastTransactionDate = new Date(sortedTransactions[sortedTransactions.length - 1].timestamp * 1000);
  }

  for (const tx of sortedTransactions) {
    const txDate = new Date(tx.timestamp * 1000);
    metrics.activeDays.add(txDate.toISOString().split('T')[0]);

    // Track interacted wallets
    tx.transfers.forEach(transfer => {
      if (transfer.from) metrics.interactedWallets.add(transfer.from);
      if (transfer.to) metrics.interactedWallets.add(transfer.to);
    });

    // Track asset history
    tx.transfers.forEach(transfer => {
      if (!metrics.assetHistory.has(transfer.type)) {
        metrics.assetHistory.set(transfer.type, []);
      }
      metrics.assetHistory.get(transfer.type).push({
        timestamp: tx.timestamp,
        value: transfer.value
      });
    });
  }

  return metrics;
}

async function fetchTransactions(address, batchSize = 100) {
  try {
    if (!validateSolanaAddress(address)) {
      throw new Error('Invalid Solana address format');
    }

    const allTransactions = [];
    let before = '';
    
    while (true) {
      const url = `${BASE_URL}addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&before=${before}&limit=${batchSize}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const transactions = await response.json();
      if (!transactions || transactions.length === 0) break;
      
      allTransactions.push(...transactions);
      before = transactions[transactions.length - 1].signature;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Process transactions with token metadata
    const processedTransactions = await Promise.all(allTransactions.map(async tx => {
      const timestamp = new Date(tx.timestamp * 1000);
      
      // Process token transfers with metadata
      const tokenTransfers = await Promise.all((tx.tokenTransfers || []).map(async transfer => {
        const metadata = await fetchTokenMetadata(transfer.mint);
        return {
          type: metadata?.name || transfer.mint,
          symbol: metadata?.symbol || 'UNKNOWN',
          value: transfer.tokenAmount / Math.pow(10, transfer.decimals),
          from: transfer.fromUserAccount,
          to: transfer.toUserAccount
        };
      }));

      const solTransfers = (tx.nativeTransfers || []).map(transfer => ({
        type: 'SOL',
        symbol: 'SOL',
        value: transfer.amount / 1e9,
        from: transfer.fromUserAccount,
        to: transfer.toUserAccount
      }));

      return {
        signature: tx.signature,
        timestamp,
        transfers: [...tokenTransfers, ...solTransfers]
      };
    }));

    // Calculate metrics
    const metrics = await calculateWalletMetrics(processedTransactions);
    
    return {
      address,
      creationDate: metrics.firstTransactionDate,
      transactions: processedTransactions,
      metrics: {
        activeDays: metrics.activeDays.size,
        totalDays: Math.ceil((metrics.lastTransactionDate - metrics.firstTransactionDate) / (1000 * 60 * 60 * 24)),
        interactedWallets: metrics.interactedWallets.size,
        assetHistory: metrics.assetHistory
      }
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

async function main() {
  const walletAddress = '4y34oxREo5XJogMEb7B1kJJXYPBH8uYc9vu2fA8HxdFt';
  
  try {
    console.log(`Fetching data for address: ${walletAddress}`);
    const result = await fetchTransactions(walletAddress);
    
    console.log('\nWallet Information:');
    console.log('------------------');
    console.log(`Address: ${result.address}`);
    // Fix date formatting
    const creationDate = result.creationDate ? new Date(result.creationDate).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) : 'Unknown';
    console.log(`Creation Date: ${creationDate}`);
    console.log(`Total Transactions: ${result.transactions.length}`);
    
    // Print metrics
    console.log('\nWallet Metrics:');
    console.log('------------------');
    console.log(`Active Days: ${result.metrics.activeDays}`);
    console.log(`Total Days: ${result.metrics.totalDays}`);
    console.log(`Activity Ratio: ${((result.metrics.activeDays / result.metrics.totalDays) * 100).toFixed(2)}%`);
    console.log(`Unique Interacted Wallets: ${result.metrics.interactedWallets}`);
    
    // Print 10 latest transactions with token names
    console.log('\n10 Latest Transactions:');
    console.log('------------------');
    const latestTransactions = result.transactions.slice(-10).reverse();
    latestTransactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log(`Signature: ${tx.signature}`);
      console.log(`Timestamp: ${tx.timestamp.toLocaleString()}`);
      console.log('Transfers:');
      tx.transfers.forEach((transfer, idx) => {
        console.log(`  ${idx + 1}. Type: ${transfer.type} (${transfer.symbol})`);
        console.log(`     Value: ${transfer.value}`);
        console.log(`     From: ${transfer.from}`);
        console.log(`     To: ${transfer.to}`);
      });
    });

    // Print 10 oldest transactions with token names
    console.log('\n10 Oldest Transactions:');
    console.log('------------------');
    const oldestTransactions = result.transactions.slice(0, 10);
    oldestTransactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log(`Signature: ${tx.signature}`);
      console.log(`Timestamp: ${tx.timestamp.toLocaleString()}`);
      console.log('Transfers:');
      tx.transfers.forEach((transfer, idx) => {
        console.log(`  ${idx + 1}. Type: ${transfer.type} (${transfer.symbol})`);
        console.log(`     Value: ${transfer.value}`);
        console.log(`     From: ${transfer.from}`);
        console.log(`     To: ${transfer.to}`);
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);