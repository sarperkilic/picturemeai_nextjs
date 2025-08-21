// Firebase Firestore Collection Types

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Credits system
  availableCredits: number;
  freeCreditsUsed: number;
  
  // iyzico fields
  iyzicoCustomerId?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  
  // iyzico data
  iyzicoPaymentId: string;
  iyzicoToken: string;
  
  // Purchase details
  productName: string; // "Starter" or "Creator"
  totalCredits: number; // 20 or 40
  creditsUsed: number;
  creditsRemaining: number; // totalCredits - creditsUsed
  
  // Pricing
  amount: number; // in cents (1200 or 2000)
  currency: string;
  
  // Status
  status: PurchaseStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Generation {
  id: string;
  userId: string;
  
  // Generation data
  prompt: string;
  category: string;
  numImages: number;
  imageUrls: string[]; // Array of generated image URLs
  
  // Generation settings
  imageSize: string;
  style: string;
  renderingSpeed: string;
  
  // Tracking
  creditsUsed: number; // Usually 1 credit per generation
  usedFreeCredit: boolean; // Whether this generation used a free credit
  falRequestId?: string; // FAL request ID for tracking
  
  createdAt: Date;
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  PURCHASES: 'purchases',
  GENERATIONS: 'generations',
} as const; 