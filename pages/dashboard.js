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
  const { publicKey, disconnect, connected } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState(null)
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loadingTx, setLoadingTx] = useState(false)

  const handleDisconnect = async () => {
    try {
      await disconnect()
      router.push('/')
    } catch (error) {
      console.error("Disconnect failed:", error)
    }
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey) return
      
      setLoadingTx(true)
      try {
        const pubKey = new PublicKey(publicKey)
        const txList = await connection.getConfirmedSignaturesForAddress2(pubKey, {
          limit: 10,
        })

        // Get full transaction details
        const txDetails = await Promise.all(
          txList.map(tx => connection.getTransaction(tx.signature)))
        
        setTransactions(txDetails.filter(tx => tx !== null))
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoadingTx(false)
      }
    }

    fetchTransactions()
    const interval = setInterval(fetchTransactions, 30000)
    
    return () => clearInterval(interval)
  }, [publicKey, connection])

  useEffect(() => {
    if (!publicKey && connected === false) {
      router.push('/')
    }
  }, [publicKey, connected, router])

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const balance = await connection.getBalance(publicKey)
          setBalance(balance / LAMPORTS_PER_SOL)
        } catch (error) {
          console.error("Error fetching balance:", error)
        }
      }
    }
    
    fetchBalance()
    const interval = setInterval(fetchBalance, 15000)
    
    return () => clearInterval(interval)
  }, [publicKey, connection])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Lens Logo - Top Left */}
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

      {/* Wallet Button - Top Right */}
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
        {publicKey && (
          <div className="space-y-6">
            {/* Combined Credit Score and Wallet Info Section */}
<div className="flex flex-col md:flex-row gap-6">
  {/* New Credit Score Card - Left Side */}
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

    {/* Existing Wallet Info Card - Right Side */}
    <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm flex-1">
        <h2 className="text-xl font-semibold text-white mb-4">Wallet Information</h2>
        <div className="space-y-2">
         <p className="text-sm text-gray-300">Connected Wallet:</p>
        <code className="text-xs text-white break-all block p-2 bg-black/20 rounded">
            {publicKey.toString()}
        </code>
        </div>
        <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-gray-300">Wallet Balance:</p>
        <div className="flex items-center mt-2">
            <span className="text-2xl font-bold text-white">
            {balance !== null ? balance.toFixed(4) : '--.--'}
            </span>
            <span className="ml-2 text-lg text-blue-300">SOL</span>
            {balance !== null && (
            <span className="ml-auto text-sm text-gray-400">
                ≈ ${(balance * 20).toFixed(2)}
            </span>
            )}
        </div>
        </div>
    </div>
    </div>

            {/* Transactions Card */}
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
              
              {loadingTx ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div key={index} className="p-3 rounded-md bg-black/20 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {tx.transaction.message.instructions[0]?.programId.toString().slice(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(tx.blockTime * 1000).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-300">
                            {(tx.meta?.postBalances[0] / LAMPORTS_PER_SOL - tx.meta?.preBalances[0] / LAMPORTS_PER_SOL).toFixed(4)} SOL
                          </p>
                          <a 
                            href={`https://solscan.io/tx/${tx.transaction.signatures[0]}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            View on Solscan
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
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