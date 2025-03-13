"use client";

import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./Loading";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAccount, useWriteContract, useSimulateContract } from "wagmi";
import { parseEther } from "viem";

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
  const { address } = useAccount();

  const baseUrl = getApiBaseUrl(props.chainId);

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
              "Authorization": `Bearer ${OOGABOOGA_API_KEY}`,
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
            fromToken: props.fromTokenAddress,
            toToken: props.toTokenAddress,
            amount: parseEther(amount).toString(),
            slippage: "0.5", // 0.5% slippage
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

  const { data: simulateData } = useSimulateContract({
    address: swapData?.executor as `0x${string}`,
    abi: [
      {
        name: "execute",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "pathDefinition", type: "bytes" }],
        outputs: [],
      },
    ],
    functionName: "execute",
    args: [swapData?.pathDefinition as `0x${string}`],
  });

  const { writeContract, isError: writeError } = useWriteContract();

  const handleSwap = () => {
    if (!simulateData?.request) return;
    writeContract(simulateData.request);
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
            <Button 
              onClick={fetchSwapData}
              className="w-full"
              disabled={!amount || !address}
            >
              Get Swap Quote
            </Button>
          </div>

          {swapData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount In</p>
                  <p className="text-xl font-bold">{amount} ETH</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount Out</p>
                  <p className="text-xl font-bold">{swapData.amountOut} TOKEN</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Price Impact</p>
                  <p className="text-xl font-bold">{swapData.priceImpact}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Gas Estimate</p>
                  <p className="text-xl font-bold">{swapData.gasEstimate} ETH</p>
                </div>
              </div>
              <Button 
                onClick={handleSwap}
                className="w-full"
                disabled={!simulateData?.request || writeError}
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