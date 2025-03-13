import { useState, useCallback } from "react";
import { WalletBalances } from "./WalletBalances";
import type { Chain } from "thirdweb";

interface ResponseSection {
  section: string;
  tokenInfo?: {
    name: string;
    symbol: string;
    price: string;
    marketCap: string;
    chainid: string;
  };
  walletInfo?: {
    address: string;
    balance: string;
    holdings: string;
  };
  type?: 'buy' | 'sell' | 'hold';
  title?: string;
  description?: string;
  summary?: string;
  content?: string;
  actions?: Array<{
    label: string;
    description: string;
    subtext: string;
    recommendedPercentage: number;
    txData: {
      chainId: number;
      data: string;
      to: string;
      value: string;
    };
  }>;
}

type ResponseScreenProps = {
  response: {
    sections: ResponseSection[];
  };
  startingData: {
    walletAddress?: string;
    tokenAddress?: string;
    chain?: Chain;
  };
};

export function ResponseScreen({ response, startingData }: ResponseScreenProps) {
  const [nativeBalance, setNativeBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");

  const handleBalancesChange = useCallback((native: string, token: string) => {
    setNativeBalance(native);
    setTokenBalance(token);
  }, []);

  // Find the details section from the response
  const detailsSection = response.sections.find(section => section.section === 'details');
  const verdictSection = response.sections.find(section => section.section === 'verdict');

  return (
    <div className="flex flex-col gap-4 w-full">
      {startingData.walletAddress && startingData.tokenAddress && startingData.chain && (
        <WalletBalances
          walletAddress={startingData.walletAddress}
          tokenAddress={startingData.tokenAddress}
          chain={startingData.chain}
          onBalancesChange={handleBalancesChange}
        />
      )}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span>Native Balance:</span>
          <span>{nativeBalance}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Token Balance:</span>
          <span>{tokenBalance}</span>
        </div>
      </div>
      {verdictSection && (
        <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold">{verdictSection.title}</h2>
          <p>{verdictSection.description}</p>
          <p className="text-lg">{verdictSection.summary}</p>
        </div>
      )}
      {detailsSection?.content && (
        <div className="prose prose-invert max-w-none">
          {detailsSection.content}
        </div>
      )}
    </div>
  );
} 