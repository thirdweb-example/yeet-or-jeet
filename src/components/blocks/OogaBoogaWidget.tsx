"use client";

import { cn } from "../../lib/utils";
import { zeroAddress } from "viem";

const oogaBoogaChainMap = {
  80094: "berachain",
} as const;

type OogaBoogaWidgetProps = {
  chainId: number;
  toTokenAddress: string | undefined;
  fromTokenAddress: string | undefined;
  className?: string;
};

export function OogaBoogaWidget(props: OogaBoogaWidgetProps) {
  if (!(props.chainId in oogaBoogaChainMap)) {
    console.error(`OogaBoogaWidget: Unsupported chainId ${props.chainId}`);
    return null;
  }

  const params = new URLSearchParams();
    
  // Add fromToken parameter if provided, otherwise use native token (BERA)
  if (props.fromTokenAddress && props.fromTokenAddress !== zeroAddress) {
    params.set("fromToken", props.fromTokenAddress.toUpperCase());
  } else {
    params.set("fromToken", "0X0000000000000000000000000000000000000000");
  }
    
  // Add toToken parameter if provided
  if (props.toTokenAddress) {
    params.set("toToken", props.toTokenAddress.toUpperCase());
  }

  const oogaBoogaUrl = `https://app.oogabooga.io/?${params.toString()}`;

  return (
    <div className={cn("w-full h-[800px] rounded-lg overflow-hidden border border-border", props.className)}>
      <iframe
        src={oogaBoogaUrl}
        className="w-full h-full"
        allow="clipboard-write; web3-storage; web3; clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
} 