/**
 * TypeScript interfaces for Agent Assisted Payments (AAP) functionality
 */

/**
 * Valid capture types for payment data
 */
export enum CaptureType {
    PAYMENT_CARD_NUMBER = 'payment-card-number',
    SECURITY_CODE = 'security-code',
    EXPIRATION_DATE = 'expiration-date'
}

/**
 * Valid payment session status values
 */
export enum PaymentStatus {
    COMPLETE = 'complete',
    CANCEL = 'cancel'
}

/**
 * Parameters for starting a payment capture session
 */
export interface StartCaptureParams {
    callSid: string;
    chargeAmount: number;
    currency: string;
    tokenType?: string;
}

/**
 * Parameters for changing what is being captured
 */
export interface ChangeCaptureParams {
    callSid: string;
    paymentSid: string;
    captureType: CaptureType;
}

/**
 * Parameters for changing payment session status
 */
export interface ChangeStatusParams {
    callSid: string;
    paymentSid: string;
    status: PaymentStatus;
}

/**
 * Twilio payment session response object
 */
export interface PaymentSessionResponse {
    sid: string;
    accountSid: string;
    callSid: string;
    chargeAmount: number;
    currency: string;
    status: string;
    paymentConnector: string;
    securityCode: boolean;
    postalCode: boolean;
    result?: string;
    paymentMethod?: string;
    paymentError?: string;
    dateCreated: Date;
    dateUpdated: Date;
    uri: string;
    [key: string]: any;
}

/**
 * Payment status callback payload from Twilio
 */
export interface PaymentStatusCallback {
    CallSid: string;
    PaymentSid: string;
    Status: string;
    Result?: string;
    PaymentCardNumber?: string;
    PaymentCardType?: string;
    SecurityCode?: string;
    ExpirationDate?: string;
    PaymentToken?: string;
    PaymentError?: string;
    PartialResult?: boolean;
    [key: string]: any;
}
