"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getTokenAnalysis } from "./server-actions/getTokenAnalysis";
import { isAddress, type Chain } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

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
import { CustomizedConnectButton } from "../components/blocks/CustomConnectButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultSelectedChain, supportedChains } from "../lib/supportedChains";
import { LoadingSpinner } from "../components/blocks/Loading";
import { useState } from "react";
import { InputsSection } from "../components/blocks/InputsSection";
import { SourcesSection } from "../components/blocks/SourcesSection";
import { TradeSummarySection } from "../components/blocks/TradeSummarySection/TradeSummarySection";
import { MarkdownRenderer } from "../components/blocks/markdown-renderer";
import { ChevronLeft } from "lucide-react";

type NebulaTxData = {
  chainId: number;
  data: `0x${string}`;
  to: string;
  value: string;
};

type Action = {
  label: string;
  description: string;
  subtext: string;
  recommendedPercentage: number;
  txData: NebulaTxData;
};

type Section = {
  section: "inputs" | "verdict" | "details";
  type?: "buy" | "sell" | "hold";
  title?: string;
  description?: string;
  summary?: string;
  actions?: Action[];
  content?: string;
  tokenInfo?: {
    address: string;
    name: string;
    symbol: string;
    price: string;
    marketCap: string;
  };
  walletInfo?: {
    address: string;
    balance: string;
    holdings: string;
  };
};

type TokenAnalysis = {
  sections: Section[];
};

type Screen =
  | { id: "initial" }
  | {
      id: "response";
      props: {
        tokenAddress: string;
        chain: Chain;
        walletAddress: string;
      };
    };

export default function LandingPage() {
  const [screen, setScreen] = useState<Screen>({ id: "initial" });
  const account = useActiveAccount();

  if (screen.id === "initial") {
    return (
      <LandingPageScreen
        onSubmit={(values) => {
          setScreen({
            id: "response",
            props: {
              tokenAddress: values.tokenAddress,
              chain:
                supportedChains.find((chain) => chain.id === values.chainId) ||
                defaultSelectedChain,
              walletAddress: account?.address || "",
            },
          });
        }}
      />
    );
  }

  if (screen.id === "response") {
    return (
      <ResponseScreen
        {...screen.props}
        onBack={() => setScreen({ id: "initial" })}
      />
    );
  }

  return null;
}

function LandingPageScreen(props: {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}) {
  return (
    <main className="grow flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <h1 className="text-6xl lg:text-8xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-t dark:bg-gradient-to-b from-foreground to-foreground/70 tracking-tight inline-flex gap-2 lg:gap-3 items-center">
          <span>Yeet</span>
          <span className="italic font-bold ml-1">or</span>
          <span>Jeet</span>
        </h1>
        <p className="text-xl lg: mb-16 text-muted-foreground font-medium">
          Instant Trading Decisions
        </p>

        <TokenForm
          onSubmit={(values) => {
            props.onSubmit(values);
          }}
        />
      </div>
    </main>
  );
}

function ResponseScreen(props: {
  tokenAddress: string;
  chain: Chain;
  walletAddress: string;
  onBack: () => void;
}) {
  const analysisQuery = useQuery({
    queryKey: [
      "response",
      {
        tokenAddress: props.tokenAddress,
        chain: props.chain.id,
        walletAddress: props.walletAddress,
      },
    ],
    queryFn: async () => {
      const res = await getTokenAnalysis({
        chainId: props.chain.id,
        tokenAddress: props.tokenAddress,
        walletAddress: props.walletAddress,
      });

      if (!res.ok) {
        throw new Error(res.error);
      }

      return res.data as TokenAnalysis;
    },
    retry: false,
  });

  if (analysisQuery.isError) {
    console.error(analysisQuery.error);
  }

  if (analysisQuery.data) {
    const inputSection = analysisQuery.data.sections.find(
      (s) => s.section === "inputs",
    );
    const verdictSection = analysisQuery.data.sections.find(
      (s) => s.section === "verdict",
    );
    const detailsSection = analysisQuery.data.sections.find(
      (s) => s.section === "details",
    );

    return (
      <main className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
        <button
          onClick={props.onBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Back</span>
        </button>

        {inputSection && (
          <InputsSection
            tokenInfo={{
              name:
                verdictSection?.tokenInfo?.symbol ||
                verdictSection?.tokenInfo?.name ||
                "N/A", // TODO: Get from chain
              address: props.tokenAddress,
              priceUSD: verdictSection?.tokenInfo?.price || "0.00",
              marketCapUSD: verdictSection?.tokenInfo?.marketCap || "0",
              volumeUSD: "0",
              tokenIcon: "", // TODO: Get token icon
              chain: props.chain,
            }}
            walletInfo={{
              name: "Wallet",
              address: props.walletAddress,
              balanceUSD: "0",
              winRate: "0%",
              realizedPnL: "0",
              ensImage: "",
              chain: props.chain,
            }}
          />
        )}

        {/* Sources Section */}
        <SourcesSection />

        {/* Results Section */}
        {verdictSection && (
          <TradeSummarySection
            variant={verdictSection.type!}
            title={verdictSection.title!}
            description={verdictSection.description!}
            actions={[]}
          />
        )}

        {/* Details Section */}
        {detailsSection && (
          <div className="space-y-6">
            <div className="space-y-4 columns-2">
              <MarkdownRenderer markdownText={detailsSection.content || ""} />
            </div>
          </div>
        )}

        {/* Actions Section */}
        {verdictSection?.actions && verdictSection.actions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {verdictSection.actions.map((action, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {action.recommendedPercentage}% Recommended
                    </div>
                    {action.subtext && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.subtext}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="grow flex flex-col container max-w-6xl py-10 items-center justify-center">
      {analysisQuery.isPending && <LoadingSpinner className="size-10" />}
      {analysisQuery.isError && (
        <p className="text-red-500">Failed to get response </p>
      )}
    </div>
  );
}

const formSchema = z.object({
  chainId: z.coerce.number().int().min(1, "Chain is required"),
  tokenAddress: z
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

function TokenForm(props: {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}) {
  const account = useActiveAccount();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      chainId: defaultSelectedChain.id,
      tokenAddress: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    props.onSubmit(values);
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
