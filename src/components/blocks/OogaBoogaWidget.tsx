"use client";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
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

  const handleTrade = () => {
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

    // Open OogaBooga in a popup window
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      `https://app.oogabooga.io/?${params.toString()}`,
      "OogaBooga Swap",
      `width=${width},height=${height},left=${left},top=${top},location=yes,status=no,scrollbars=yes`
    );
  };

  return (
    <Button 
      variant="outline" 
      className={cn("w-full", props.className)}
      onClick={handleTrade}
    >
      Trade
    </Button>
  );
} 