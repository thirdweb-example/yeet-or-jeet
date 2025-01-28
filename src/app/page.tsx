"use client"

import Chat from "@/components/Chat";
import { client } from "@/lib/twclient";
import Link from "next/link";
import { ConnectButton, ThirdwebProvider } from "thirdweb/react"
import { inAppWallet } from "thirdweb/wallets";

const walletConfig = [inAppWallet({
  auth: { options: ["email", "passkey", "google"] },
})]

export default function Home() {
  return (
    <ThirdwebProvider>
      <main>
        <div className="border-b py-4">
          <nav className="container">
            <Link href="/" className="font-semibold tracking-tight">
              YeetOrJeet
            </Link>
            <ConnectButton theme="light" client={client} wallets={walletConfig} />;
          </nav>
        </div>
        <Chat />
      </main>
    </ThirdwebProvider>
  );
}
