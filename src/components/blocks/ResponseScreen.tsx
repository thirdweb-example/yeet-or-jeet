import { useState, useCallback } from "react";
import { WalletBalances } from "./WalletBalances";
import type { Chain } from "thirdweb";

type ResponseScreenProps = {
  response: any; // Replace with actual response type
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
    </div>
  );
} 