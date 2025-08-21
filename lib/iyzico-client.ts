// iyzico Payment Client
// Note: You'll need to install the iyzico SDK: npm install iyzipay

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string; // 'https://sandbox-api.iyzipay.com' for test, 'https://api.iyzipay.com' for production
}

export interface IyzicoPaymentRequest {
  priceId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number; // in cents
  currency: string;
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}

export interface IyzicoPaymentResponse {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  paymentPageUrl?: string;
  token?: string;
}

export class IyzicoClient {
  private config: IyzicoConfig;

  constructor(config: IyzicoConfig) {
    this.config = config;
  }

  // Create payment form
  async createPaymentForm(
    request: IyzicoPaymentRequest
  ): Promise<IyzicoPaymentResponse> {
    try {
      // This is a placeholder implementation
      // You'll need to implement the actual iyzico API call here

      const paymentData = {
        locale: 'tr',
        conversationId: `payment_${Date.now()}`,
        price: request.amount / 100, // Convert cents to currency
        paidPrice: request.amount / 100,
        currency: request.currency,
        basketId: request.priceId,
        paymentGroup: 'PRODUCT',
        callbackUrl: request.callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: request.userId,
          name: request.userName,
          surname: request.userName,
          gsmNumber: '+905350000000',
          email: request.userEmail,
          identityNumber: '74300864791',
          lastLoginDate: new Date().toISOString(),
          registrationDate: new Date().toISOString(),
          registrationAddress: 'Test Address',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34732',
        },
        shippingAddress: {
          contactName: request.userName,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Test Address',
          zipCode: '34732',
        },
        billingAddress: {
          contactName: request.userName,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Test Address',
          zipCode: '34732',
        },
        basketItems: [
          {
            id: request.priceId,
            name:
              request.priceId === 'starter'
                ? 'Starter Package'
                : 'Creator Package',
            category1: 'Credits',
            itemType: 'VIRTUAL',
            price: request.amount / 100,
          },
        ],
      };

      // Make API call to iyzico
      const response = await fetch(
        `${this.config.baseUrl}/payment/iyzipos/checkoutform/initialize/ecom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.secretKey}`).toString('base64')}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        return {
          status: 'success',
          paymentPageUrl: result.paymentPageUrl,
          token: result.token,
        };
      } else {
        return {
          status: 'error',
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        };
      }
    } catch (error) {
      return {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Verify payment callback
  async verifyPayment(
    token: string
  ): Promise<{ status: string; paymentId?: string; error?: string }> {
    try {
      const verifyData = {
        locale: 'tr',
        conversationId: `verify_${Date.now()}`,
        token: token,
      };

      const response = await fetch(
        `${this.config.baseUrl}/payment/iyzipos/checkoutform/auth/ecom/detail`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.secretKey}`).toString('base64')}`,
          },
          body: JSON.stringify(verifyData),
        }
      );

      const result = await response.json();

      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        return {
          status: 'success',
          paymentId: result.paymentId,
        };
      } else {
        return {
          status: 'error',
          error: result.errorMessage || 'Payment verification failed',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Create default iyzico client instance
export const iyzicoClient = new IyzicoClient({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  baseUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://api.iyzipay.com'
      : 'https://sandbox-api.iyzipay.com',
});
