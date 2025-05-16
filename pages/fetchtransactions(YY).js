import fetch from 'node-fetch';
import { PublicKey } from '@solana/web3.js';

const HELIUS_API_KEY = '77e76692-d441-4212-96ea-79b93c83a2ad';
const BASE_URL = 'https://api.helius.xyz/v0/';

async function fetchTransactionDetails(address) {
  if (!validateAddress(address)) {
    console.error('Invalid Solana address format');
    return null;
  }

  try {
    const allTxs = await fetchTransactions(address, 20); // Fetch more to filter later
    if (!allTxs || allTxs.length === 0) {
      console.log('No transactions found for this address');
      return null;
    }

    const totalTransactions = allTxs.length;

    // Filter transactions for user-to-user wallet transfers
    const filteredTxs = allTxs.filter(tx => {
      return tx.instructions.some(instr => {
        const isSystemProgram = instr.programId === '11111111111111111111111111111111';
        const isTokenProgram = instr.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

        if (!(isSystemProgram || isTokenProgram)) return false;
        if (!instr.accounts || instr.accounts.length < 2) return false;

        const normalizedAccounts = instr.accounts.map(acc => acc.toString());

        const involvesQueriedWallet = normalizedAccounts.includes(address);
        const involvesAnotherWallet = normalizedAccounts.some(acc => acc !== address);

        return involvesQueriedWallet && involvesAnotherWallet;
      });
    });

    if (filteredTxs.length === 0) {
      console.log('No user-to-user wallet transactions found');
      return {
        address,
        totalTransactions,
        filteredTransactionsCount: 0,
        sampleTransaction: null,
        sampleTransactionTime: 'N/A'
      };
    }

    const firstTx = filteredTxs[0];

    // Convert timestamp (blockTime) to readable date/time string
    const readableTime = firstTx.blockTime
      ? new Date(firstTx.blockTime * 1000).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZoneName: 'short'
        })
      : 'N/A';

    console.log('Filtered Transaction Metadata:');
    console.log('------------------------------');
    console.log(filteredTxs[0]);
    console.log(`Timestamp: ${readableTime}`);

    return {
      address,
      totalTransactions,
      filteredTransactionsCount: filteredTxs.length,
      sampleTransaction: firstTx,
      sampleTransactionTime: readableTime
    };
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

function validateAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

async function fetchTransactions(address, limit = 20) {
  const url = `${BASE_URL}addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

async function main() {
  const myWalletAddress = '4y34oxREo5XJogMEb7B1kJJXYPBH8uYc9vu2fA8HxdFt';

  console.log(`Fetching data for address: ${myWalletAddress}`);
  const result = await fetchTransactionDetails(myWalletAddress);

  if (result) {
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Address: ${result.address}`);
    console.log(`Total Transactions (all): ${result.totalTransactions}`);
    console.log(`User-to-User Transactions (filtered): ${result.filteredTransactionsCount}`);
    if (result.sampleTransaction) {
      console.log(`Sample Transaction Timestamp: ${result.sampleTransactionTime}`);
      console.log('\nTip: To see full transaction data, check the "sampleTransaction" object above');
    }
  }
}

main().catch(console.error);
