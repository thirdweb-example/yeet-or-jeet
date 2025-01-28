export const askNebula = async (message) => {
  const response = await fetch("https://nebula-api.thirdweb.com", {
    method: "POST",
    headers: {
      "x-secret-key": process.env.TW_SECRET_KEY || "",
    },
    body: JSON.stringify({
      message: message,
      user_id: "default-user",
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(`Perplexity API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data;
};

