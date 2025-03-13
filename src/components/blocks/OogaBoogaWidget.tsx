"use client";

import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./Loading";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAccount, useWriteContract, useSimulateContract } from "wagmi";
import { parseEther, type Address, maxUint256, zeroAddress } from "viem";

const oogaBoogaChainMap = {
  80094: "berachain",
} as const;

const OOGABOOGA_API_KEY = process.env.NEXT_PUBLIC_OOGABOOGA_API_KEY;

if (!OOGABOOGA_API_KEY) {
  console.warn("Missing OOGABOOGA_API_KEY environment variable");
}

const getApiBaseUrl = (chainId: number) => {
  if (chainId === 80084) {
    return "https://bartio.api.oogabooga.io";
  }
  return "https://mainnet.api.oogabooga.io";
};

interface SwapData {
  pathDefinition: string;
  executor: string;
  amountIn: string;
  amountOut: string;
  priceImpact: string;
  gasEstimate: string;
  tx: {
    from: string;
    to: string;
    data: string;
    value?: string;
  };
}

type OogaBoogaWidgetProps = {
  chainId: number;
  toTokenAddress: string | undefined;
  fromTokenAddress: string | undefined;
  className?: string;
};

export function OogaBoogaWidget(props: OogaBoogaWidgetProps) {
  const { theme: _theme } = useTheme();
  const theme = _theme === "dark" ? "dark" : "light";
  const [isLoaded, setIsLoaded] = useState(false);
  const [priceData, setPriceData] = useState<any>(null);
  const [swapData, setSwapData] = useState<SwapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const { address } = useAccount();

  const baseUrl = getApiBaseUrl(props.chainId);

  // Check token allowance
  const checkAllowance = async () => {
    if (!address || !props.fromTokenAddress || props.fromTokenAddress === zeroAddress) {
      return;
    }

    setIsCheckingAllowance(true);
    try {
      const response = await fetch(
        `${baseUrl}/v1/approve/allowance?token=${props.fromTokenAddress}&from=${address}`,
        {
          headers: {
            Authorization: `Bearer ${OOGABOOGA_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check allowance");
      }

      const data = await response.json();
      const currentAllowance = BigInt(data.allowance);
      const requiredAmount = parseEther(amount || "0");
      setNeedsApproval(currentAllowance < requiredAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check allowance");
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  // Approve token allowance
  const approveToken = async () => {
    if (!address || !props.fromTokenAddress) return;

    try {
      const response = await fetch(
        `${baseUrl}/v1/approve?token=${props.fromTokenAddress}&amount=${maxUint256}`,
        {
          headers: {
            Authorization: `Bearer ${OOGABOOGA_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get approval transaction");
      }

      const { tx } = await response.json();
      const { writeContract } = useWriteContract();
      
      await writeContract({
        address: tx.to as `0x${string}`,
        abi: [{
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" }
          ],
          outputs: [{ type: "bool" }],
        }],
        functionName: "approve",
        args: [tx.to, maxUint256],
      });

      setNeedsApproval(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve token");
    }
  };

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        if (!props.toTokenAddress && !props.fromTokenAddress) {
          return;
        }

        const tokenAddress = props.toTokenAddress || props.fromTokenAddress;
        const response = await fetch(
          `${baseUrl}/v1/price/${props.chainId}/${tokenAddress}`,
          {
            headers: {
              Authorization: `Bearer ${OOGABOOGA_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch price data");
        }

        const data = await response.json();
        setPriceData(data);
        setIsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load price data");
        setIsLoaded(true);
      }
    };

    fetchPriceData();
  }, [props.chainId, props.toTokenAddress, props.fromTokenAddress, baseUrl]);

  // Check allowance when amount changes
  useEffect(() => {
    if (amount) {
      checkAllowance();
    }
  }, [amount, props.fromTokenAddress, address]);

  const fetchSwapData = async () => {
    if (!amount || !props.fromTokenAddress || !props.toTokenAddress) return;

    try {
      const response = await fetch(
        `${baseUrl}/v1/swap/${props.chainId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OOGABOOGA_API_KEY}`,
          },
          body: JSON.stringify({
            tokenIn: props.fromTokenAddress,
            tokenOut: props.toTokenAddress,
            amount: parseEther(amount).toString(),
            to: address,
            slippage: 0.005, // 0.5% slippage
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch swap data");
      }

      const data = await response.json();
      setSwapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load swap data");
    }
  };

  const { writeContract } = useWriteContract();

  const handleSwap = async () => {
    if (!swapData?.tx) return;

    try {
      await writeContract({
        address: swapData.tx.to as `0x${string}`,
        abi: [{
          name: "execute",
          type: "function",
          stateMutability: "payable",
          inputs: [{ name: "pathDefinition", type: "bytes" }],
          outputs: [],
        }],
        functionName: "execute",
        args: [swapData.tx.data as `0x${string}`],
        value: swapData.tx.value ? BigInt(swapData.tx.value) : BigInt(0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute swap");
    }
  };

  if (!(props.chainId in oogaBoogaChainMap)) {
    console.error(`OogaBoogaWidget: Unsupported chainId ${props.chainId}`);
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] text-red-500">
        {error}
      </div>
    );
  }

  if (!isLoaded) {
    return <LoadingIframe className="absolute inset-0" />;
  }

  return (
    <div className="relative p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Price Information</h3>
          <span className="text-sm text-muted-foreground">
            Powered by OogaBooga
          </span>
        </div>
        
        {priceData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">${priceData.price}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">24h Change</p>
              <p className={cn(
                "text-2xl font-bold",
                priceData.priceChange24h > 0 ? "text-green-500" : "text-red-500"
              )}>
                {priceData.priceChange24h > 0 ? "+" : ""}{priceData.priceChange24h}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-2xl font-bold">${priceData.volume24h}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-2xl font-bold">${priceData.marketCap}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Swap</h3>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
            {needsApproval ? (
              <Button
                onClick={approveToken}
                className="w-full"
                disabled={!address || isCheckingAllowance}
              >
                Approve Token
              </Button>
            ) : (
              <Button 
                onClick={fetchSwapData}
                className="w-full"
                disabled={!amount || !address || isCheckingAllowance}
              >
                Get Swap Quote
              </Button>
            )}
          </div>

          {swapData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount In</p>
                  <p className="text-xl font-bold">{amount} {props.fromTokenAddress === zeroAddress ? "BERA" : "TOKEN"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount Out</p>
                  <p className="text-xl font-bold">{swapData.amountOut} {props.toTokenAddress === zeroAddress ? "BERA" : "TOKEN"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Price Impact</p>
                  <p className="text-xl font-bold">{swapData.priceImpact}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Gas Estimate</p>
                  <p className="text-xl font-bold">{swapData.gasEstimate} BERA</p>
                </div>
              </div>
              <Button 
                onClick={handleSwap}
                className="w-full"
                disabled={!swapData.tx}
              >
                Execute Swap
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingIframe(props: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[600px] w-full flex items-center justify-center",
        props.className,
      )}
    >
      <LoadingSpinner className="size-10" />
    </div>
  );
} 