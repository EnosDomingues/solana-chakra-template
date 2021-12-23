import { Button, Flex, Input } from '@chakra-ui/react'
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  SystemProgram,
  TransactionInstruction,
  SendOptions,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import create_account from '../util/create_account';
import sendTransaction from '../util/send_transaction';
import createTransaction from '../util/create_transaction';

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signAndSendTransaction"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signAndSendTransaction: (
    transaction: Transaction,
    options?: SendOptions
  ) => Promise<{ signature: string }>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<{ signature: string; publicKey: PublicKey }>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
 * The public key of the account we are creating
 */
 let account_pda: PublicKey;

const getProvider = (): PhantomProvider | undefined => {
  if(typeof window !== "undefined") {
    if ("solana" in window) {
      const anyWindow: any = window;
      const provider = anyWindow.solana;
      if (provider.isPhantom) {
        return provider;
      }
    }
  }
};

const NETWORK = clusterApiUrl("devnet");
const CONNECTION = new Connection(NETWORK);
const PROGRAM_ID = 'Fsm28mcKQvRGTovKPvgE4eMomosT6iyJ7ChVZcEjXXmT'
const ACCOUNT_SEED = 'test'
const ACCOUNT = 'FCyZP6YSKvdXr32XRC5FKwyxnAmYrn5PHNkhsN1EG9e3s'

const Home: NextPage = () => {
  const [name, setName] = useState<string>('')
  const provider = getProvider();
  const [, setConnected] = useState<boolean>(false);

  const programCall = async () => {
    if (provider?.publicKey) {
      let fees = 0;

      const {feeCalculator} = await CONNECTION.getRecentBlockhash();

      // Calculate the cost to fund the account
      fees += await CONNECTION.getMinimumBalanceForRentExemption(1000000);

      // Calculate the cost of sending transactions
      fees += feeCalculator.lamportsPerSignature * 100; // wag

      let lamports = await CONNECTION.getBalance(provider.publicKey);

      console.log(
        'Using account',
        provider.publicKey.toBase58(),
        'containing',
        lamports / LAMPORTS_PER_SOL,
        'SOL to pay for fees',
      );

      // Check if the program has been deployed
      const programInfo = await CONNECTION.getAccountInfo(new PublicKey(PROGRAM_ID));

      if (programInfo === null) {
          throw new Error(
            'Program needs to be deployed',
          );
      } else if (!programInfo.executable) {
        throw new Error(`Program is not executable`);
      }

      console.log(`Using program ${PROGRAM_ID}`);

      const accountPublicKey = await PublicKey.createWithSeed(
        provider.publicKey,
        ACCOUNT_SEED,
        new PublicKey(PROGRAM_ID),
      );

      const instruction = new TransactionInstruction({
        keys: [{pubkey: accountPublicKey, isSigner: false, isWritable: true}],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.alloc(0),
      });

      const transaction = await createTransaction([instruction], provider, CONNECTION)

      if(transaction) {
        sendTransaction(
          transaction, 
          provider, 
          CONNECTION)
      }
    }
  }

  const connectToPhantom = async () => {
    try {
      const res = await provider?.connect();
      console.log(res?.publicKey.toString());
    } catch (err) {
      console.warn(err);
    }
  }

  const disconnectToPhantom = async () => {
    try {
      const res = await provider?.disconnect();
    } catch (err) {
      console.warn(err);
    }
  }

  useEffect(() => {
    if (provider) {
      provider.on("connect", () => {
        setConnected(true);
      });
      provider.on("disconnect", () => {
        setConnected(false);
      });
      // try to eagerly connect
      provider.connect({ onlyIfTrusted: true }).catch(() => {
        // fail silently
      });
      return () => {
        provider.disconnect();
      };
    }
  }, [provider]);

  return (
    <Flex h="100vh" w="100%" direction="column" align="center" justify="center" >
      <Flex w="300px" direction="column">
        {provider?.publicKey && (
          <>
            <Input placeholder="Name" onChange={(e) => setName(e.target.value)}/>
            <Button colorScheme="twitter" onClick={() => programCall()} mt="4"> Create </Button>
            <Button colorScheme="twitter" onClick={() => create_account(ACCOUNT_SEED, provider, new PublicKey(PROGRAM_ID) ,CONNECTION)} mt="4"> Create Account </Button>
          </>
        )}
        {provider?.publicKey ? 
          (
            <Button colorScheme="facebook" mt="4" onClick={() => disconnectToPhantom()}> Disconnect </Button>
          ):
          (
            <Button colorScheme="facebook" mt="4" onClick={() => connectToPhantom()}> Connect </Button>
          )
        }
      </Flex>
    </Flex>
  )
}

export default Home
