import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!clientId) {
  console.warn("NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set. Some features may not work.");
}

export const thirdwebClient = createThirdwebClient({
  clientId: clientId || "development",
});
