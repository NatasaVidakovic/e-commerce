export interface Voucher {
  id: number;
  code: string;
  description?: string;
  amountOff?: number;
  percentOff?: number;
  isActive: boolean;
  createdAt: string;
}
