import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'

const inter = Inter({ subsets: ['latin'] })

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
)

export default function Home() {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [manualPublicKey, setManualPublicKey] = useState(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check balance when wallet connects
  useEffect(() => {
    if (!publicKey) return
    connection.getBalance(publicKey)
      .then(bal => setBalance(bal / LAMPORTS_PER_SOL))
      .catch(console.error)
  }, [publicKey, connection])

  // Redirect to dashboard when either wallet connects or manual address is submitted
  useEffect(() => {
    const keyToUse = publicKey || manualPublicKey
    if (keyToUse) {
      const timer = setTimeout(() => {
        // Pass the public key to the dashboard page
        router.push({
          pathname: '/dashboard',
          query: { publicKey: keyToUse.toString() }
        })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [publicKey, manualPublicKey, router])

  const handleAddressSubmit = () => {
    try {
      const pubKey = new PublicKey(walletAddress)
      setManualPublicKey(pubKey)
      // Balance check for manual address
      connection.getBalance(pubKey)
        .then(bal => setBalance(bal / LAMPORTS_PER_SOL))
        .catch(console.error)
    } catch (error) {
      console.error('Invalid Solana address:', error)
      alert('Please enter a valid Solana wallet address')
    }
  }

  return (
    <main className={`min-h-screen ${inter.className}`}>
      {/* Wallet Button at Top-Right */} 
      <div className="fixed right-4 top-4 z-50">
        {mounted && (
          <WalletMultiButton 
            style={{ 
              background: 'linear-gradient(135deg, #7B61FF 0%, #4E44CE 100%)',
              borderRadius: '1rem',
              padding: '0.2rem 2rem',
              height: '40px',
              gap: '3px',
              display: 'inline-flex',
              alignItems: 'center',
            }} 
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="relative flex flex-col items-center place-items-center text-center">
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/lens.png"
            alt="Lens Logo"
            width={180}
            height={180}
            priority
          />
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            LENs is a simple AI-powered dashboard that analyzes Solana wallet activity.
          </p>

          <div className="mt-6 w-full max-w-xs">
            <input
              id="walletAddress"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="px-4 py-2 w-full border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={connected}
            />
          </div>

          <button
            type="button"
            className={`mt-4 px-6 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${connected ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleAddressSubmit}
            disabled={connected}
          >
            Go
          </button>
        </div>
      </div>

      {(publicKey || manualPublicKey) && (
        <div className="fixed left-4 top-4 z-40 text-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
          <p className="text-sm">Wallet Address:</p>
          <code className="text-xs break-all">
            {(publicKey || manualPublicKey).toString()}
          </code>
          {balance !== null && (
            <p className="mt-2">Balance: <span className="font-bold">{balance} SOL</span></p>
          )}
        </div>
      )}
    </main>
  )
}