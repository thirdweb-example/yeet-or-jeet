"use client";

import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./Loading";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, maxUint256, zeroAddress } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { RefreshCw } from "lucide-react";

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

const RATE_LIMIT_DELAY = 2000; // 2 seconds between API calls
const PRICE_REFRESH_INTERVAL = 30000; // 30 seconds

export function OogaBoogaWidget(props: OogaBoogaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [priceData, setPriceData] = useState<PriceDisplayData | null>(null);
  const [swapData, setSwapData] = useState<SwapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSwapConfirmation, setShowSwapConfirmation] = useState(false);
  const [lastApiCall, setLastApiCall] = useState(0);
  const { address } = useAccount();
  const { writeContract, data: swapTxHash } = useWriteContract();
  const { isLoading: isTransactionPending } = useWaitForTransactionReceipt({
    hash: swapTxHash,
  });
  const priceRefreshInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const baseUrl = getApiBaseUrl(props.chainId);

  // Rate limiting helper
  const rateLimitedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastCall));
    }
    
    setLastApiCall(Date.now());
    return fetch(url, options);
  }, [lastApiCall]);

  // Check token allowance with rate limiting
  const checkAllowance = useCallback(async () => {
    if (!address || !props.fromTokenAddress || props.fromTokenAddress === zeroAddress) {
      return;
    }

    setIsCheckingAllowance(true);
    try {
      const response = await rateLimitedFetch(
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
  }, [address, props.fromTokenAddress, amount, baseUrl, rateLimitedFetch]);

  // Approve token with rate limiting
  const approveToken = async () => {
    if (!address || !props.fromTokenAddress) return;

    try {
      const response = await rateLimitedFetch(
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

  // Fetch price data with rate limiting
  const fetchPriceData = useCallback(async () => {
    try {
      if (!props.toTokenAddress && !props.fromTokenAddress) {
        return;
      }

      setIsRefreshing(true);
      const response = await rateLimitedFetch(
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
    } finally {
      setIsRefreshing(false);
    }
  }, [props.toTokenAddress, props.fromTokenAddress, baseUrl, rateLimitedFetch]);

  // Set up price refresh interval
  useEffect(() => {
    fetchPriceData();
    
    priceRefreshInterval.current = setInterval(fetchPriceData, PRICE_REFRESH_INTERVAL);
    
    return () => {
      if (priceRefreshInterval.current) {
        clearInterval(priceRefreshInterval.current);
      }
    };
  }, [fetchPriceData]);

  // Check allowance when amount changes
  useEffect(() => {
    if (amount) {
      checkAllowance();
    }
  }, [amount, checkAllowance]);

  // Fetch swap data with rate limiting
  const fetchSwapData = useCallback(async () => {
    if (!amount || !props.fromTokenAddress || !props.toTokenAddress) return;

    try {
      const response = await rateLimitedFetch(
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
      setShowSwapConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load swap data");
    }
  }, [amount, props.fromTokenAddress, props.toTokenAddress, props.chainId, address, rateLimitedFetch, baseUrl]);

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
      setShowSwapConfirmation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute swap");
    }
  };

  if (!(props.chainId in oogaBoogaChainMap)) {
    console.error(`OogaBoogaWidget: Unsupported chainId ${props.chainId}`);
    return null;
  }

  const chainId = props.chainId as keyof typeof oogaBoogaChainMap;

  const queryParams = new URLSearchParams({
    chain: oogaBoogaChainMap[chainId],
    exactField: "input",
  });

  if (props.toTokenAddress) {
    queryParams.set("outputCurrency", props.toTokenAddress);
  }

  if (props.fromTokenAddress) {
    queryParams.set("inputCurrency", props.fromTokenAddress);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full"
        >
          Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Swap Tokens</DialogTitle>
          <DialogDescription>
            Powered by OogaBooga
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          {error ? (
            <div className="flex items-center justify-center h-[600px] text-red-500">
              {error}
            </div>
          ) : (
            <div className="relative">
              {(!isLoaded || isTransactionPending) && <LoadingIframe className="absolute inset-0" />}
              <div className={cn("space-y-6", (!isLoaded || isTransactionPending) && "invisible")}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchPriceData}
                      disabled={isRefreshing}
                      className="h-8 w-8"
                    >
                      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                    {priceData && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-lg font-bold">${priceData.price.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full"
                      disabled={isTransactionPending}
                    />
                    {needsApproval ? (
                      <Button
                        onClick={approveToken}
                        className="w-full"
                        disabled={!address || isCheckingAllowance || isTransactionPending}
                      >
                        {isTransactionPending ? "Transaction Pending..." : "Approve Token"}
                      </Button>
                    ) : (
                      <Button 
                        onClick={fetchSwapData}
                        className="w-full"
                        disabled={!amount || !address || isCheckingAllowance || isTransactionPending}
                      >
                        {isTransactionPending ? "Transaction Pending..." : "Get Swap Quote"}
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Price Impact</p>
                                <p className={cn(
                                  "text-xl font-bold",
                                  swapData.priceImpact > 0.01 ? "text-red-500" : "text-green-500"
                                )}>
                                  {(swapData.priceImpact * 100).toFixed(2)}%
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Price impact shows how much the price will change due to your trade. Higher impact means worse execution price.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={showSwapConfirmation} onOpenChange={setShowSwapConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Swap</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to execute this swap? This action cannot be undone.
              <div className="mt-4 space-y-2">
                <p>Amount In: {(BigInt(swapData?.amountIn || "0") / BigInt(10 ** 18)).toString()} {props.fromTokenAddress === zeroAddress ? "BERA" : swapData?.tokens[0]?.symbol}</p>
                <p>Amount Out: {(BigInt(swapData?.assumedAmountOut || "0") / BigInt(10 ** 18)).toString()} {props.toTokenAddress === zeroAddress ? "BERA" : swapData?.tokens[1]?.symbol}</p>
                <p>Price Impact: {(swapData?.priceImpact || 0 * 100).toFixed(2)}%</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSwap}>Confirm Swap</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
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