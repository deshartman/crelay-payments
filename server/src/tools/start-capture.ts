/**
 * Start Payment Capture function - initializes a payment capture session for an active call.
 * This is a generic LLM tool that OpenAI processes normally.
 */
import twilio from 'twilio';
import { logOut, logError } from '../utils/logger.js';

/**
 * Interface for the function arguments
 */
interface StartCaptureFunctionArguments {
    callSid: string;
    chargeAmount?: number;
    [key: string]: any;
}

/**
 * Interface for the response object
 */
interface StartCaptureResponse {
    success: boolean;
    message: string;
    callSid?: string;
    paymentSid?: string;
}

/**
 * Generates an idempotency key for Twilio API requests
 */
function generateIdempotencyKey(callSid: string): string {
    return `${callSid}${Date.now().toString()}`;
}

/**
 * Starts a payment capture session for an active call
 *
 * @param functionArguments - The arguments for the start capture function
 * @returns A response object for conversation context
 */
export default async function (functionArguments: StartCaptureFunctionArguments): Promise<StartCaptureResponse> {
    const log = (msg: string) => logOut('StartCapture', msg);
    const logError_ = (msg: string) => logError('StartCapture', msg);

    log(`Start capture function called with arguments: ${JSON.stringify(functionArguments)}`);

    try {
        // Initialize Twilio client directly
        const accountSid = process.env.ACCOUNT_SID || '';
        const authToken = process.env.AUTH_TOKEN || '';
        const serverUrl = process.env.SERVER_BASE_URL || '';
        const paymentConnector = process.env.PAYMENT_CONNECTOR || '';
        const currency = process.env.CURRENCY || 'USD';
        const tokenType = process.env.TOKEN_TYPE || 'one-time';
        const includeCvc = process.env.INCLUDE_CVC === 'true';
        const includePostalCode = process.env.INCLUDE_POSTAL_CODE === 'false';

        const client = twilio(accountSid, authToken);
        const callSid = functionArguments.callSid;
        const chargeAmount = functionArguments.chargeAmount || 0;

        log(`Starting payment capture for call ${callSid} with charge amount ${chargeAmount}`);
        log(`Status Callback URL: https://${serverUrl}/payment-status-callback`);

        const sessionData: any = {
            idempotencyKey: generateIdempotencyKey(callSid),
            statusCallback: `https://${serverUrl}/payment-status-callback`,
            chargeAmount: chargeAmount,
            currency: currency,
            paymentConnector: paymentConnector,
            securityCode: includeCvc,
            postalCode: includePostalCode
        };

        // Only include tokenType if chargeAmount is 0 (tokenization only)
        if (chargeAmount === 0 && tokenType) {
            sessionData.tokenType = tokenType;
        }

        const paymentSession = await client
            .calls(callSid)
            .payments
            .create(sessionData);

        const response: StartCaptureResponse = {
            success: true,
            message: `Payment session created successfully`,
            callSid: callSid,
            paymentSid: paymentSession.sid
        };

        log(`Payment session created: ${paymentSession.sid}`);
        return response;

    } catch (error) {
        const errorMessage = `Failed to start payment capture: ${error instanceof Error ? error.message : String(error)}`;
        logError_(errorMessage);

        return {
            success: false,
            message: errorMessage
        };
    }
}
