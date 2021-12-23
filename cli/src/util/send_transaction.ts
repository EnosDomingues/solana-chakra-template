import { Connection, PublicKey, SendOptions, Transaction } from "@solana/web3.js";

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

const sendTransaction = async (transaction: Transaction, provider: PhantomProvider, connection: Connection) => {
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

export default sendTransaction;