'use client';

import Image from "next/image";
import { ContractId } from "@hashgraph/sdk";
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Web3 from 'web3';
import { HWBridgeProvider, useWallet, useBalance, useWriteContract, useWatchTransactionReceipt, useReadContract } from '@buidlerlabs/hashgraph-react-wallets'
import { HWCConnector, HashpackConnector } from '@buidlerlabs/hashgraph-react-wallets/connectors'
import { HederaTestnet } from '@buidlerlabs/hashgraph-react-wallets/chains'
import axios from "axios"

const CONTRACT_ID = "0.0.5723470";
const GAS_LIMIT = 120_000;

const metadata = {
  name: 'Hedera Test Task dApp',
  description: 'Hedera Test Task dApp',
  icons: ['public/next.svg'],
  url: 'https://hedera-test-task.vercel.app/',
}

const WalletBtn = () => {
  const { isExtensionRequired, isConnected, connect, disconnect } = useWallet(HashpackConnector);
  const { data: balance } = useBalance();
  const userBalance = balance?.formatted ?? '0 ℏ ';

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      console.error(error.message);
      toast.error("Connection failed. Please try again.");
    }
  };

  if (isExtensionRequired) {
    return <span className="text-black">Extension not found. Please install it</span>;
  }

  if (isConnected) {
    return (
      <div className="flex items-center">
        <span className="text-black">{`Balance: ${userBalance}   `}</span>
        <button onClick={disconnect} className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4">Disconnect</button>
      </div>
    );
  }

  return <button onClick={handleConnect} className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4">Connect</button>;
};

const WhitelistButton = ({ accountAddress, actionType }: { accountAddress: string; actionType: 'add' | 'check' }) => {
  const { writeContract } = useWriteContract({ connector: HashpackConnector });
  const { watch } = useWatchTransactionReceipt({ connector: HashpackConnector });
  const { isExtensionRequired, isConnected } = useWallet(HashpackConnector);
  const [message, setMessage] = useState('');

  const handleAction = async () => {
    try {
      if (actionType === 'add') {
        if (isExtensionRequired) {
          toast.error('Please install Hashpack');
          return;
        }
        if (!isConnected) {
          toast.error('Please connect to your wallet first.');
          return;
        }
        
        const transactionIdOrHash = await writeContract({
          contractId: ContractId.fromString(CONTRACT_ID),
          abi: [
            {
              inputs: [{ internalType: 'address', name: 'accountId', type: 'address' }],
              name: 'whitelist',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function'
            }
          ],
          functionName: 'whitelist',
          metaArgs: { gas: GAS_LIMIT },
          args: [accountAddress as `0x${string}`],
        });
        watch(transactionIdOrHash?.toString() ?? "", {
          onSuccess: (transaction) => {
            toast.success("Successfully added to whitelist!")
            return transaction
          },
          onError: (transaction, error) => {
            toast.error(`Error: ${error}`)
            return transaction
          },
        });
      } else {
        const url = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?order=asc`;
        const response = await axios.get(url);
        const accountIdsSet = new Set<string>();
        response.data.logs.forEach((log: any) => {
          const event = decodeEvent("WhiteListAccount", log.data, log.topics.slice(1));
          accountIdsSet.add(event.accountId as string);
        });
        setMessage(accountIdsSet.has(accountAddress) ? `${accountAddress} is whitelisted.` : `${accountAddress} is not whitelisted.`);
      }
    } catch (e) {
      console.error(e);
      toast.error(actionType === 'add' ? "An error occurred while adding to whitelist." : "An error occurred while checking whitelist.");
    }
  };

  const decodeEvent = (eventName: string, log: any, topics: any) => {
    const { ethereum } = window;
    const web3 = new Web3(ethereum);
    const eventAbi = [{
      anonymous: false,
      inputs: [{ indexed: false, internalType: "address", name: "accountId", type: "address" }],
      name: eventName,
      type: "event"
    }];
    return web3.eth.abi.decodeLog(eventAbi[0].inputs, log, topics);
  };

  return (
    <div>
      {actionType === 'check' && <label className="text-black pt-10 pl-4">Message: {message}</label>}
      <button
        onClick={handleAction}
        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4 w-155">
        {actionType === 'add' ? 'Add to Whitelist' : 'Check WhiteListed'}
      </button>
    </div>
  );
};

const CheckContractMessageBtn = () => {
  const { readContract } = useReadContract();
  const [message, setMessage] = useState('');

  const handleCheckMessage = async () => {
    try {
      const returnedMessage = await readContract({
        address: '0x000000000000000000000000000000000057554e',
        abi: [
          {
            inputs: [],
            name: 'message',
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function"
          },
        ],
        functionName: 'message',
        metaArgs: { gas: GAS_LIMIT },
        args: [],
      }) as string;
      setMessage(returnedMessage);
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while checking the message.");
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckMessage}
        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4 w-155">
        Check Bonus Message
      </button>
      <label className="text-black pt-10 pl-4">Message: {message}</label>
    </div>
  );
};

export default function Home() {


  const [accountAddress, setAccountAddress] = useState('');

  return (
    <HWBridgeProvider
      metadata={metadata}
      projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
      connectors={[HWCConnector, HashpackConnector]}
      chains={[HederaTestnet]}
    >
      <ToastContainer />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white">
        <div className="absolute top-4 right-4">
          <WalletBtn />
        </div>
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <Image
            src="./next.svg"
            alt="Description of image"
            width={500}
            height={300}
            className="mb-4"
          />
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter address"
              className="border rounded p-2 placeholder:text-gray-500 text-black"
              value={accountAddress}
              onChange={(e) => setAccountAddress(e.target.value)}
            />
            <WhitelistButton accountAddress={accountAddress} actionType="check" />
            <WhitelistButton accountAddress={accountAddress} actionType="add" />
            <CheckContractMessageBtn />

          </div>
        </main>
      </div>

    </HWBridgeProvider>
  );
}
