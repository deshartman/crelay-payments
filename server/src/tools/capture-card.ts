/**
 * Capture Card function - captures payment card number for an active payment session.
 * This is a generic LLM tool that OpenAI processes normally.
 */
import twilio from 'twilio';
import { logOut, logError } from '../utils/logger.js';

/**
 * Interface for the function arguments
 */
interface CaptureCardFunctionArguments {
    callSid: string;
    paymentSid: string;
    [key: string]: any;
}

/**
 * Interface for the response object
 */
interface CaptureCardResponse {
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
            logError('CaptureCard', `Call ${callSid} is not in progress. Current status: ${call.status}`);
            return false;
        }
        return true;
    } catch (error) {
        logError('CaptureCard', `Error validating call status: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

/**
 * Captures payment card number for an active payment session
 *
 * @param functionArguments - The arguments for the capture card function
 * @returns A response object for conversation context
 */
export default async function (functionArguments: CaptureCardFunctionArguments): Promise<CaptureCardResponse> {
    const log = (msg: string) => logOut('CaptureCard', msg);
    const logError_ = (msg: string) => logError('CaptureCard', msg);

    log(`Capture card function called with arguments: ${JSON.stringify(functionArguments)}`);

    try {
        // Initialize Twilio client directly
        const accountSid = process.env.ACCOUNT_SID || '';
        const authToken = process.env.AUTH_TOKEN || '';
        const serverUrl = process.env.SERVER_BASE_URL || '';

        const client = twilio(accountSid, authToken);
        const callSid = functionArguments.callSid;
        const paymentSid = functionArguments.paymentSid;

        log(`Capturing card number for call ${callSid}, payment ${paymentSid}`);

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
                capture: 'payment-card-number',
                idempotencyKey: generateIdempotencyKey(callSid),
                statusCallback: `https://${serverUrl}/payment-status-callback`
            });

        const response: CaptureCardResponse = {
            success: true,
            message: `Card capture initiated successfully`,
            paymentSid: paymentSid
        };

        log(`Card capture initiated for payment ${paymentSid}`);
        return response;

    } catch (error) {
        const errorMessage = `Failed to capture card: ${error instanceof Error ? error.message : String(error)}`;
        logError_(errorMessage);

        return {
            success: false,
            message: errorMessage
        };
    }
}
