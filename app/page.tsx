'use client';

import Image from "next/image";
import { ContractId } from "@hashgraph/sdk";
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Web3 from 'web3';
import { HWBridgeProvider, useWallet, useBalance, useWriteContract, useWatchTransactionReceipt, useReadContract } from '@buidlerlabs/hashgraph-react-wallets'
import { HashpackConnector, KabilaConnector } from '@buidlerlabs/hashgraph-react-wallets/connectors'
import { HederaTestnet } from '@buidlerlabs/hashgraph-react-wallets/chains'
import axios from "axios"


// import DAppLogo from 'public/next.svg'

const metadata = {
  name: 'Hedera Test Task dApp',
  description: 'Hedera Test Task dApp',
  icons: ['public/next.svg'],
  url: 'https://hedera-test-task.vercel.app/',
}

const WalletBtn = () => {
  const { isExtensionRequired, extensionReady, isConnected, connect, disconnect } = useWallet(HashpackConnector);
  const { data: balance } = useBalance();
  const userBalance = balance?.formatted ?? '0 ℏ ';

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      console.error(error.message);
    }
  };

  if (isExtensionRequired && !extensionReady) {
    return <span>Extension not found. Please install it</span>;
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

const AddAccountToWhiteListBtn = ({ accountAddress }: { accountAddress: string }) => {
  const { writeContract } = useWriteContract({ connector: HashpackConnector });
  const { watch } = useWatchTransactionReceipt({ connector: HashpackConnector });
  const { isExtensionRequired, extensionReady, isConnected, connect, disconnect } = useWallet(HashpackConnector);

  const handleAddToWhitelist = async () => {
    if (isExtensionRequired && !extensionReady) {
      alert('please install hashpack')
      return;
    }
    if (!isConnected) { 
      alert('please connect to your wallet first, connect button is on the top right of the page')
      return;
    }
    try {
      const transactionIdOrHash = await writeContract({
        contractId: ContractId.fromString("0.0.5723470"),
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
        metaArgs: { gas: 120_000 },
        args: [accountAddress as `0x${string}`],
      });
      console.log(transactionIdOrHash);

      watch(transactionIdOrHash?.toString() ?? "", {
        onSuccess: (transaction) => {
          toast.success("Successfully added to whitelist!");
          return transaction
        },
        onError: (transaction, error) => {
          toast.error(`Error: ${error}`);
          return transaction
        },
      });
    } catch (e) {
      console.error(e);
      // alert(e);
    }
  };

  return (
    <button
      onClick={handleAddToWhitelist}
      className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4 w-155">
      Add to Whitelist
    </button>
  );
};
const CheckWhiteListeBtn = ({ accountId }: { accountId: string }) => {
  const { ethereum } = window;
  const web3 = new Web3(ethereum);
  const [whiteListedMessage, setCheckWhiteListedMessage] = useState('');
  const accountIdsSet = new Set<string>();
  function decodeEvent(eventName: string, log: any, topics: any) {
    const eventAbi = [{
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "accountId",
          type: "address"
        }
      ],
      name: "WhiteListAccount",
      type: "event"
    }]
    const decodedLog = web3.eth.abi.decodeLog(eventAbi[0].inputs, log, topics);
    console.log(decodedLog)
    return decodedLog;
  }

  const handleCheckWhiteList = async () => {
    try {
      setCheckWhiteListedMessage('loading')
      console.log('loading')
      const delay = (ms: any) => new Promise((res) => setTimeout(res, ms));
      console.log(`\nGetting event(s) from mirror`);
      console.log(`Waiting 10s to allow transaction propagation to mirror`);
      await delay(10000);

      const url = `https://testnet.mirrornode.hedera.com/api/v1/contracts/0.0.5723470/results/logs?order=asc`;


      await axios
        .get(url)
        .then(function (response) {
          const jsonResponse = response.data;

          jsonResponse.logs.forEach((log: any) => {
            // decode the event data
            const event = decodeEvent("WhiteListAccount", log.data, log.topics.slice(1));

            accountIdsSet.add(event.accountId as string);

            // output the from address and message stored in the event
            console.log(
              `Mirror event(s): accountId '${event.accountId}' update to '${event.message}'`
            );
          });
        })
      // Check if accountId exists in accountIdsSet
      if (accountIdsSet.has(accountId)) {
        setCheckWhiteListedMessage(`${accountId} is whitelisted.`);
      } else {
        setCheckWhiteListedMessage(`${accountId} is not whitelisted.`);
      }
    } catch (e) {
      console.error(e);
      alert(e);
    }
  };


  return (
    <div >
      <label className="text-black pt-10 pl-4">Message: {whiteListedMessage}</label>

      <button
        onClick={handleCheckWhiteList}
        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4 w-155">
        Check WhiteListed
      </button>
    </div >
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
        metaArgs: { gas: 120_000 },
        args: [],
      }) as string;
      setMessage(returnedMessage);
      console.log(returnedMessage);
    } catch (e) {
      console.error(e);
      alert(e);
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
  // console.log("window.location.href")
  // console.log(window.location.href)

  const [accountAddress, setAccountAddress] = useState('');

  return (
    <HWBridgeProvider
      metadata={metadata}
      projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
      connectors={[HashpackConnector, KabilaConnector]}
      chains={[HederaTestnet]}
    >
      <ToastContainer />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white">
        <div className="absolute top-4 right-4">
          {/* <button
          onClick={handleWalletConnection}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background h-10 px-4">
          Connect
        </button> */}
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
            <CheckWhiteListeBtn accountId={accountAddress} />
            <AddAccountToWhiteListBtn accountAddress={accountAddress} />
            <CheckContractMessageBtn />

          </div>
        </main>
      </div>

    </HWBridgeProvider>
  );
}
