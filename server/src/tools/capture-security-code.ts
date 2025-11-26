/**
 * Capture Security Code function - captures payment card security code (CVV/CVC) for an active payment session.
 * This is a generic LLM tool that OpenAI processes normally.
 */
import twilio from 'twilio';
import { logOut, logError } from '../utils/logger.js';

/**
 * Interface for the function arguments
 */
interface CaptureSecurityCodeFunctionArguments {
    callSid: string;
    paymentSid: string;
    [key: string]: any;
}

/**
 * Interface for the response object
 */
interface CaptureSecurityCodeResponse {
    success: boolean;
    message: string;
    paymentSid?: string;
}

/**
 * Generates an idempotency key for Twilio API requests
 */
function generateIdempotencyKey(callSid: string): string {
    return `${callSid}${Date.now().toString()}`;
}

/**
 * Validates that a call is in progress before performing payment operations
 */
async function validateCallInProgress(client: twilio.Twilio, callSid: string): Promise<boolean> {
    try {
        const call = await client.calls(callSid).fetch();
        if (call.status !== 'in-progress') {
            logError('CaptureSecurityCode', `Call ${callSid} is not in progress. Current status: ${call.status}`);
            return false;
        }
        return true;
    } catch (error) {
        logError('CaptureSecurityCode', `Error validating call status: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

/**
 * Captures payment card security code for an active payment session
 *
 * @param functionArguments - The arguments for the capture security code function
 * @returns A response object for conversation context
 */
export default async function (functionArguments: CaptureSecurityCodeFunctionArguments): Promise<CaptureSecurityCodeResponse> {
    const log = (msg: string) => logOut('CaptureSecurityCode', msg);
    const logError_ = (msg: string) => logError('CaptureSecurityCode', msg);

    log(`Capture security code function called with arguments: ${JSON.stringify(functionArguments)}`);

    try {
        // Initialize Twilio client directly
        const accountSid = process.env.ACCOUNT_SID || '';
        const authToken = process.env.AUTH_TOKEN || '';
        const serverUrl = process.env.SERVER_BASE_URL || '';

        const client = twilio(accountSid, authToken);
        const callSid = functionArguments.callSid;
        const paymentSid = functionArguments.paymentSid;

        log(`Capturing security code for call ${callSid}, payment ${paymentSid}`);

        // Validate call is in progress
        const isValid = await validateCallInProgress(client, callSid);
        if (!isValid) {
            return {
                success: false,
                message: 'Call is not in progress'
            };
        }

        const updatedSession = await client
            .calls(callSid)
            .payments(paymentSid)
            .update({
                capture: 'security-code',
                idempotencyKey: generateIdempotencyKey(callSid),
                statusCallback: `https://${serverUrl}/payment-status-callback`
            });

        const response: CaptureSecurityCodeResponse = {
            success: true,
            message: `Security code capture initiated successfully`,
            paymentSid: paymentSid
        };

        log(`Security code capture initiated for payment ${paymentSid}`);
        return response;

    } catch (error) {
        const errorMessage = `Failed to capture security code: ${error instanceof Error ? error.message : String(error)}`;
        logError_(errorMessage);

        return {
            success: false,
            message: errorMessage
        };
    }
}
