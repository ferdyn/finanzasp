export type CardBrand = 'visa' | 'mastercard' | 'amex';
export type CardType = 'credit' | 'debit';
export type CardStatus = 'active' | 'frozen' | 'blocked';

export interface DigitalCard {
  id: string;
  accountId: string;
  cardholderName: string;
  brand: CardBrand;
  type: CardType;
  lastFour: string;
  fullNumberMasked: string;
  expiryDate: string; // MM/YY
  status: CardStatus;
  colorGradient: string;
  monthlyLimit: number;
  currentMonthlySpent: number;
  isContactlessEnabled: boolean;
  isOnlineShoppingEnabled: boolean;
  isInternationalEnabled: boolean;
}

export interface KycVerificationData {
  step: number;
  fullName: string;
  documentType: 'dni' | 'nie' | 'passport';
  documentNumber: string;
  birthDate: string;
  nationality: string;
  address: string;
  postalCode: string;
  city: string;
  documentFrontImage: string | null;
  documentBackImage: string | null;
  selfieImage: string | null;
  status: 'draft' | 'pending' | 'verified' | 'rejected';
  riskScore: 'low' | 'medium' | 'high';
  completedAt?: string;
}

export interface FraudAlertData {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string;
  timestamp: string;
  cardLastFour: string;
  cardBrand: CardBrand;
  status: 'pending' | 'approved' | 'blocked';
  riskReason: string;
}
