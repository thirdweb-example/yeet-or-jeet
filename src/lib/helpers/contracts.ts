export const getContractABI = async (
  chainId: number,
  tokenAddress: string,
): Promise<string | undefined> => {
  const response = await fetch(
    `https://contract.thirdweb.com/abi/${chainId}/${tokenAddress}`,
  );
  if (!response.ok) {
    return;
  }
  const data = await response.json();
  return JSON.stringify(data);
};
