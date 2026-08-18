export interface ScheduleInstallment {
  installmentNumber: number;
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
}

export interface GenerateScheduleParams {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  interestType: 'FLAT' | 'REDUCING_BALANCE';
  startDate: Date;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Generates an amortization schedule; the final installment absorbs any rounding remainder so principal/interest sum exactly. */
export function generateRepaymentSchedule(params: GenerateScheduleParams): ScheduleInstallment[] {
  const { principal, annualRatePercent, termMonths, interestType, startDate } = params;
  if (termMonths <= 0) throw new Error('termMonths must be positive');

  return interestType === 'FLAT'
    ? generateFlatSchedule(principal, annualRatePercent, termMonths, startDate)
    : generateReducingBalanceSchedule(principal, annualRatePercent, termMonths, startDate);
}

function generateFlatSchedule(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
  startDate: Date,
): ScheduleInstallment[] {
  const totalInterest = principal * (annualRatePercent / 100) * (termMonths / 12);
  const monthlyPrincipal = round2(principal / termMonths);
  const monthlyInterest = round2(totalInterest / termMonths);

  const rows: ScheduleInstallment[] = [];
  let principalAllocated = 0;
  let interestAllocated = 0;

  for (let i = 1; i <= termMonths; i++) {
    const isLast = i === termMonths;
    const principalDue = isLast ? round2(principal - principalAllocated) : monthlyPrincipal;
    const interestDue = isLast ? round2(totalInterest - interestAllocated) : monthlyInterest;
    principalAllocated = round2(principalAllocated + principalDue);
    interestAllocated = round2(interestAllocated + interestDue);

    rows.push({
      installmentNumber: i,
      dueDate: addMonths(startDate, i),
      principalDue,
      interestDue,
      totalDue: round2(principalDue + interestDue),
    });
  }

  return rows;
}

function generateReducingBalanceSchedule(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
  startDate: Date,
): ScheduleInstallment[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const installment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  const rows: ScheduleInstallment[] = [];
  let remainingBalance = principal;

  for (let i = 1; i <= termMonths; i++) {
    const isLast = i === termMonths;
    const interestDue = round2(remainingBalance * monthlyRate);
    const principalDue = isLast ? round2(remainingBalance) : round2(installment - interestDue);
    remainingBalance = round2(remainingBalance - principalDue);

    rows.push({
      installmentNumber: i,
      dueDate: addMonths(startDate, i),
      principalDue,
      interestDue,
      totalDue: round2(principalDue + interestDue),
    });
  }

  return rows;
}
