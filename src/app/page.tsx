"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ThemeToggleButton } from "../components/blocks/toggle-theme";
import Link from "next/link";
import { CustomizedConnectButton } from "../components/blocks/CustomConnectButton";
import { isAddress } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { TrendingUpDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultSelectedChain, supportedChains } from "../lib/supportedChains";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="container max-w-6xl mx-auto flex justify-between items-center py-3 px-4">
          <div className="text-3xl font-extrabold tracking-tight flex items-center gap-1.5">
            YoJ
            <TrendingUpDownIcon className="size-6 text-foreground" />
          </div>
          <div className="flex items-center gap-3">
            <CustomizedConnectButton />
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <h1 className="text-6xl lg:text-8xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-t dark:bg-gradient-to-b from-foreground to-foreground/70 tracking-tight inline-flex gap-2 lg:gap-3 items-center">
          <span>Yeet</span>
          <span className="italic font-bold ml-1">or</span>
          <span>Jeet</span>
        </h1>
        <p className="text-xl lg: mb-16 text-muted-foreground font-medium">
          Instant Trading Decisions
        </p>

        <TokenForm />
      </main>

      <footer className="border-t border-border py-4">
        <div className="container max-w-6xl mx-auto text-center text-muted-foreground px-5">
          <Link
            className="text-sm hover:text-foreground"
            href="https://thirdweb.com/"
            target="_blank"
          >
            Powered by thirdweb
          </Link>
        </div>
      </footer>
    </div>
  );
}

const formSchema = z.object({
  chainId: z.coerce.number().int().min(1, "Chain is required"),
  tokenAddress: z.z
    .string()
    .min(1, "Token address is required")
    .refine((v) => {
      // don't directly return isAddress(v) because it wil typecase tokenAddress to 0xString
      if (isAddress(v)) {
        return true;
      }

      return false;
    }, "Invalid token address"),
});

function TokenForm() {
  const account = useActiveAccount();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      chainId: defaultSelectedChain.id,
      tokenAddress: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Add your analysis logic here
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="chainId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chain</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-full bg-card border-input text-foreground focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all">
                    <SelectValue placeholder="Select a chain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supportedChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tokenAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="0x123..."
                  {...field}
                  className="w-full bg-card border-input text-foreground placeholder-muted-foreground focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!account ? (
          <CustomizedConnectButton />
        ) : (
          <Button
            type="submit"
            variant="default"
            className="w-full font-semibold"
            disabled={!account}
          >
            Get Answer
          </Button>
        )}
      </form>
    </Form>
  );
}
