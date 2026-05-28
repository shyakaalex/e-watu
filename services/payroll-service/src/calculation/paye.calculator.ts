export function calculatePAYE(grossPay: number): number {
  // Band 1: 0 - 30,000 -> 0%
  // Band 2: 30,001 - 100,000 -> 20%
  // Band 3: 100,001+ -> 30%
  if (grossPay <= 30000) return 0;
  if (grossPay <= 100000) {
    return (grossPay - 30000) * 0.2;
  }
  return 70000 * 0.2 + (grossPay - 100000) * 0.3;
}

/*
calculatePAYE(25000)  === 0
calculatePAYE(60000)  === 6000
calculatePAYE(200000) === 44000
*/
