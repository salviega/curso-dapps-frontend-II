import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useReadContract,
  useSignMessage,
  useWriteContract,
} from 'wagmi'
import { CONTRACT_ADDRESS } from './constants'
import { abi } from './assets/abis/erc20'
import { useEffect, useState } from 'react'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { config } from './main'
import { toast } from 'react-toastify'
import { Contract, ethers, JsonRpcProvider, Wallet } from 'ethers'
import { hashMessage } from 'viem'

function App(): JSX.Element {
  const { address, isConnected } = useAccount()

  const [contract, setContract] = useState<Contract | null>(null)
  const [balanceOf, setBalanceOf] = useState<string | null>(null)
  const [isMinting, setIsMinting] = useState(false)

  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    ;(async () => {
      const provider: JsonRpcProvider = new JsonRpcProvider(
        import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL
      )

      const signer: ethers.Wallet = new Wallet(
        import.meta.env.VITE_WALLET_PRIVATE_KEY,
        provider
      )

      const initContract = new Contract(CONTRACT_ADDRESS, abi, signer)
      setContract(initContract)

      setBalanceOf(await initContract.balanceOf(address))

      setIsMinting(false)

      // initContract.on('Transfer', async (from, to, value) => {
      //   if (address === from || address === to) {
      //     setBalanceOf(await initContract.balanceOf(address))
      //   }
      // })
    })()
  }, [])

  const onMint = async () => {
    setIsMinting(true)
    try {
      const message = 'Hola, EducatETH pagará el gas por ti ;)'
      const hash = hashMessage(message)
      const signature = await signMessageAsync({ message })

      if (!contract) {
        throw new Error('Contract not found')
      }

      const mintTx = await contract.mint(hash, signature, address, 100)
      await mintTx.wait()

      setBalanceOf(await contract.balanceOf(address))

      toast('Minted successfully')
    } catch (error) {
      toast.error('Error while minting. Try again.')
      console.error(error)
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center w-full">
      <section className="space-y-5">
        <h1 className="text-4xl font-bold text-center">
          🚀 DAPP Token Faucet 🚀
        </h1>
        <div className="p-4 border border-zinc-700 flex flex-col gap-5 items-center rounded-xl">
          <ConnectButton showBalance={false} accountStatus={'avatar'} />
          {!isConnected ? (
            <>
              <h2>First make sure your wallet is connected</h2>
            </>
          ) : (
            <div className="flex flex-col gap-5 items-center">
              <p className="text-xl  text-center">
                📇 <span className="font-bold">Address:</span> {address}
              </p>
              <p className="text-xl  text-center">
                💰 <span className="font-bold">Balance (DAPP):</span>{' '}
                {isMinting ? (
                  <span className="opacity-50">loading...</span>
                ) : (
                  balanceOf?.toString()
                )}
              </p>
              <button
                className="py-1 px-3 bg-zinc-800 rounded-lg hover:scale-105 transition-all disabled:opacity-50"
                onClick={onMint}
                disabled={isMinting}
              >
                {isMinting ? 'Minting...' : 'Mint token'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
