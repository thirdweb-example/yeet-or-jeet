/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  defaultChainId,
  defaultChainNameUniswap,
  defaultNetwork,
  defaultToken,
  getTokenInfo,
  getTokenInfoForPool,
} from "@/lib/geckoterminal";
import { useState } from "react";
import { Input } from "./ui/input";

// This entire component needs to be refactored

const Uniswap = ({ poolInfo }: { poolInfo: any }) => {
  const fromToken = poolInfo?.data?.[0]?.attributes?.address;
  const toToken = poolInfo?.data?.[1]?.attributes?.address;

  if (!poolInfo) return <></>;
  return (
    <iframe
      src={`https://app.uniswap.org/#/swap?theme=dark&chain=${defaultChainNameUniswap}&exactField=input&exactAmount=1&inputCurrency=${fromToken}&outputCurrency=${toToken}`}
      height="660px"
      width="330px"
      style={{
        border: 0,
        margin: "0 auto",
        marginBottom: "0.5rem",
        display: "block",
        borderRadius: "10px",
        minWidth: "300px",
      }}
    />
  );
};

const Chat = () => {
  const [tokenInfo, setTokenInfo] = useState<object>();
  const [poolInfo, setPoolInfo] = useState();
  const [tokenAddress, setTokenAddress] = useState<string>();

  const getTokenDetails = async () => {
    try {
      if (!tokenAddress) return alert("Invalid token address");

      const tokenInfo = await getTokenInfo(defaultNetwork, tokenAddress);
      setTokenInfo(tokenInfo);

      // selecting first pool as its most popular
      const poolAddress = tokenInfo?.pools?.[0]?.address;
      if (!poolAddress) return alert("No pool found");
      getTokenInfoForPool(poolAddress)
        .then((v) => setPoolInfo(v))
        .catch(() => alert("Error getting pool"));
    } catch (e) {
      console.error(e);
    }
  };

  console.log(tokenInfo);

  return (
    <>
      <Input
        type="text"
        defaultValue={defaultToken[defaultChainId]}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <button onClick={getTokenDetails}>Predict Now</button>
      <Uniswap poolInfo={poolInfo} />
    </>
  );
};

export default Chat;
