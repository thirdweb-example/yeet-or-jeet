"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defaultSelectedChain, supportedChains } from "@/lib/supportedChains";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Network } from "lucide-react";

interface ChainSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
}

export function ChainSelector({ value, onChange }: ChainSelectorProps) {
  const form = useForm({
    values: {
      chainId: value || defaultSelectedChain.id,
    },
  });

  useEffect(() => {
    if (value) {
      form.setValue("chainId", value);
    }
  }, [value, form]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-[50px] rounded-lg px-3 w-auto bg-card"
        >
          <Network className="size-5" />
          <span className="sr-only">Select chain</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedChains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => {
              form.setValue("chainId", chain.id);
              onChange?.(chain.id);
            }}
          >
            {chain.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
