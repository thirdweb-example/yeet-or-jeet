export type TransferCount = {
  date: string;
  count: number;
};

export const getHourlyTransferCount = async (
  chainId: number,
  tokenAddress: string
): Promise<TransferCount[]> => {
  // Get count of transactions hourly in the last day
  const timestampFromS = Math.floor(Date.now() / 1000) - 86400;
  const topic0 =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // Transfer(address,address,uint256)
  const response = await fetch(
    `https://${chainId}.insight.thirdweb.com/v1/events/${tokenAddress}?filter_topic_0=${topic0}&aggregate=toStartOfHour(toDateTime(block_timestamp)) as date&filter_block_timestamp_gte=${timestampFromS}&aggregate=sum(1) as count&group_by=date&sort_by=date&sort_order=desc`,
    {
      headers: {
        "x-client-id": "19255e4378bcebf704d1dbd5b950ae57",
      },
    }
  );
  const data = await response.json();
  return Object.values<TransferCount>(data.aggregations?.[0] || {}).filter(
    (item) => typeof item === "object" && "date" in item && "count" in item
  );
};

export type UserToken = {
  chainId: number;
  tokenAddress: string;
  balance: string;
};

export const getErc20TokensForAddress = async (
  chainId: number,
  walletAddress: string
): Promise<UserToken[]> => {
  console.log(">>>getErc20TokensForAddress");
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";
  return (
    (
      await (
        await fetch(
          `https://${chainId}.insight.thirdweb.com/v1/${clientId}/tokens/erc20/${walletAddress}`,
          {
            headers: {
              "x-client-id": clientId,
            },
          }
        )
      ).json()
    )?.data || []
  );
};
