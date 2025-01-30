import { fetchPoolInfo, getTokenInfo, PoolInfo, TokenInfo } from "@/lib/geckoterminal"
import { useEffect, useState } from "react"
import {
    defineChain,
    getContract,
    prepareContractCall,
    readContract,
    sendAndConfirmTransaction,
    toUnits,
} from "thirdweb";
import { thirdwebClient } from "@/lib/thirdweb-client"
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import { getErc20TokensForAddress, UserToken } from "@/lib/helpers/insight";

type Account = ReturnType<typeof useActiveAccount>;

// https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments
const uniswapRouterAddress = {
    137: "0xedf6066a2b290C185783862C7F4776A2C8077AD1",
    8453: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    42161: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
};


const getAllowance = async (
    account: Account,
    chainId: number,
    tokenAddress: string,
    routerAddress: string
) => {
    if (!account) throw new Error("No account connected.");

    return await readContract({
        contract: getContract({
            address: tokenAddress,
            chain: defineChain(chainId),
            client: thirdwebClient,
        }),
        method:
            "function allowance(address, address) view returns (uint256)",
        params: [account.address, routerAddress],
    });
}

const approveSpender = async (
    account: Account,
    chainId: number,
    tokenAddress: string,
    routerAddress: string,
    amount: bigint
) => {
    if (!account) throw new Error("No account connected.");

    const transaction = await prepareContractCall({
        contract: getContract({
            address: tokenAddress,
            chain: defineChain(chainId),
            client: thirdwebClient,
        }),
        method:
            "function approve(address spender, uint256 amount) returns (bool)",
        params: [routerAddress, amount],
    });
    console.log("Approve transaction: ", transaction)
    const receipt = await sendAndConfirmTransaction({
        account,
        transaction,
    });
    console.log("Approve receipt: ", receipt)
}

const swapExactTokensForTokens = async (
    account: Account,
    chainId: number,
    routerAddress: string,
    path: string[],
    amountInWei: bigint,
    amountOutMinWei: bigint
) => {
    if (!account) throw new Error("No account connected.");

    // Deadline for the swap (in seconds): e.g., 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    const transaction = await prepareContractCall({
        contract: getContract({
            address: routerAddress,
            chain: defineChain(chainId),
            client: thirdwebClient,
        }),
        method:
            "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
        params: [amountInWei, amountOutMinWei, path, account.address, BigInt(deadline)],
    });
    console.log("Swap transaction: ", transaction)
    const receipt = await sendAndConfirmTransaction({
        account,
        transaction,
    });
    console.log("Swap receipt: ", receipt)
}

const useSwap = (
    chainId: number,
    toTokenAddress: string,
    amountInPercent: number,
    uniswapRouterAddress: string,
    tokenInfo: TokenInfo | undefined
) => {
    const account = useActiveAccount()
    const [poolInfo, setPoolInfo] = useState<PoolInfo>()
    const [fromTokenAddress, setFromTokenAddress] = useState<string>()
    const [amountInWei, setAmountInWei] = useState<bigint>(BigInt(0))


    const swap = async () => {
        toast.info("Initializing swapping")
        try {
            console.log(fromTokenAddress, account?.address, poolInfo, amountInWei)
            if (!fromTokenAddress) throw new Error("User doesn't have any supported tokens")
            if (!account) throw new Error("No account connected.")
            if (!poolInfo) throw new Error("Pool not found.")
            if (!uniswapRouterAddress) throw new Error(`No router address found for chain ${chainId}`);

            // The slippage tolerance (in tokens), or 1%
            const token2Decimals: number = poolInfo.token2.decimals;
            const amountOutMinWei = toUnits(((amountInWei * BigInt(99)) / BigInt(100)).toString(), token2Decimals);

            // Check current allowance
            const currentAllowance = (await getAllowance(account, poolInfo.chainId, fromTokenAddress, uniswapRouterAddress)) || 0;

            toast.info("Approving router to spend")
            if (currentAllowance < amountInWei) {
                console.log("Approving router to spend token1...");
                await approveSpender(account, poolInfo.chainId, fromTokenAddress, uniswapRouterAddress, amountInWei)
                console.log("Router approved.");
            }

            // Perform the Swap
            toast.info("Swapping tokens...")
            console.log("Swapping tokens...");
            const path = [fromTokenAddress, toTokenAddress];
            await swapExactTokensForTokens(account, poolInfo.chainId, uniswapRouterAddress, path, amountInWei, amountOutMinWei)

            console.log("Swap complete!");
            toast.success("Swap complete!")
        } catch (e) {
            console.error(e)
            toast.error((e as Error).message)
        }
    }

    useEffect(() => {
        if (!account?.address) return
        if (!tokenInfo?.pools?.length) return
        getErc20TokensForAddress(chainId, "").then((userTokens: UserToken[]) => {
            const poolsMap: Record<string, string> = {}
            for (const pool of tokenInfo.pools!) {
                const token1 = pool.relationships.baseToken.toLowerCase()
                const token2 = pool.relationships.quoteToken.toLowerCase()
                poolsMap[`${token1}_${token2}`] = pool.address
            }

            const swapUserToken = userTokens.find((userToken: UserToken) => {
                const token1 = userToken.tokenAddress.toLowerCase()
                const token2 = toTokenAddress.toLowerCase()
                return poolsMap[`${token1}_${token2}`]
            })

            if (!swapUserToken) return

            setFromTokenAddress(swapUserToken.tokenAddress)
            setAmountInWei(BigInt(swapUserToken.balance) * BigInt(Math.floor(amountInPercent / 100)))

            const poolAddress = poolsMap[`${swapUserToken.tokenAddress.toLowerCase()}_${toTokenAddress.toLowerCase()}`]
            fetchPoolInfo(chainId, poolAddress)
                .then(setPoolInfo)
                .catch(e => {
                    toast.error("Pool not found");
                    console.error(e)
                })

        }).catch(e => {
            toast.error("Couldn't fetch user tokens")
            console.error(e)
        })
    }, [account?.address, tokenInfo?.address, toTokenAddress])

    return { tokenInfo, poolInfo, swap }
}


/**
 * Just a test component. In actual flow, swap function from useSwap hook must be called. Not tested properly.
 */
export const Swap = () => {
    const [tokenInfo, setTokenInfo] = useState<TokenInfo>()

    const chainId = 8453
    const toTokenAddress = "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"
    const amountInPercent = 10

    const { swap } = useSwap(chainId, toTokenAddress, amountInPercent, uniswapRouterAddress[chainId], tokenInfo)


    useEffect(() => {
        getTokenInfo(chainId, toTokenAddress).then(setTokenInfo).catch(e => toast.error("Cannot fetch token info"));
    }, [chainId, toTokenAddress])

    if (!tokenInfo) return <>Loading token info...</>

    return <div>
        {`<<SWAPPPP>>`}
        <button onClick={swap}>SWAP NOW!!!</button>
    </div>
}
