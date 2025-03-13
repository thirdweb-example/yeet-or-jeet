"use client";

import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./Loading";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, maxUint256, zeroAddress } from "viem";

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
  status: string;
  blockNumber: number;
  tokenFrom: number;
  tokenTo: number;
  price: number;
  priceImpact: number;
  tokens: Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }>;
  amountIn: string;
  amountOutFee: string;
  assumedAmountOut: string;
  route: Array<{
    poolAddress: string;
    poolType: string;
    poolName: string;
    liquiditySource: string;
    poolFee: number;
    tokenFrom: number;
    tokenTo: number;
    share: number;
    assumedAmountIn: string;
    assumedAmountOut: string;
  }>;
  tx: {
    to: string;
    data: string;
    value?: string;
  };
  routerAddr: string;
  routerParams: {
    swapTokenInfo: {
      inputToken: string;
      inputAmount: string;
      outputToken: string;
      outputQuote: string;
      outputMin: string;
      outputReceiver: string;
    };
    pathDefinition: string;
    executor: string;
    referralCode: number;
    value: string;
  };
}

interface PriceData {
  address: string;
  price: number;
}

interface PriceDisplayData {
  price: number;
}

type OogaBoogaWidgetProps = {
  chainId: number;
  toTokenAddress: string | undefined;
  fromTokenAddress: string | undefined;
  className?: string;
};

export function OogaBoogaWidget(props: OogaBoogaWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [priceData, setPriceData] = useState<PriceDisplayData | null>(null);
  const [swapData, setSwapData] = useState<SwapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const baseUrl = getApiBaseUrl(props.chainId);

  // Check token allowance
  const checkAllowance = useCallback(async () => {
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
  }, [address, props.fromTokenAddress, amount, baseUrl]);

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

        const response = await fetch(
          `${baseUrl}/v1/prices?currency=USD`,
          {
            headers: {
              Authorization: `Bearer ${OOGABOOGA_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch price data");
        }

        const data: PriceData[] = await response.json();
        const tokenAddress = props.toTokenAddress || props.fromTokenAddress;
        const tokenPrice = data.find(p => p.address === tokenAddress);
        
        if (tokenPrice) {
          setPriceData({
            price: tokenPrice.price,
          });
        }
        
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
  }, [amount, checkAllowance]);

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

  const handleSwap = async () => {
    if (!swapData?.tx || !swapData.routerParams) return;

    try {
      await writeContract({
        address: swapData.routerAddr as `0x${string}`,
        abi: [{
          name: "swap",
          type: "function",
          stateMutability: "payable",
          inputs: [
            {
              components: [
                { name: "inputToken", type: "address" },
                { name: "inputAmount", type: "uint256" },
                { name: "outputToken", type: "address" },
                { name: "outputQuote", type: "uint256" },
                { name: "outputMin", type: "uint256" },
                { name: "outputReceiver", type: "address" }
              ],
              name: "swapTokenInfo",
              type: "tuple"
            },
            { name: "pathDefinition", type: "bytes" },
            { name: "executor", type: "address" },
            { name: "referralCode", type: "uint256" }
          ],
          outputs: [
            { name: "outputAmount", type: "uint256" }
          ]
        }],
        functionName: "swap",
        args: [
          {
            inputToken: swapData.routerParams.swapTokenInfo.inputToken as `0x${string}`,
            inputAmount: BigInt(swapData.routerParams.swapTokenInfo.inputAmount),
            outputToken: swapData.routerParams.swapTokenInfo.outputToken as `0x${string}`,
            outputQuote: BigInt(swapData.routerParams.swapTokenInfo.outputQuote),
            outputMin: BigInt(swapData.routerParams.swapTokenInfo.outputMin),
            outputReceiver: swapData.routerParams.swapTokenInfo.outputReceiver as `0x${string}`
          },
          swapData.routerParams.pathDefinition as `0x${string}`,
          swapData.routerParams.executor as `0x${string}`,
          BigInt(swapData.routerParams.referralCode)
        ],
        value: BigInt(swapData.routerParams.value),
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
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">${priceData.price.toFixed(6)}</p>
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
                  <p className="text-xl font-bold">
                    {(BigInt(swapData.amountIn) / BigInt(10 ** 18)).toString()} 
                    {props.fromTokenAddress === zeroAddress ? "BERA" : swapData.tokens[0]?.symbol}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount Out</p>
                  <p className="text-xl font-bold">
                    {(BigInt(swapData.assumedAmountOut) / BigInt(10 ** 18)).toString()} 
                    {props.toTokenAddress === zeroAddress ? "BERA" : swapData.tokens[1]?.symbol}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Price Impact</p>
                  <p className="text-xl font-bold">{(swapData.priceImpact * 100).toFixed(2)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="text-sm">
                    {swapData.route.map((r, i) => (
                      <span key={i}>
                        {i > 0 ? " → " : ""}
                        {r.poolName} ({(r.share * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleSwap}
                className="w-full"
                disabled={!swapData.tx || swapData.status !== "Success"}
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