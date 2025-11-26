# Conversation Relay Payments

This is the canonical reference implementation for **Twilio Agent Assisted Payments** with Conversation Relay. This repository enables secure payment card capture during AI-powered voice conversations, eliminating PCI DSS compliance burden from your application.

**Fork Status**: This repository was created from the `Payments` branch of [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay), which has since been deleted from the original repository. This makes `crelay-payments` the maintained reference for payment functionality with Conversation Relay.

**Focus**: While based on the Conversation Relay framework, this repository emphasizes secure payment capture, natural language payment flows, and PCI-compliant payment handling. For general Conversation Relay documentation and non-payment features, see the [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) repository.

## Quick Start

### Prerequisites

- Node.js v18
- pnpm
- ngrok
- TypeScript
- Twilio Account with Agent Assisted Payments enabled
- Twilio Payment Connector (configured in Twilio Console)

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

3. Create a `.env` file with your configuration:
```bash
# Server Configuration
PORT=3001
SERVER_BASE_URL=your_server_url

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o

# Twilio Configuration (required)
ACCOUNT_SID=your_twilio_account_sid
AUTH_TOKEN=your_twilio_auth_token
FROM_NUMBER=your_twilio_phone_number

# Payment Configuration (required for payments)
PAYMENT_CONNECTOR=PCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional Payment Settings
CURRENCY=USD
TOKEN_TYPE=one-time
INCLUDE_CVC=true
INCLUDE_POSTAL_CODE=false
```

### Running the Server

For development:
```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

For production:
```bash
# Using pnpm
pnpm build
pnpm start

# Or using npm
npm run build
npm start
```

The server will start on port 3001 (or automatically select the next available port if 3001 is in use).

### Making Your First Payment-Enabled Call

1. Expose your server using ngrok:
```bash
ngrok http --domain server-yourdomain.ngrok.dev 3001
```

2. Configure your Twilio phone number:
   - Go to Twilio Console > Phone Numbers > Active Numbers
   - Select your phone number
   - Under "Voice & Fax" > "A Call Comes In"
   - Set to "Webhook" and enter: `https://server-yourdomain.ngrok.dev/connectConversationRelay`
   - Method: HTTP POST

3. Call your Twilio number and say "I'd like to make a payment"

See the [Complete Payment Flow](#complete-payment-flow) section for detailed implementation guidance.

## Payment Features Overview

### What is Conversation Relay Payments?

Conversation Relay Payments combines Twilio's **Agent Assisted Payments** API with AI-powered voice conversations to enable:

- **Secure Payment Card Capture**: Collect payment information during voice calls without exposing sensitive data
- **No PCI Compliance Burden**: Twilio handles all sensitive payment information, reducing your PCI DSS compliance scope
- **Natural Language AI Integration**: AI agent guides users through payment entry with conversational prompts
- **Real-Time Payment Feedback**: Receive immediate status updates on payment capture progress
- **Tokenization Support**: Generate payment tokens for immediate charges or future recurring billing

### The Six Payment Tools

1. **`start-capture`** - Initialize payment session
   - Creates a new payment session for an active call
   - Returns payment SID for subsequent operations
   - Supports both immediate charges and tokenization-only mode (charge amount = 0)

2. **`capture-card`** - Collect card number via DTMF
   - Prompts caller to enter card number using phone keypad
   - Card data captured securely by Twilio (never touches your application)
   - Returns masked card number (e.g., "************1234")

3. **`capture-security-code`** - Collect CVV/CVC
   - Prompts caller to enter 3 or 4-digit security code
   - Security code captured securely without application access
   - Returns masked code (e.g., "***")

4. **`capture-expiry-date`** - Collect expiration date
   - Prompts caller to enter expiration in MMYY format
   - Expiration data captured securely by Twilio
   - Returns expiration date for validation

5. **`finish-capture`** - Submit payment and generate token
   - Finalizes the payment capture process
   - Submits captured information for processing
   - Returns payment token for transaction processing

6. **`cancel-capture`** - Abort payment session
   - Cancels the active payment capture session
   - Discards all captured payment information
   - Used when caller wants to cancel or encounters errors

### Key Payment Capabilities

- **Idempotency Keys**: Prevent duplicate charges through unique idempotency key generation for each payment operation
- **Real-Time Status Callbacks**: Payment status updates automatically forwarded to conversation sessions via `/payment-status-callback` endpoint
- **Partial Results Support**: Distinguish between partial (in-progress) and complete payment captures for better user feedback
- **Natural Language Confirmation Flow**: AI provides brief confirmations after each capture step ("Got your card", "Code received")
- **Automatic Silence Detection Integration**: Silence monitoring automatically disabled during payment entry to prevent false timeouts
- **Multi-Currency Support**: Configure currency (USD, EUR, GBP, etc.) via environment variables
- **Tokenization Options**: Choose between one-time and reusable tokens for different payment scenarios

## Payment Configuration

### Environment Variables

#### Required Payment Variables

```bash
# Twilio Payment Connector (REQUIRED)
PAYMENT_CONNECTOR=PCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Get from Twilio Console

# Core Twilio Configuration (REQUIRED)
ACCOUNT_SID=your_twilio_account_sid
AUTH_TOKEN=your_twilio_auth_token
FROM_NUMBER=your_twilio_phone_number

# Server Configuration (REQUIRED)
SERVER_BASE_URL=your_server_url  # For payment status callbacks

# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
```

#### Optional Payment Settings

```bash
# Currency for transactions (default: USD)
CURRENCY=USD  # Options: USD, EUR, GBP, AUD, etc.

# Token type for tokenization (default: one-time)
TOKEN_TYPE=one-time  # Options: one-time, reusable

# Include security code capture (default: true)
INCLUDE_CVC=true

# Include postal code capture (default: false)
INCLUDE_POSTAL_CODE=false
```

#### Optional Twilio Edge Configuration

For improved latency in specific regions:

```bash
# Edge location and region (both required if using edges)
TWILIO_EDGE=sydney      # Options: sydney, dublin, ashburn
TWILIO_REGION=au1       # Options: au1, ie1, us1
```

### Payment Connector Setup

#### Creating a Payment Connector

1. **Log in to Twilio Console**: Navigate to [Twilio Console](https://console.twilio.com)

2. **Navigate to Payment Connectors**:
   - Go to Voice > Manage > Agent Assisted Payments
   - Click "Payment Connectors"

3. **Create New Connector**:
   - Click "Create new Payment Connector"
   - Select your payment processor (Stripe, Braintree, etc.)
   - Enter your payment processor credentials
   - Configure connector settings

4. **Copy Payment Connector SID**:
   - After creation, copy the Payment Connector SID (starts with "PC")
   - Add to your `.env` file as `PAYMENT_CONNECTOR`

#### Testing vs Production Connectors

- **Sandbox/Test Connectors**: Use for development and testing with test card numbers
- **Production Connectors**: Use for live payments with real payment processing
- Keep separate connectors for test and production environments

### Payment Context Configuration

The system includes payment-specific AI context and tool configurations:

#### PaymentToolManifest.json

Located in `server/assets/PaymentToolManifest.json`, this file defines all payment tools exposed to the AI:

- 6 payment-specific tools (start-capture, capture-card, etc.)
- Additional conversation tools (send-sms, end-call, etc.)
- Tool descriptions and parameters
- Validation requirements

#### PaymentContext.md

Located in `server/assets/PaymentContext.md`, this file contains AI instructions for:

- Payment workflow procedures
- Natural language confirmation guidelines
- Silence detection management during payments
- Error handling and escalation procedures
- Professional payment interaction style

These files work together to guide the AI through secure, compliant payment collection.

## Complete Payment Flow

### Payment Journey Overview

Here's the complete step-by-step flow for capturing payment information:

```
1. User initiates payment request
   ↓
2. AI calls start-capture tool → Returns paymentSid
   ↓
3. AI calls set-silence-detection (enabled: false) → Disables timeout monitoring
   ↓
4. AI calls capture-card → User enters card via keypad
   ↓
5. Payment status callback (partial results) → AI context updated silently
   ↓
6. Payment status callback (complete) → AI confirms "Got your card"
   ↓
7. AI calls capture-security-code → User enters CVV via keypad
   ↓
8. Payment status callback (complete) → AI confirms "Code received"
   ↓
9. AI calls capture-expiry-date → User enters MMYY via keypad
   ↓
10. Payment status callback (complete) → AI confirms "Got the date"
    ↓
11. AI calls finish-capture → Payment token generated
    ↓
12. AI calls set-silence-detection (enabled: true) → Re-enables timeout monitoring
    ↓
13. AI provides final confirmation → "All set, your payment details are securely captured"
```

### Implementation Example

Here's how the payment tools are called from the AI's perspective (based on `PaymentContext.md` guidelines):

```typescript
// 1. Start payment capture session
const startResult = await callTool('start-capture', {
  callSid: currentCallSid
});
const paymentSid = startResult.paymentSid;  // e.g., "PKxxxxx..."

// 2. Disable silence detection (CRITICAL - prevents timeouts during entry)
await callTool('set-silence-detection', {
  enabled: false
});

// 3. Capture card number
await callTool('capture-card', {
  callSid: currentCallSid,
  paymentSid: paymentSid
});
// AI says: "Enter your card number using your keypad, then press hash."
// Wait for payment status callback (PartialResult: false)
// AI says: "Got your card"

// 4. Capture security code
await callTool('capture-security-code', {
  callSid: currentCallSid,
  paymentSid: paymentSid
});
// AI says: "Enter the 3-digit security code, then press hash."
// Wait for payment status callback (PartialResult: false)
// AI says: "Code received"

// 5. Capture expiry date
await callTool('capture-expiry-date', {
  callSid: currentCallSid,
  paymentSid: paymentSid
});
// AI says: "Enter the expiry as 4 digits - month and year, then press hash."
// Wait for payment status callback (PartialResult: false)
// AI says: "Got the date"

// 6. Finish capture and generate token
await callTool('finish-capture', {
  callSid: currentCallSid,
  paymentSid: paymentSid
});

// 7. Re-enable silence detection (CRITICAL - resume normal conversation)
await callTool('set-silence-detection', {
  enabled: true
});

// 8. Provide final confirmation
// AI says: "All set, your payment details are securely captured."
```

### Natural Language Guidelines

**From PaymentContext.md**:

#### Critical Rules for AI Confirmations

- **Use STATEMENTS, not QUESTIONS**: After each capture step, give brief 2-4 word confirmations
- **DO NOT ask verification questions**: Never say "is that correct?" or "do you want to re-enter?"
- **DO NOT read back digits**: Never repeat specific card numbers or security codes
- **Immediately proceed**: After confirmation, immediately call the next capture tool

#### Good Confirmation Examples (Statements)

- "Got your card"
- "Card received"
- "Got the code"
- "Code received"
- "Got the date"
- "Date received"

#### Bad Confirmation Examples (Questions - DON'T USE)

- ❌ "Is that correct?"
- ❌ "Do you want to re-enter?"
- ❌ "Just to confirm, your card ends in 1234?"
- ❌ "Are those digits right?"

### Payment Status Callbacks

The `/payment-status-callback` endpoint receives real-time updates about payment capture progress:

#### Callback Data Structure

```typescript
{
  CallSid: string;              // Active call SID
  Result: string;               // "success" or "error"
  PartialResult: boolean;       // true = in progress, false = complete
  Capture: string;              // "payment-card-number", "security-code", "expiration-date"
  PaymentCardNumber: string;    // Masked: "************1234"
  SecurityCode: string;         // Masked: "***"
  ExpirationDate: string;       // Format: "MMYY"
  PaymentToken: string;         // Token for payment processing (on finish-capture)
  PaymentError: string;         // Error message if Result === "error"
}
```

#### Partial vs Complete Status

**Partial Results (`PartialResult: true`)**:
- Sent while user is still entering digits
- PaymentCardNumber shows progress: "x", "xx", "xxx", etc.
- AI context updated silently (no response generated)
- Used for internal tracking only

**Complete Results (`PartialResult: false`)**:
- Sent when user presses # to finish entry
- Full masked value available (e.g., "************1234")
- AI context updated AND response triggered
- AI provides brief confirmation statement

#### Using Callback Data

The system automatically:
1. Routes callbacks to the appropriate WebSocket session using `CallSid`
2. Updates AI conversation context with payment data
3. Formats natural language prompts for AI confirmation
4. Triggers AI response only for complete captures

### Error Handling & Best Practices

#### Critical Best Practices

1. **Always Disable Silence Detection**:
   - Call `set-silence-detection` with `enabled: false` immediately after `start-capture`
   - Prevents false timeouts while users enter payment information
   - Critical for user experience during DTMF entry

2. **Always Re-Enable Silence Detection**:
   - Call `set-silence-detection` with `enabled: true` immediately after `finish-capture`
   - Also re-enable when using `cancel-capture` or escalating to live agent
   - Ensures normal conversation timeouts resume

3. **Use Live Agent Handoff for Errors**:
   - If payment capture fails repeatedly, use `live-agent-handoff` tool
   - Provide summary of payment issue in handoff data
   - Never leave caller stuck in payment loop

4. **Implement Timeout Handling**:
   - Even with silence detection disabled, implement reasonable timeouts
   - If no progress after 60-90 seconds, offer to retry or escalate
   - Monitor payment callback logs for stuck sessions

5. **Monitor Payment Callback Logs**:
   - Review callback logs regularly for payment issues
   - Track partial result patterns to identify UX problems
   - Use error messages to improve payment guidance

#### Error Recovery Flow

```typescript
// If payment capture encounters error
if (paymentStatusCallback.Result === "error") {
  // Log the error
  console.error(`Payment error: ${paymentStatusCallback.PaymentError}`);

  // Re-enable silence detection before escalating
  await callTool('set-silence-detection', { enabled: true });

  // Escalate to live agent with context
  await callTool('live-agent-handoff', {
    summary: `Payment capture failed: ${paymentStatusCallback.PaymentError}.
              Customer needs assistance completing payment.`
  });
}
```

## Payment Use Cases

### 1. Telehealth Prescription Refills

**Scenario**: Patient calls to refill prescription, automated payment for co-pay.

**Flow**:
1. AI verifies patient identity and prescription eligibility
2. AI informs patient of co-pay amount: "$25.00"
3. Patient agrees to pay
4. AI initiates payment capture for $25.00 charge
5. Patient enters card information via keypad
6. Payment processed immediately
7. AI sends SMS confirmation with prescription details
8. AI informs patient of pharmacy pickup time

**Benefits**:
- No need for human agent involvement
- PCI-compliant payment handling
- Immediate prescription processing
- Reduced call center costs

### 2. Customer Service Billing Resolution

**Scenario**: Customer calls about billing issue, AI resolves and collects payment.

**Flow**:
1. AI reviews account and identifies billing discrepancy
2. AI explains resolution: "Your correct balance is $150"
3. Customer agrees to pay adjusted amount
4. AI initiates payment capture
5. Customer enters card information
6. Payment processed with correct amount
7. AI confirms payment and updated account balance

**Benefits**:
- Issue resolution without escalation
- Immediate payment collection
- Secure payment handling during live conversation
- Enhanced customer satisfaction

### 3. Donation Campaign Hotline

**Scenario**: Donor calls campaign hotline, AI handles donation via natural conversation.

**Flow**:
1. AI engages in natural conversation about campaign cause
2. Donor indicates desire to donate
3. AI confirms donation amount: "Your generous $100 donation"
4. AI initiates tokenization-only payment capture (charge amount = 0)
5. Donor enters card information
6. AI generates payment token for backend processing
7. Backend processes donation charge
8. AI sends SMS receipt with tax donation information

**Benefits**:
- 24/7 donation acceptance
- Natural, empathetic conversation
- Secure payment tokenization
- Scalable for campaign surges

### 4. Subscription Management & Recurring Billing

**Scenario**: Subscriber calls to update payment method for recurring subscription.

**Flow**:
1. AI verifies subscriber identity
2. Subscriber requests to update credit card
3. AI initiates tokenization-only capture (`chargeAmount: 0`, `tokenType: reusable`)
4. Subscriber enters new card information
5. AI generates reusable payment token
6. Backend stores token for future recurring charges
7. AI confirms: "Your payment method has been updated for future billing"

**Benefits**:
- Easy payment method updates
- Reusable tokens for recurring billing
- No human agent required
- Secure token storage

## Non-Payment Features

This repository includes additional Conversation Relay features that support payment workflows. For detailed documentation on these features, see the [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) repository.

### Supporting Features

**Silence Detection** - Automatic timeout handling during conversations. Can be dynamically enabled/disabled during payment entry. See main repo for configuration details.

**Listen Mode** - Silent operation mode for automated tasks. Useful for testing payment flows without AI responses. See main repo for implementation.

**Language Switching** - Multi-language support for global payment acceptance. Switch TTS and transcription languages during calls. See main repo for language configuration.

**Additional Tools**:
- `send-sms` - Send confirmation messages after payment
- `send-dtmf` - Send touch-tone signals during calls
- `end-call` - Gracefully terminate calls after payment
- `live-agent-handoff` - Escalate to human agent if payment fails
- `play-media` - Play audio messages during payment flow

For comprehensive documentation on these features, visit the [simple-conversation-relay repository](https://github.com/deshartman/simple-conversation-relay).

## Twilio Configuration

### Twilio Phone Number Configuration

1. Configure your Twilio phone number to point to the "connectConversationRelay" endpoint:
   - Go to your Twilio Console > Phone Numbers > Active Numbers
   - Select your phone number
   - Under "Voice & Fax" > "A Call Comes In"
   - Set it to "Webhook" and enter:
     ```
     https://server-yourdomain.ngrok.dev/connectConversationRelay
     ```
   - Method: HTTP POST

### TwiML Configuration

The server dynamically generates TwiML using configuration stored in Twilio Sync Maps or local files. Instead of hardcoded values, all conversation relay parameters are loaded from your configuration:

```typescript
// TwiML is generated dynamically from configuration
const config = await this.getConversationRelayConfig();
const languages = await this.getLanguages();

const conversationRelay = connect.conversationRelay({
    url: `wss://${serverBaseUrl}/conversation-relay`,
    transcriptionProvider: config.transcriptionProvider,
    speechModel: config.speechModel,
    interruptible: config.interruptible,
    ttsProvider: config.ttsProvider,
    voice: config.voice,
    dtmfDetection: config.dtmfDetection,
    welcomeGreeting: config.welcomeGreeting
});
```

**Configuration Management:**
- **File Mode (`"assetLoaderType": "file"`)**: Configuration loaded from `serverConfig.json`
- **Sync Mode (`"assetLoaderType": "sync"`)**: Configuration stored in Twilio Sync, automatically synced from local files on startup

### Twilio Edge Locations (Optional)

Twilio Edge Locations allow you to route API calls through specific data centers for improved latency. This is particularly useful when your infrastructure is located in specific geographic regions.

**Configuration:**

Add these optional environment variables to your `.env` file:

```bash
TWILIO_EDGE=sydney      # Edge location (e.g., sydney, dublin, ashburn)
TWILIO_REGION=au1       # Region code (e.g., au1, ie1, us1)
```

**Available Edge Locations:**

| Location | Edge Value | Region Value | Hostname |
|----------|------------|--------------|----------|
| Sydney (Australia) | `sydney` | `au1` | `api.sydney.au1.twilio.com` |
| Dublin (Ireland) | `dublin` | `ie1` | `api.dublin.ie1.twilio.com` |
| Ashburn (US East) | `ashburn` | `us1` | `api.ashburn.us1.twilio.com` |

**Important Notes:**
- Both `TWILIO_EDGE` and `TWILIO_REGION` must be specified together
- If not configured, the system defaults to Twilio's global low-latency routing

### WebSocket Connection Flow

1. When a call is received, Twilio initiates a WebSocket connection to `wss://server-yourdomain.ngrok.dev/conversation-relay`
2. The server receives a 'setup' message containing call details and custom parameters
3. The server creates service instances and begins processing incoming messages
4. Each WebSocket connection maintains its own isolated session in a wsSessionsMap

## Payment-Focused Architecture

### Payment Tool Architecture

Payment tools in this system follow a specific architectural pattern that differs from generic LLM tools:

#### Direct Twilio API Integration

Payment tools (`start-capture`, `capture-card`, etc.) call the Twilio Payments API directly rather than going through a service layer:

```typescript
// Example from start-capture.ts
export default async function (functionArguments: StartCaptureFunctionArguments) {
    // Initialize Twilio client directly
    const client = twilio(accountSid, authToken);

    // Call Twilio Payments API directly
    const paymentSession = await client
        .calls(callSid)
        .payments
        .create({
            idempotencyKey: generateIdempotencyKey(callSid),
            statusCallback: `https://${serverUrl}/payment-status-callback`,
            chargeAmount: chargeAmount,
            currency: currency,
            paymentConnector: paymentConnector
        });

    return {
        success: true,
        paymentSid: paymentSession.sid
    };
}
```

**Benefits**:
- **Self-Contained**: Tools are portable and don't depend on service layer coupling
- **Type-Safe**: Each tool has specific TypeScript interfaces for arguments and responses
- **Simple Testing**: Easy to test individual tools without complex service mocking
- **Direct Control**: Full control over Twilio API parameters for each payment operation

#### Tool Response Patterns

**Generic LLM Tools** (like `send-sms`):
```typescript
// Returns simple response for OpenAI to process
return {
    success: true,
    message: "SMS sent successfully",
    recipient: to
};
```

**Payment Tools** (like `capture-card`):
```typescript
// Returns simple response for AI conversation context
return {
    success: true,
    message: "Card capture initiated",
    paymentSid: paymentSid
};
// Actual payment data comes via payment-status-callback endpoint
```

### Payment Status Flow

#### WebSocket Message Handling

Payment status updates flow through the system as follows:

```
1. Twilio Payments API → /payment-status-callback endpoint
                        ↓
2. Server routes callback to appropriate WebSocket session using CallSid
                        ↓
3. Payment data formatted as natural language prompt for AI
                        ↓
4. AI conversation context updated with payment information
                        ↓
5. AI generates appropriate response based on payment status
```

#### Payment Callback Processing

The `/payment-status-callback` endpoint:
- Receives payment status from Twilio in real-time
- Distinguishes between partial results (in-progress) and complete captures
- Routes payment data to correct conversation session using CallSid
- Formats confirmation prompts for AI ("confirm card ending in 1234")
- Triggers AI response only for complete captures

#### Session Management for Payments

Each active call has:
- **WebSocket Session**: Stored in `wsSessionsMap` by CallSid
- **Conversation Context**: Maintained in OpenAIResponseService with payment history
- **Payment State**: Tracked through paymentSid from start-capture through finish-capture
- **Silence Detection State**: Managed independently, toggled during payment entry

### Service Integration

#### ConversationRelayService

**Responsibilities**:
- Manages payment tool execution
- Routes payment status callbacks to appropriate AI service
- Handles silence detection state changes during payments
- Coordinates between WebSocket communication and AI responses

**Payment-Specific Methods**:
- Processes tool results with payment data
- Forwards payment callbacks to AI for context update
- Manages silence detection toggling during payment flows

#### OpenAIResponseService

**Responsibilities**:
- Processes AI responses with payment context
- Maintains conversation history including payment interactions
- Generates natural language confirmations for payment steps
- Executes payment tools through tool calling mechanism

**Payment Integration**:
- Receives formatted payment prompts from callbacks
- Includes payment tool manifest in AI context
- Generates brief confirmation statements after captures
- Manages conversation flow during multi-step payment process

#### TwilioService

**Responsibilities**:
- Handles non-payment Twilio operations (calls, SMS, TwiML generation)
- Manages Twilio Sync operations for configuration
- Generates dynamic TwiML for Conversation Relay connections
- Does NOT handle payment operations (tools call Twilio API directly)

**Payment Connector Configuration**:
- Reads `PAYMENT_CONNECTOR` from environment
- Provides connector information for payment tool usage
- Does not directly execute payment operations

For detailed service architecture and design patterns, see the [simple-conversation-relay repository](https://github.com/deshartman/simple-conversation-relay).

## Server Setup & Configuration

### Project Structure

```
.
├── server/                # WebSocket server for conversation relay
│   ├── .env.example      # Example environment configuration
│   ├── package.json      # Server dependencies and scripts
│   ├── tsconfig.json     # TypeScript configuration
│   ├── assets/           # Configuration assets
│   │   ├── PaymentContext.md           # Payment-specific AI context
│   │   ├── PaymentToolManifest.json    # Payment tool definitions
│   │   ├── defaultContext.md           # Default GPT conversation context
│   │   ├── defaultToolManifest.json    # Default available tools
│   │   └── serverConfig.json           # Server configuration
│   ├── src/              # Source code directory
│   │   ├── server.ts     # Main server implementation
│   │   ├── interfaces/   # TypeScript interface definitions
│   │   │   ├── ResponseService.d.ts         # ResponseService interface
│   │   │   ├── ConversationRelay.d.ts      # Conversation Relay interfaces
│   │   │   └── AgentAssistedPayments.d.ts  # Payment type definitions
│   │   ├── services/     # Core service implementations
│   │   │   ├── ConversationRelayService.ts # Implements DI pattern
│   │   │   ├── OpenAIResponseService.ts    # Implements ResponseService
│   │   │   ├── FlowiseResponseService.ts   # Alternative implementation
│   │   │   ├── SilenceHandler.ts           # Silence detection
│   │   │   ├── TwilioService.ts            # Twilio operations
│   │   │   └── CachedAssetsService.ts      # Asset caching
│   │   ├── tools/        # Tool implementations
│   │   │   ├── start-capture.ts            # Initialize payment
│   │   │   ├── capture-card.ts             # Capture card number
│   │   │   ├── capture-security-code.ts    # Capture CVV/CVC
│   │   │   ├── capture-expiry-date.ts      # Capture expiration
│   │   │   ├── finish-capture.ts           # Complete payment
│   │   │   ├── cancel-capture.ts           # Cancel payment
│   │   │   ├── set-silence-detection.ts    # Toggle silence monitoring
│   │   │   ├── end-call.ts                 # End call
│   │   │   ├── live-agent-handoff.ts       # Transfer to agent
│   │   │   ├── send-dtmf.ts                # Send DTMF tones
│   │   │   ├── send-sms.ts                 # Send SMS messages
│   │   │   ├── switch-language.ts          # Change language
│   │   │   └── play-media.ts               # Play audio media
│   │   └── utils/        # Utility functions
│   │       └── logger.ts
```

### Environment Configuration

Create a `.env` file in the server directory with the following variables:

```bash
# Server Configuration
PORT=3001                                    # Server port number
SERVER_BASE_URL=your_server_url              # Base URL for your server (e.g., ngrok URL)

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key          # OpenAI API key for GPT integration
OPENAI_MODEL=gpt-4o                         # OpenAI model to use for conversations

# Twilio Configuration (required for Sync Maps and voice services)
ACCOUNT_SID=your_twilio_account_sid         # Twilio Account SID
AUTH_TOKEN=your_twilio_auth_token           # Twilio Auth Token
API_KEY=your_twilio_api_key                 # Twilio API Key (optional)
API_SECRET=your_twilio_api_secret           # Twilio API Secret (optional)
FROM_NUMBER=your_twilio_phone_number        # Twilio phone number for calls/SMS

# Agent Assisted Payments Configuration (required for payments)
PAYMENT_CONNECTOR=PCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Twilio Payment Connector SID
CURRENCY=USD                                                   # Currency code (USD, EUR, GBP, etc.)
TOKEN_TYPE=one-time                                           # Token type (one-time or reusable)
INCLUDE_CVC=true                                              # Include security code capture
INCLUDE_POSTAL_CODE=false                                     # Include postal code capture

# Twilio Edge Locations (optional, for regional optimization)
TWILIO_EDGE=sydney                          # Edge location (sydney, dublin, ashburn)
TWILIO_REGION=au1                           # Region code (au1, ie1, us1)
```

### Asset Loading System

The system supports flexible asset loading with two distinct approaches:

#### Option 1: File-Based Loading (Recommended for Development)

**Setup**:
1. Set `"assetLoaderType": "file"` in `serverConfig.json`
2. Place your asset files in `server/assets/`
3. Start the server - no external dependencies required

**Benefits**:
- No Twilio Sync required
- Perfect for development and testing
- Version control friendly
- Simple deployment

#### Option 2: Sync-Based Loading (Recommended for Production)

**Setup**:
1. Set `"assetLoaderType": "sync"` in `serverConfig.json`
2. Configure Twilio credentials in `.env`
3. Start the server - Sync infrastructure is created automatically

**Automatic Setup**:
- Service Creation: Creates ConversationRelay Sync service
- Map Creation: Creates Contexts, Manifests, Configuration, Languages maps
- Asset Population: Loads initial data from local files

**Benefits**:
- Centralized configuration management
- Real-time updates without server restart
- Multi-server deployments
- Cloud-based persistence

### Context & Manifest Management

#### Payment Asset Files

**PaymentContext.md**:
- AI instructions for payment workflow
- Natural language confirmation guidelines
- Silence detection management rules
- Error handling procedures

**PaymentToolManifest.json**:
- 6 payment tool definitions
- Additional conversation tools
- Tool parameters and validation
- OpenAI function calling format

**serverConfig.json**:
```json
{
  "ConversationRelay": {
    "Configuration": { /* TwiML settings */ },
    "Languages": [ /* language configurations */ ],
    "SilenceDetection": {
      "enabled": true,
      "secondsThreshold": 20,
      "messages": ["Still there?", "Just checking...", "Are you there?"]
    }
  },
  "AssetLoader": {
    "context": "PaymentContext",
    "manifest": "PaymentToolManifest",
    "assetLoaderType": "file"  // or "sync"
  },
  "Server": {
    "ListenMode": {
      "enabled": false
    }
  }
}
```

For detailed documentation on asset loading, context management, and dynamic configuration, see the [simple-conversation-relay repository](https://github.com/deshartman/simple-conversation-relay).

## Additional Configuration

### Silence Detection

The system includes configurable silence detection that can be dynamically controlled during payment flows. Configure in `serverConfig.json`:

```json
"SilenceDetection": {
  "enabled": true,
  "secondsThreshold": 20,
  "messages": [
    "Still there?",
    "Just checking you are still there?",
    "Hello? Are you still on the line?"
  ]
}
```

**Payment Integration**: The `set-silence-detection` tool allows the AI to disable silence monitoring during payment entry and re-enable it afterward.

For comprehensive silence detection documentation, see [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay).

### Dynamic Context Loading

Contexts and manifests can be switched during active calls using the `updateResponseService` endpoint or through per-call custom parameters. This enables different payment flows for different scenarios.

For detailed context management documentation, see [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay).

## Deployment

### Fly.io Deployment

To deploy the server to Fly.io:

1. Navigate to the server directory:
```bash
cd server
```

2. For new deployments, use the `--no-deploy` option:
```bash
fly launch --no-deploy
```

Take note of the server URL under app = 'XXXXXX' and update your .env file accordingly.

```
SERVER_BASE_URL=XXXXXX.fly.dev
```

3. Ensure your `fly.toml` file has the correct port configuration:
```toml
[http_service]
  internal_port = 3001
```

4. Add the volume mount configuration:
```toml
[mounts]
  source = "assets"
  destination = "/assets"
```

5. Import your environment variables as secrets:
```bash
fly secrets import < .env
```

6. Deploy your application:
```bash
fly deploy
```

### Production Considerations for Payments

**Payment Status Callbacks**:
- Ensure `SERVER_BASE_URL` is publicly accessible for payment callbacks
- Configure firewall rules to allow Twilio IP addresses
- Monitor `/payment-status-callback` endpoint logs

**Payment Connector Configuration**:
- Use production Payment Connector (not test/sandbox)
- Verify payment processor credentials
- Test payment flows in staging environment first

**Monitoring**:
- Track payment success rates
- Monitor for timeout issues during card entry
- Log payment errors for debugging
- Alert on payment callback failures

## Repository Setup & Contributing

### Repository Background

This repository (`crelay-payments`) was created as a new repository from the `Payments` branch of the `simple-conversation-relay` repository. The original Payments branch has been deleted from `simple-conversation-relay`, making this the canonical repository for payment functionality.

### Syncing with Upstream

This setup allows for independent development of payment features while maintaining the ability to pull in updates from the original repository.

**Synchronization Workflow:**
1. The `main` branch of this repository contains the specialized payment implementation
2. Updates can be pulled from the `v4.0` branch of the original `simple-conversation-relay` repository
3. The original repository is configured as the `upstream` remote

**To sync updates from the original repository:**

```bash
# 1. Add the original repository as a remote (if not already added)
git remote add upstream https://github.com/deshartman/simple-conversation-relay.git

# 2. Fetch updates from the original repository
git fetch upstream

# 3. Merge updates from the v4.0 branch
git merge upstream/v4.0

# 4. Resolve any conflicts and commit the merge if needed
```

### Contributing

Contributions to payment functionality are welcome! Please:

1. Test payment flows thoroughly in sandbox/test mode
2. Follow existing TypeScript patterns and interfaces
3. Update documentation for new payment features
4. Add tests for payment tool modifications
5. Ensure PCI DSS compliance in all payment-related code

### Development Workflow

1. Fork the repository
2. Create a feature branch for payment enhancements
3. Test with Twilio sandbox payment connector
4. Submit pull request with detailed payment flow description

## Dependencies

### Server Dependencies

- **express** - Web application framework
- **express-ws** - WebSocket support for Express
- **openai** - OpenAI API client for GPT integration
- **twilio** - Twilio SDK for API operations (including payments)
- **dotenv** - Environment configuration
- **winston** - Logging framework
- **uuid** - Unique identifier generation

### Payment-Specific Requirements

- **Twilio Voice** - For handling phone calls and conversation relay
- **Twilio Agent Assisted Payments** - For secure payment card capture
- **Twilio Sync** (optional) - For storing and retrieving configuration data
- **Twilio SMS** (optional) - For send-sms tool functionality

### Complete Tool Reference

**Payment Tools**:
1. `start-capture` - Initialize payment session
2. `capture-card` - Collect card number via DTMF
3. `capture-security-code` - Collect CVV/CVC
4. `capture-expiry-date` - Collect expiration date
5. `finish-capture` - Submit payment and generate token
6. `cancel-capture` - Abort payment session

**Supporting Tools**:
7. `set-silence-detection` - Toggle silence monitoring
8. `end-call` - Gracefully terminate calls
9. `live-agent-handoff` - Transfer to human agent
10. `send-dtmf` - Send DTMF tones
11. `send-sms` - Send SMS messages
12. `switch-language` - Change TTS/transcription languages
13. `play-media` - Play audio from URLs

## Support & Resources

- **Issues**: Report issues at https://github.com/anthropics/claude-code/issues
- **General CRelay Documentation**: https://github.com/deshartman/simple-conversation-relay
- **Twilio Agent Assisted Payments**: https://www.twilio.com/docs/voice/api/payment-resource
- **Twilio Conversation Relay**: https://www.twilio.com/docs/voice/conversation-relay

---

**Built with**: Twilio Conversation Relay • OpenAI GPT-4 • Twilio Agent Assisted Payments
