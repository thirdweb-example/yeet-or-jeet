"use client";

import { ThemeProvider } from "next-themes";
import { ThirdwebProvider } from "thirdweb/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AutoConnect } from "thirdweb/react";
import { thirdwebClient } from "../../lib/thirdweb-client";

const queryClient = new QueryClient();

export function Providers(props: {
  children: React.ReactNode;
}) {
  return (
    <ThirdwebProvider>
      <AutoConnect client={thirdwebClient} />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        enableSystem={false}
        enableColorScheme={false}
        themes={["light", "dark"]}
      >
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </ThemeProvider>
    </ThirdwebProvider>
  );
}
