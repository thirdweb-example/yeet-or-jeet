"use client";

import thumbsDownGif from "./assets/thumbsdown.gif";
import thumbsUpGif from "./assets/thumbsup.gif";
import thumbsMidGif from "./assets/thumbsmid.gif";
import Image from "next/image";
import { cn } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OogaBoogaWidget } from "../OogaBoogaWidget";
import { Button } from "../../ui/button";

const variantImageMap = {
  buy: thumbsUpGif,
  sell: thumbsDownGif,
  hold: thumbsMidGif,
};

export function TradeSummarySection(props: {
  variant: "sell" | "buy" | "hold";
  title: string;
  description: string;
  chainId: number;
  tokenAddress: string;
}) {
  const variantStyles = {
    buy: "bg-green-500/10 border-green-500/20 text-green-500",
    sell: "bg-red-500/10 border-red-500/20 text-red-500",
    hold: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold tracking-tight mb-4">Analysis Summary</h3>
      <div className={cn(
        "rounded-xl border p-6 space-y-4",
        variantStyles[props.variant]
      )}>
        <div className="flex items-start gap-6">
          <div className="relative size-24 rounded-full overflow-hidden ring-2 ring-background">
            <Image
              src={variantImageMap[props.variant]}
              alt={props.variant}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-2xl font-bold">{props.title}</h4>
            <p className="text-lg text-muted-foreground">{props.description}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className={cn(
                  "rounded-lg font-semibold",
                  props.variant === "buy" && "bg-green-500 hover:bg-green-600",
                  props.variant === "sell" && "bg-red-500 hover:bg-red-600",
                  props.variant === "hold" && "bg-yellow-500 hover:bg-yellow-600"
                )}
              >
                Trade Now
              </Button>
            </DialogTrigger>
            <DialogContent className="!p-0 max-w-[420px] overflow-hidden gap-0">
              <DialogHeader className="border-b">
                <DialogTitle className="px-6 py-4">Trade</DialogTitle>
              </DialogHeader>
              {props.variant === "buy" || props.variant === "sell" ? (
                <OogaBoogaWidget
                  chainId={props.chainId}
                  toTokenAddress={
                    props.variant === "buy" ? props.tokenAddress : undefined
                  }
                  fromTokenAddress={
                    props.variant === "sell" ? props.tokenAddress : undefined
                  }
                />
              ) : (
                <OogaBoogaWidget
                  chainId={props.chainId}
                  toTokenAddress="0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf"
                  fromTokenAddress={props.tokenAddress}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
