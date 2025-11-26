/**
 * Finish Capture function - completes and submits a payment capture session.
 * This is a generic LLM tool that OpenAI processes normally.
 */
import twilio from 'twilio';
import { logOut, logError } from '../utils/logger.js';

/**
 * Interface for the function arguments
 */
interface FinishCaptureFunctionArguments {
    callSid: string;
    paymentSid: string;
    [key: string]: any;
}

/**
 * Interface for the response object
 */
interface FinishCaptureResponse {
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
            logError('FinishCapture', `Call ${callSid} is not in progress. Current status: ${call.status}`);
            return false;
        }
        return true;
    } catch (error) {
        logError('FinishCapture', `Error validating call status: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

/**
 * Completes and submits a payment capture session
 *
 * @param functionArguments - The arguments for the finish capture function
 * @returns A response object for conversation context
 */
export default async function (functionArguments: FinishCaptureFunctionArguments): Promise<FinishCaptureResponse> {
    const log = (msg: string) => logOut('FinishCapture', msg);
    const logError_ = (msg: string) => logError('FinishCapture', msg);

    log(`Finish capture function called with arguments: ${JSON.stringify(functionArguments)}`);

    try {
        // Initialize Twilio client directly
        const accountSid = process.env.ACCOUNT_SID || '';
        const authToken = process.env.AUTH_TOKEN || '';
        const serverUrl = process.env.SERVER_BASE_URL || '';

        const client = twilio(accountSid, authToken);
        const callSid = functionArguments.callSid;
        const paymentSid = functionArguments.paymentSid;

        log(`Completing payment capture for call ${callSid}, payment ${paymentSid}`);

        // Validate call is in progress
        const isValid = await validateCallInProgress(client, callSid);
        if (!isValid) {
            return {
                success: false,
                message: 'Call is not in progress'
            };
        }

        const completedSession = await client
            .calls(callSid)
            .payments(paymentSid)
            .update({
                status: 'complete',
                idempotencyKey: generateIdempotencyKey(callSid),
                statusCallback: `https://${serverUrl}/payment-status-callback`
            });

        const response: FinishCaptureResponse = {
            success: true,
            message: `Payment capture completed successfully`,
            paymentSid: paymentSid
        };

        log(`Payment capture completed for payment ${paymentSid}`);
        return response;

    } catch (error) {
        const errorMessage = `Failed to complete payment capture: ${error instanceof Error ? error.message : String(error)}`;
        logError_(errorMessage);

        return {
            success: false,
            message: errorMessage
        };
    }
}
