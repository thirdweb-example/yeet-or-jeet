export const calculateGrowthScore = (data: { date: string; count: number }[]) => {
  // Extract counts and dates sorted by time (ascending order)
  const timeSeries = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
  const counts = timeSeries.map((item) => item.count);

  // Calculate hourly growth rates
  const growthRates = [];
  for (let i = 1; i < counts.length; i++) {
    const prev = counts[i - 1];
    const curr = counts[i];
    const growthRate = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    growthRates.push(growthRate);
  }

  // Apply a moving average (e.g., 3-hour window)
  const window = 3;
  const smoothedGrowthRates = [];
  for (let i = 0; i <= growthRates.length - window; i++) {
    const windowSlice = growthRates.slice(i, i + window);
    const average = windowSlice.reduce((sum, val) => sum + val, 0) / window;
    smoothedGrowthRates.push(average);
  }
  // Scale the smoothed growth rates to a 0–100 range
  const minGrowth = Math.min(...smoothedGrowthRates);
  const maxGrowth = Math.max(...smoothedGrowthRates);
  const scaledGrowthRates = smoothedGrowthRates.map((rate) =>
    maxGrowth > minGrowth
      ? ((rate - minGrowth) / (maxGrowth - minGrowth)) * 100
      : 0
  );
  // Weight recent data points more heavily (exponential weight)
  const weights = scaledGrowthRates.map((_, i) =>
    Math.exp(i - scaledGrowthRates.length)
  );
  const weightedScore =
    scaledGrowthRates.reduce(
      (sum, rate, i) => sum + rate * weights[i],
      0
    ) / weights.reduce((sum, weight) => sum + weight, 0);

  return Math.round(weightedScore * 100) / 100; // Round to 2 decimal places
};