/** DtoPaymentSettlementFullInfo — a settlement row linking a PartyPayment to the ExpenseInvoice (or opening-balance line) it closed. */
export interface PaymentSettlementFullInfo {
  id: string;
  expenseInvoiceId: string | null;
  expenseInvoiceNumber: string | null;
  expenseInvoiceDate: string | null;
  partyPaymentId: string | null;
  partyPaymentNumber: string | null;
  amount: number;
  settlementDate: string;
}
