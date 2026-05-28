export interface RSSBResult {
  rssbEmployee: number;
  rssbEmployer: number;
  rssbMedical: number;
}

export function calculateRSSB(
  grossPay: number,
  employeeRate: number = 0.05,
  employerRate: number = 0.05,
  medicalRate: number = 0.075,
): RSSBResult {
  return {
    rssbEmployee: grossPay * employeeRate,
    rssbEmployer: grossPay * employerRate,
    rssbMedical: grossPay * medicalRate,
  };
}
