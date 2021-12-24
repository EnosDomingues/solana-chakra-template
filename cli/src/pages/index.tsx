import { Button, Flex, Spinner, Text, Textarea } from '@chakra-ui/react'
import { deserializeUnchecked } from 'borsh';
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import * as borsh from 'borsh';
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
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

class MessageAccount {
  id = 0;
  sender: string;
  message: string;
  sent_date: string;

  constructor(fields: {
    id: number,
    sender: string,
    message: string,
    sent_date: string,
  }) {
    this.id = fields.id;
    this.sender = fields.sender;
    this.message = fields.message;
    this.sent_date = fields.sent_date;
  }
}

class MessagesAccount {
  sent: MessageAccount[];

  constructor(fields: {
    sent: MessageAccount[],
  }) {
    this.sent = fields.sent;
  }
}

const PROGRAM_ACCOUNT_SCHEMA = new Map([
  [
    MessageAccount, 
    {
      kind: 'struct', 
      fields: [
        ['id', 'u8'],
        ['sender', 'string'],
        ['message', 'string'],
        ['sent_date', 'string'],
      ]
    }
  ],
]);

const MESSAGES_SCHEMA = new Map<any, any>([
  [
    MessageAccount, 
    {
      kind: 'struct', 
      fields: [
        ['id', 'u8'],
        ['sender', 'string'],
        ['message', 'string'],
        ['sent_date', 'string'],
      ]
    }
  ],
  [
    MessagesAccount, 
    {
      kind: 'struct', 
      fields: [
        ['sent', [MessageAccount]],
      ]
    }
  ],
]);

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
const ACCOUNT = 'FCyZP6YSKvdXr32XRC5FKwyxnAmYrn5PHNkhsN1EG9e3'

const Home: NextPage = () => {
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<MessageAccount[]>([])
  const [isAccountLoaded, setIsAccountLoaded] = useState<boolean>(false)
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

      // Check if the program has been deployed
      const programInfo = await CONNECTION.getAccountInfo(new PublicKey(PROGRAM_ID));

      if (programInfo === null) {
          throw new Error(
            'Program needs to be deployed',
          );
      } else if (!programInfo.executable) {
        throw new Error(`Program is not executable`);
      }

      const accountPublicKey = await PublicKey.createWithSeed(
        provider.publicKey,
        ACCOUNT_SEED,
        new PublicKey(PROGRAM_ID),
      );

      const programAccount = new MessageAccount(
        {
          id: 0 ,
          sender: provider.publicKey.toString(),
          message,
          sent_date: new Date((Date.now())).toDateString()
        }
      );

      const instruction = new TransactionInstruction({
        keys: [{pubkey: accountPublicKey, isSigner: false, isWritable: true}],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.from(borsh.serialize(PROGRAM_ACCOUNT_SCHEMA, programAccount)),
      });

      const transaction = await createTransaction([instruction], provider, CONNECTION)

      if(transaction) {
        sendTransaction(
          transaction, 
          provider, 
          CONNECTION).then(() => {
        })
      }

    }
  }

  const connectToPhantom = async () => {
    try {
      await provider?.connect();
    } catch (err) {
      console.warn(err);
    }
  }

  const disconnectToPhantom = async () => {
    try {
      await provider?.disconnect();
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

  useEffect(() => {

    const intervalId = setInterval(() => {
      new Promise(resolve => setTimeout(resolve, 10)).then(async () => {
        const accountInfo = await CONNECTION.getAccountInfo(new PublicKey(ACCOUNT), 'processed');
        
        if (accountInfo === null) {
          throw 'Error: cannot find the greeted account';
        }

        const accountData = deserializeUnchecked(MESSAGES_SCHEMA, MessagesAccount, accountInfo.data);

        console.log(accountData)

        setMessages(accountData.sent);

        setIsAccountLoaded(true)
      
      })
    }, 5000);

    return () => clearInterval(intervalId);

  }, [])

  return (
    <Flex h="100vh" w="100%" direction="column" align="center" justify="center" >
      <Flex w="300px" direction="column" align="center">

          {isAccountLoaded && messages && messages.length > 0 ? (
            <Flex direction="column">
              {messages.map(message => (
                <Flex direction="column" key={message.sent_date}>
                  <Text>Sender: {message.sender}</Text>
                  <Text>Message: {message.message}</Text>
                  <Text>Date: {message.sent_date}</Text>
                </Flex>
              ))}
            </Flex>
          ) : 
          (
            <Spinner color='red.500' />
          )}

        {provider?.publicKey && (
          <>
            <Textarea placeholder="Message" onChange={(e) => setMessage(e.target.value)}/>
            <Button w="100%" colorScheme="twitter" onClick={() => programCall()} mt="4"> Ask </Button>
            {/* <Button w="100%" colorScheme="twitter" onClick={() => create_account(ACCOUNT_SEED, provider, new PublicKey(PROGRAM_ID) ,CONNECTION)} mt="4"> Create Account </Button> */}
          </>
        )}
        {provider?.publicKey ? 
          (
            <Button w="100%" colorScheme="facebook" mt="4" onClick={() => disconnectToPhantom()}> Disconnect </Button>
          ):
          (
            <Button w="100%" colorScheme="facebook" mt="4" onClick={() => connectToPhantom()}> Connect </Button>
          )
        }
      </Flex>
    </Flex>
  )
}

export default Home
