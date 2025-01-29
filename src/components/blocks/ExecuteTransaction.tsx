"use client";

import { useTheme } from "next-themes";
import { defineChain, prepareTransaction } from "thirdweb";
import {
  TransactionButton,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import { supportedChains } from "../../lib/supportedChains";
import { getCustomizedThirdwebTheme } from "../../lib/thirdweb-theme";
import { thirdwebClient } from "../../lib/thirdweb-client";
import { CustomizedConnectButton } from "./CustomConnectButton";
import { Button } from "../ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingSpinner } from "./Loading";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type NebulaTxData = {
  chainId: number;
  data: `0x${string}`;
  to: string;
  value: string;
};

export function ExecuteTransaction(props: {
  txData: NebulaTxData;
  label: string;
  className?: string;
}) {
  const { theme } = useTheme();
  const activeChain = useActiveWalletChain();
  const { txData } = props;
  const chain =
    supportedChains.find((chain) => chain.id === txData.chainId) ||
    defineChain(txData.chainId);
  const switchChain = useSwitchActiveWalletChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const themeObj = getCustomizedThirdwebTheme(
    theme === "light" ? "light" : "dark",
  );

  if (!activeChain) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button className={props.className}>{props.label}</Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[350px]" sideOffset={10}>
          <p className="mb-4">
            Connect your wallet to execute this transaction
          </p>
          <CustomizedConnectButton connectButtonClassName="!w-full" />
        </PopoverContent>
      </Popover>
    );
  }

  if (activeChain.id !== chain.id) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button className={props.className}>{props.label}</Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[350px]" sideOffset={10}>
          <p className="mb-4">
            Switch to {chain.name} to execute this transaction
          </p>
          <Button
            className="w-full gap-2"
            onClick={async () => {
              setIsSwitching(true);
              try {
                await switchChain(chain);
              } catch {
                toast.error("Failed to switch chain");
              }
              setIsSwitching(false);
            }}
          >
            {isSwitching && <LoadingSpinner className="size-4" />}
            Switch Chain
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TransactionButton
      payModal={{
        theme: themeObj,
      }}
      theme={themeObj}
      className={props.className}
      transaction={() => {
        const tx = prepareTransaction({
          chain: chain,
          client: thirdwebClient,
          data: txData.data,
          to: txData.to,
          value: BigInt(txData.value),
        });

        return tx;
      }}
    >
      {props.label}
    </TransactionButton>
  );
}
