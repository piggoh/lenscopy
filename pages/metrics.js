// metrics.js
export function calculateActivityMetrics(walletData) {
    const { transactions } = walletData;
    
    // Activity days calculation
    const uniqueDays = new Set();
    transactions.forEach(tx => {
      uniqueDays.add(new Date(tx.blockTime * 1000).toISOString().split('T')[0]);
    });
  
    return {
      activeDays: uniqueDays.size,
      totalTransactions: transactions.length,
      // Add more metrics as needed
    };
  }
  
  export function calculateVolatility(walletData) {
    const { transactions, tokenBalances } = walletData;
    // Implement your volatility calculation
    return {
      solVolatility: calculateSolVolatility(transactions),
      tokenVolatility: calculateTokenVolatility(tokenBalances)
    };
  }
  
  export function calculatePortfolioDiversity(walletData) {
    const { solBalance, tokenBalances } = walletData;
    // Implement diversity scoring
    return {
      diversityScore: /* your calculation */,
      assetsCount: tokenBalances.length + (solBalance > 0 ? 1 : 0)
    };
  }