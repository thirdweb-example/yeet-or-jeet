/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  fetchPoolInfo,
  getTokenInfo,
  PoolInfo,
  TokenInfo,
} from "@/lib/geckoterminal";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";

const uniswapChainMap: { [key: number]: string } = {
  137: "polygon",
  8453: "base",
};


// TODO - add proper typescript types

const Uniswap = ({
  poolInfo,
  chainId,
  fromTokenAddress,
  toTokenAddress,
  amountIn
}: {
  poolInfo: PoolInfo | undefined,
  chainId: number,
  fromTokenAddress: string,
  toTokenAddress: string,
  amountIn: number
}) => {
  if (!poolInfo) return <></>;
  const theme = "dark"
  return (
    <iframe
      src={`https://app.uniswap.org/#/swap?theme=${theme}&chain=${uniswapChainMap[chainId]}&exactField=input&exactAmount=${amountIn}&inputCurrency=${fromTokenAddress}&outputCurrency=${toTokenAddress}`}
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

export const UniswapWidget = ({
  chainId = 8453,
  fromTokenAddress = "0x4200000000000000000000000000000000000006",
  toTokenAddress = "0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf",
  amountIn = 0.02
}) => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>();
  const [poolInfo, setPoolInfo] = useState<PoolInfo>();
  const [tokenAddress, setTokenAddress] = useState<string>();

  const getTokenDetails = async () => {
    if (!tokenAddress) return alert("Invalid token address");
    if (!tokenInfo) return alert("fetch token info")

    fetchPoolInfo(chainId, fromTokenAddress, toTokenAddress, tokenInfo).then(v => {
      setPoolInfo(v.poolInfo)
    }).catch(e => { toast.error("Pool not found"); console.error(e) })
  };

  useEffect(() => {
    getTokenInfo(chainId, toTokenAddress).then(setTokenInfo).catch(() => toast.error("couldn't fetch token info"))
  }, [])

  return (
    <>
      <Input
        type="text"
        defaultValue={"0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf"}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <Button onClick={getTokenDetails}>Predict Now</Button>
      <Uniswap
        poolInfo={poolInfo}
        chainId={chainId}
        fromTokenAddress={fromTokenAddress}
        toTokenAddress={toTokenAddress}
        amountIn={amountIn} />
    </>
  );
};
