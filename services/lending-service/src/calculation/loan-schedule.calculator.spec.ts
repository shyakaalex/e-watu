import { generateRepaymentSchedule } from './loan-schedule.calculator';

describe('generateRepaymentSchedule', () => {
  const startDate = new Date('2026-01-01T00:00:00.000Z');

  it('produces equal principal + equal interest installments for FLAT loans', () => {
    const schedule = generateRepaymentSchedule({
      principal: 1200,
      annualRatePercent: 12,
      termMonths: 12,
      interestType: 'FLAT',
      startDate,
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[0]!.principalDue).toBe(100);
    expect(schedule[0]!.interestDue).toBe(12);
    expect(schedule[0]!.totalDue).toBe(112);

    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalDue, 0);
    const totalInterest = schedule.reduce((sum, row) => sum + row.interestDue, 0);
    expect(Math.round(totalPrincipal * 100) / 100).toBe(1200);
    expect(Math.round(totalInterest * 100) / 100).toBe(144);
  });

  it('amortizes REDUCING_BALANCE loans so principal sums exactly with declining interest', () => {
    const schedule = generateRepaymentSchedule({
      principal: 10000,
      annualRatePercent: 12,
      termMonths: 6,
      interestType: 'REDUCING_BALANCE',
      startDate,
    });

    expect(schedule).toHaveLength(6);
    // Interest should strictly decline as the balance amortizes.
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]!.interestDue).toBeLessThan(schedule[i - 1]!.interestDue);
    }
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalDue, 0);
    expect(Math.round(totalPrincipal * 100) / 100).toBe(10000);
  });

  it('handles 0% interest without dividing by zero', () => {
    const schedule = generateRepaymentSchedule({
      principal: 900,
      annualRatePercent: 0,
      termMonths: 3,
      interestType: 'REDUCING_BALANCE',
      startDate,
    });
    expect(schedule.every((row) => row.interestDue === 0)).toBe(true);
    expect(schedule.reduce((sum, row) => sum + row.principalDue, 0)).toBe(900);
  });

  it('sets due dates one month apart starting from the month after startDate', () => {
    const schedule = generateRepaymentSchedule({
      principal: 300,
      annualRatePercent: 10,
      termMonths: 3,
      interestType: 'FLAT',
      startDate,
    });
    expect(schedule[0]!.dueDate.getUTCMonth()).toBe(1); // Feb
    expect(schedule[1]!.dueDate.getUTCMonth()).toBe(2); // Mar
    expect(schedule[2]!.dueDate.getUTCMonth()).toBe(3); // Apr
  });
});
