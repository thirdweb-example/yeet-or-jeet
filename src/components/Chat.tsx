import { defaultChainId, defaultChainNameUniswap, defaultNetwork, defaultToken, getTokenInfo, getTokenInfoForPool, useGeckoTerminal } from "@/lib/geckoterminal"
import { useState } from "react"
import { useActiveAccount } from "thirdweb/react"

const Uniswap = ({ poolInfo }) => {
    const fromToken = poolInfo?.data?.[0]?.attributes?.address
    const toToken = poolInfo?.data?.[1]?.attributes?.address

    if (!poolInfo) return <></>
    return <iframe
        src={`https://app.uniswap.org/#/swap?theme=dark&chain=${defaultChainNameUniswap}&exactField=input&exactAmount=1&inputCurrency=${fromToken}&outputCurrency=${toToken}`}
        height="660px"
        width="330px"
        style={{ border: 0, margin: "0 auto", marginBottom: "0.5rem", display: 'block', borderRadius: "10px", minWidth: "300px" }}
    />
}

const Chat = () => {
    const account = useActiveAccount()
    const [tokenInfo, setTokenInfo] = useState()
    const [poolInfo, setPoolInfo] = useState()

    const getTokenDetails = async () => {
        try {
            const tokenAddress = document.getElementById("input-token-address")?.value
            if (!tokenAddress) return alert("Invalid token address")

            const tokenInfo = await getTokenInfo(defaultNetwork, tokenAddress)
            setTokenInfo(tokenInfo)

            // selecting first pool as its most popular
            const poolAddress = tokenInfo?.pools?.[0]?.address
            if (!poolAddress) return alert("No pool found")
            getTokenInfoForPool(poolAddress).then(v => setPoolInfo(v)).catch(e => alert("Error getting pool"))
        } catch (e) {
            console.error(e)
        }

    }

    return <>
        <input style={{ color: "black" }} type="text" id="input-token-address" defaultValue={defaultToken[defaultChainId]} />
        <button onClick={getTokenDetails}>Predict Now</button>
        <Uniswap poolInfo={poolInfo} />
    </>
}

export default Chat