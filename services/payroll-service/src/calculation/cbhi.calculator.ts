export function calculateCBHI(grossPay: number, rate: number = 0.005): number {
  return grossPay * rate;
}
