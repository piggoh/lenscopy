import '@/styles/globals.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

export default function App({ Component, pageProps }) {
  // Use Mainnet for production
  const network = WalletAdapterNetwork.Mainnet
  
  // Custom RPC endpoints - fallback to public if not specified
  const endpoint = useMemo(() => {
    // Try these RPC endpoints in order of preference
    const endpoints = [
      process.env.NEXT_PUBLIC_SOLANA_RPC, // Your custom RPC in .env
      'https://rpc.ankr.com/solana',      // Reliable free tier
      'https://solana-mainnet.rpc.extrnode.com', // Good performance
      clusterApiUrl(network)              // Fallback to public RPC
    ].filter(Boolean)
    
    return endpoints[0] // Use the first available endpoint
  }, [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter()
    ],
    [network]
  )

  return (
<ConnectionProvider 
  endpoint={endpoint}
  config={{
    commitment: 'confirmed',
    httpHeaders: {
      'Content-Type': 'application/json',
    },
    wsEndpoint: endpoint.replace('https://', 'wss://'),
    httpRetries: 5,
    fetchRetries: 3,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false
  }}
>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <Component {...pageProps} />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}