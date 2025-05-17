import dynamic from 'next/dynamic'
import NextImage from 'next/image'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

const WalletMultiButton = dynamic(
  async () => {
    const mod = await import('@solana/wallet-adapter-react-ui')
    return mod.WalletMultiButton
  },
  { 
    ssr: false,
    loading: () => (
      <button className="bg-[#4E44CE] rounded-lg px-4 py-2 text-white opacity-75" disabled>
        Loading...
      </button>
    )
  }
)

export default function Dashboard() {
  const { publicKey: connectedKey, disconnect, connected, connecting } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [error, setError] = useState(null)
  const [currentPublicKey, setCurrentPublicKey] = useState(null)
  const [connectionHealthy, setConnectionHealthy] = useState(true)

  // Connection health check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const version = await connection.getVersion()
        console.log("Solana connection OK:", version)
        setConnectionHealthy(true)
        if (error?.includes('Connection')) setError(null)
      } catch (err) {
        console.error("Connection check failed:", err)
        setConnectionHealthy(false)
        setError("Connection to Solana network failed. Please try again later.")
        setTimeout(checkConnection, 10000) // Retry every 10 seconds
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => {
      clearInterval(interval)
      clearTimeout(checkConnection)
    }
  }, [connection, error])
  
  useEffect(() => {
    console.log("ACTIVE CONNECTION DETAILS:", {
      endpoint: connection.rpcEndpoint,
      commitment: connection.commitment,
      httpHeaders: connection._httpHeaders
    });
  
    // Test connection immediately
    connection.getVersion().then(v => {
      console.log("CONNECTION TEST SUCCESS:", v);
    }).catch(e => {
      console.error("CONNECTION TEST FAILED:", e);
    });
  }, [connection]);

  // Set the public key to use
  useEffect(() => {
    if (connectedKey) {
      setCurrentPublicKey(connectedKey)
    } else if (router.query.publicKey) {
      try {
        const pubKey = new PublicKey(router.query.publicKey)
        setCurrentPublicKey(pubKey)
      } catch (err) {
        console.error("Invalid public key:", err)
        setError("Invalid wallet address format")
      }
    }
  }, [connectedKey, router.query.publicKey])

  useEffect(() => {
    if (!currentPublicKey) return
  
    const loadData = async () => {
      console.log("Starting data load...")
      try {
        const balanceSuccess = await fetchBalanceWithRetry()
        if (balanceSuccess) {
          await fetchTransactionsWithRetry()
        }
      } catch (err) {
        console.error("Data load failed:", err)
      }
    }
  
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [currentPublicKey])

  const fetchBalanceWithRetry = async (retries = 3) => {
    try {
      console.log(`Fetching balance for ${currentPublicKey}`)
      const balance = await connection.getBalance(currentPublicKey, {
        commitment: 'confirmed'
      })
      console.log(`Raw balance: ${balance} lamports`)
      setBalance(balance / LAMPORTS_PER_SOL)
      return true
    } catch (err) {
      console.error("Balance fetch error:", err)
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        return fetchBalanceWithRetry(retries - 1)
      }
      setError(`Balance Error: ${err.message}`)
      return false
    }
  }

  const fetchTransactionsWithRetry = async (retries = 3) => {
    setLoadingTx(true)
    try {
      console.log(`Fetching txs for ${currentPublicKey}`)
      const signatures = await connection.getConfirmedSignaturesForAddress2(
        currentPublicKey, 
        {
          limit: 10,
          commitment: 'confirmed'
        }
      )
  
      const txDetails = await Promise.all(
        signatures.map(sig => connection.getParsedTransaction(
          sig.signature,
          {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          }
        ))
      )
  
      setTransactions(txDetails.filter(tx => tx !== null))
      return true
    } catch (err) {
      console.error("Tx fetch error:", err)
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        return fetchTransactionsWithRetry(retries - 1)
      }
      setError(`Transactions Error: ${err.message}`)
      return false
    } finally {
      setLoadingTx(false)
    }
  }
  // Data refresh logic
  useEffect(() => {
    if (!currentPublicKey) return

    const loadData = async () => {
      const balanceSuccess = await fetchBalanceWithRetry()
      if (balanceSuccess) {
        await fetchTransactionsWithRetry()
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [currentPublicKey, connectionHealthy])

  useEffect(() => {
    console.log("Active RPC Endpoint:", connection.rpcEndpoint)
    connection.getVersion().then(v => {
      console.log("Connection version:", v)
    }).catch(e => {
      console.error("Connection test failed:", e)
    })
  }, [connection])

  // Redirect if no wallet
  useEffect(() => {
    if (!currentPublicKey && connected === false && !connecting) {
      router.push('/')
    }
  }, [currentPublicKey, connected, connecting, router])

  const handleDisconnect = async () => {
    try {
      await disconnect()
      router.push('/')
    } catch (error) {
      console.error("Disconnect failed:", error)
      setError("Failed to disconnect wallet")
    }
  }

  if (connecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Connecting wallet...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Connection status indicator */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center">
        <span className={`w-3 h-3 rounded-full mr-2 ${error ? 'bg-red-500' : 'bg-green-500'}`} />
        <span className="text-xs text-gray-300">
          {error ? 'Disconnected' : 'Connected'}
        </span>
      </div>

      {/* Rest of your JSX remains exactly the same */}
      {/* [Keep all your existing JSX here - it's correct] */}
      {/* Lens Logo */}
      <div className="fixed left-4 top-4 z-40">
        <div className="relative flex flex-col items-center place-items-center text-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700/10 after:dark:from-sky-900 after:dark:via-[#0141ff]/40 before:lg:h-[360px]">
          <NextImage
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/lens.png"
            alt="Lens Logo"
            width={120}
            height={120}
            priority
          />
        </div>
      </div>

      {/* Wallet Button */}
      <div className="fixed right-4 top-4 z-50">
        {connected ? (
          <button
            onClick={handleDisconnect}
            style={{ 
              background: 'linear-gradient(135deg, #7B61FF 0%, #4E44CE 100%)',
              borderRadius: '1rem',
              padding: '0.5rem 1.5rem',
              height: '40px',
              color: 'white',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Disconnect</span>
          </button>
        ) : (
          <WalletMultiButton 
            style={{ 
              background: 'linear-gradient(135deg, #7B61FF 0%, #4E44CE 100%)',
              borderRadius: '1rem',
              padding: '0.5rem 1.5rem',
              height: '40px',
              color: 'white',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }} 
          />
        )}
      </div>

      {/* Dashboard content */}
      <div className="pt-32 px-24">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 rounded-lg text-red-300">
            {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 underline"
            >
              Refresh Page
            </button>
          </div>
        )}

        {currentPublicKey && (
          <div className="space-y-6">
            {/* Combined Credit Score and Wallet Info Section */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Credit Score Card - Left Side */}
              <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm flex-1 max-w-xs">
                <h2 className="text-xl font-semibold text-white mb-4">Credit Score</h2>
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#2D3748" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#4FD1C5"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="283"
                        strokeDashoffset="70"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-white">720</span>
                      <span className="text-sm text-gray-300">Good</span>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Payment History</span>
                      <span className="font-medium text-green-400">Excellent</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Credit Usage</span>
                      <span className="font-medium text-yellow-400">Good</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Account Age</span>
                      <span className="font-medium text-blue-400">Fair</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Info Card - Right Side */}
              <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm flex-1">
                <h2 className="text-xl font-semibold text-white mb-4">Wallet Information</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Wallet Address:</p>
                  <code className="text-xs text-white break-all block p-2 bg-black/20 rounded">
                    {currentPublicKey.toString()}
                  </code>
                  <p className="text-xs text-gray-400 mt-1">
                    {connected ? "Connected via wallet" : "Entered manually"}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10">
  <p className="text-sm text-gray-300">Wallet Balance:</p>
  {balance === null ? (
    loadingTx ? (
      <div className="flex items-center mt-2">
        <span className="text-2xl font-bold text-white">Loading...</span>
      </div>
    ) : (
      <p className="text-red-400 text-sm mt-2">
        {error || "Failed to load balance"}
      </p>
    )
  ) : (
    <div className="flex items-center mt-2">
      <span className="text-2xl font-bold text-white">
        {balance.toFixed(4)}
      </span>
      <span className="ml-2 text-lg text-blue-300">SOL</span>
      <span className="ml-auto text-sm text-gray-400">
        ≈ ${(balance * 20).toFixed(2)}
      </span>
    </div>
  )}
</div>
              </div>
            </div>

            {/* Transactions Card */}
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
  
            {loadingTx ? (
              <div className="text-center py-6 text-gray-400">
                Loading transactions...
              </div>
              ) : error ? (
                <div className="text-red-400 text-center py-6">
                  {error.includes('transaction') ? error : "Transaction load failed"}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx, index) => {
                    if (!tx) return null
                    
                    const signature = tx.signatures[0]
                    const date = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Unknown time'
                    const amount = tx.meta ? 
                      (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / LAMPORTS_PER_SOL : 0

                    return (
                      <div key={index} className="p-3 rounded-md bg-black/20 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {tx.transaction.message.instructions[0]?.programId.toString().slice(0, 8)}...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm ${amount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {amount.toFixed(4)} SOL
                            </p>
                            <a 
                              href={`https://solscan.io/tx/${signature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              View on Solscan
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">No recent transactions found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}