"use client";

import { ConnectButton } from "thirdweb/react";
import { useTheme } from "next-themes";
import { thirdwebClient } from "../../lib/thirdweb-client";
import { supportedChains } from "../../lib/supportedChains";
import { getCustomizedThirdwebTheme } from "../../lib/thirdweb-theme";

export function CustomizedConnectButton(props: {
  connectButtonClassName?: string;
}) {
  const { theme } = useTheme();
  return (
    <ConnectButton
      client={thirdwebClient}
      theme={getCustomizedThirdwebTheme(theme === "dark" ? "dark" : "light")}
      connectModal={{
        size: "wide",
      }}
      chains={supportedChains}
      connectButton={{
        label: "Connect Wallet",
        className: props.connectButtonClassName,
      }}
    />
  );
}
