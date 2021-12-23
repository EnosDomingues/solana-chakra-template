import { Connection, PublicKey, SendOptions, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

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



export default async function crete_account(
   seed: string,
   provider: PhantomProvider, 
   programId: PublicKey,
   connection: Connection) {

  const createTransaction = async (instructions: TransactionInstruction[]) => {
    if (!provider.publicKey) {
      return;
    }
    let transaction = new Transaction().add(...instructions);
    transaction.feePayer = provider.publicKey;
    console.log("Getting recent blockhash");
    const anyTransaction: any = transaction;
    anyTransaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    return transaction;
  };

  const sendTransaction = async (transaction: Transaction) => {
    if (transaction) {
      try {
        let { signature } = await provider.signAndSendTransaction(transaction);
        console.log("aqui")
        console.log(
          "Submitted transaction " + signature + ", awaiting confirmation"
        );
        await connection.confirmTransaction(signature);
        console.log("Transaction " + signature + " confirmed");
      } catch (err) {
        console.warn(err);
        console.log("Error: " + JSON.stringify(err));
      }
    }
  };

  if(provider.publicKey) {
    const accountPublicKey = await PublicKey.createWithSeed(
      provider.publicKey,
      seed,
      programId,
    );
      
    // Check if the account has already been created
    const account = await connection.getAccountInfo(accountPublicKey);
    
    console.log(accountPublicKey.toString())

    if (account === null) {
      console.log(
        'Creating account',
        accountPublicKey.toBase58()
      );
      
      const lamports = await connection.getMinimumBalanceForRentExemption(
        100000,
      );
      
      
      const transaction = await createTransaction([
        SystemProgram.createAccountWithSeed({
          fromPubkey: provider.publicKey,
          basePubkey: provider.publicKey,
          seed: seed,
          newAccountPubkey: accountPublicKey,
          lamports,
          space: 100000,
          programId,
        })
      ])

      if (transaction) {
        await sendTransaction(transaction);
      }


    }
  } else {
    throw new Error(
      'no provider',
    );
  }
}