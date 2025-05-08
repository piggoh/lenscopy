import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const inter = Inter({ subsets: ['latin'] })

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
)

export default function Home() {
  
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey)
      .then(bal => setBalance(bal / LAMPORTS_PER_SOL))
      .catch(console.error);
  }, [publicKey, connection]);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      {/* Wallet Button at Top-Right */} 
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed right-4 top-4 phantom-purple-button">
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
        {publicKey && (
        <div className="text-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
          <p className="text-sm">Connected Wallet:</p>
          <code className="text-xs break-all">{publicKey.toBase58()}</code>
          {balance !== null && (
            <p className="mt-2">Balance: <span className="font-bold">{balance} SOL</span></p>
          )}
        </div>
        )}
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
          </a>
        </div>
      </div>
      
      <div className="relative flex flex-col items-center place-items-center text-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700/10 after:dark:from-sky-900 after:dark:via-[#0141ff]/40 before:lg:h-[360px]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/lens.png"
          alt="Lens Logo"
          width={180}
          height={180}
          priority
        />
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          LENs is a simple AI-powered dashboard that analyzes Solana wallet activity—like transactions and balances—to generate on-chain credit insights.
        </p>

        {/* Wallet Address Input */}
        <input
          id="walletAddress"
          type="text"
          placeholder="Enter Solana wallet address"
          className="mt-6 px-4 py-2 w-full max-w-xs border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Transparent Go Button */}
        <button
          type="button"
          className="mt-4 px-6 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          onClick={() => alert("Wallet address submitted!")} // You can replace this with your own handler
        >
          Go
        </button>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Learn{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Templates{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Discover and deploy boilerplate example Next.js&nbsp;projects.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Deploy{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  )
}