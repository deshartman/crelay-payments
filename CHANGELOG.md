# Changelog

## Release v4.9.8.0

### Upstream Merge: Environment-Specific Configuration & Updates

This release merges changes from [simple-conversation-relay v4.9.8](https://github.com/deshartman/simple-conversation-relay) on the v4.0 branch, bringing environment-specific .env file loading and other improvements to the payment repository.

#### 🔄 Merged from Upstream

**Environment-Specific Configuration System (v4.9.8):**
- Automatic environment detection based on `NODE_ENV` variable
- `NODE_ENV=dev` → loads `.env.dev` (development environment)
- `NODE_ENV=prod` → loads `.env.prod` (production environment)
- No `NODE_ENV` → loads `.env` (fallback for backward compatibility)
- Environment validation ensures all required variables are present at startup
- ES module compatible implementation using `fileURLToPath` and path utilities
- Works seamlessly in both development (tsx watch) and production (compiled) modes

**Enhanced Package Scripts:**
- `dev` - Development mode with NODE_ENV=dev (uses .env.dev)
- `start` - Production mode with NODE_ENV=prod (uses .env.prod)
- `start:dev` - Test compiled build with dev config
- `dev:prod` - Test prod config with hot reload
- All scripts work with both npm and pnpm

#### 📝 Files Modified

- `server/src/server.ts` - Environment loading and validation functions from upstream
- `server/package.json` - Version updated to 4.9.8.0, environment-aware scripts from upstream
- `server/.env.example` - Payment-specific environment variables (kept from this repo)
- `server/src/services/TwilioService.ts` - Updated from upstream (cleaner implementation)
- `README.md` - Merged environment documentation into payment-focused structure
- `CHANGELOG.md` - Added v4.9.8.0 release notes

#### 🎯 Benefits

- **Upstream Consistency**: Maintains alignment with canonical simple-conversation-relay implementation
- **Clear Environment Separation**: Development and production configurations explicitly separated
- **Fail-Fast Validation**: Missing configuration caught immediately at startup
- **Developer Experience**: Simple commands (`pnpm dev`, `pnpm start`) automatically use correct environment
- **Production Safety**: Production environment explicitly configured, reducing configuration errors
- **Payment Functionality**: All payment-specific features preserved and working

#### 📚 Documentation

For detailed information about environment-specific configuration, see the [simple-conversation-relay v4.9.8 release notes](https://github.com/deshartman/simple-conversation-relay).

---

## Release v4.9.7.0

### Payment-First Documentation and Repository Setup

This release restructures the repository documentation to emphasize payment functionality and establishes this repository as the canonical reference for Twilio Agent Assisted Payments with Conversation Relay.

#### 📚 Documentation Restructuring

**README Payment-First Focus:**
- Complete README restructure from 1512 lines to 1124 lines with payment-first approach
- New header: "Conversation Relay Payments" - positioned as canonical payment reference
- Quick Start section leads documentation, followed immediately by Payment Features
- Payment Configuration, Complete Payment Flow, and Payment Use Cases featured prominently
- Non-payment features condensed with references to [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay)
- Repository Setup & Contributing section moved to end for contributor workflow clarity

**Payment Documentation Enhancements:**
- Complete payment workflow documentation with 13-step journey
- Six payment tools fully documented with TypeScript implementation examples
- Natural language guidelines from PaymentContext.md (statements vs questions)
- Payment status callbacks explained (partial vs complete results)
- Four real-world payment use cases: Telehealth, Billing Resolution, Donations, Subscriptions
- Payment Connector setup guide with Twilio Console instructions
- Environment-based payment configuration documented

#### 🏗️ Repository Setup

This repository (`crelay-payments`) was created as a new repository from the `Payments` branch of the `simple-conversation-relay` repository. This setup allows for independent development of payment features while maintaining the ability to pull in updates from the original repository.

**Synchronization Workflow:**
- The `main` branch of this repository contains payment-specialized work
- Updates can be pulled from the `v4.0` branch of the original `simple-conversation-relay` repository
- The original repository is configured as the `upstream` remote
- Standard git merge workflow is used to incorporate upstream changes:
  ```bash
  git remote add upstream https://github.com/deshartman/simple-conversation-relay.git
  git fetch upstream
  git merge upstream/v4.0
  ```

This approach provides independent development capabilities while maintaining the option to sync with the original codebase as needed.

#### 📝 Files Modified

- `README.md` - Complete payment-first restructure (1512 → 1124 lines)
- `server/package.json` - Version updated to 4.9.7.0
- `CHANGELOG.md` - Payment-centric changelog with upstream references

---

## Release v4.9.7

### Dynamic Silence Detection Control

This release adds runtime control of silence detection, enabling the LLM to dynamically enable or disable silence monitoring during active calls through a new tool.

#### 🎯 Key Features

**set-silence-detection Tool:**
- New tool allows LLM to toggle silence detection during active conversations
- Enables disabling silence monitoring during activities where callers may not speak (e.g., entering payment information, looking up documents)
- Simple boolean parameter: `enabled` (true to enable, false to disable)
- Returns success confirmation with current silence detection state

**Flag-Based Implementation:**
- Silence timer runs continuously (every 1 second) but checks enabled flag before taking action
- When disabled, timer performs early return without triggering silence messages
- No complex start/stop logic - simple flag check for reliability
- Enabled by default to maintain backward compatibility

**Tool-Driven Architecture:**
- Uses existing outgoingMessage pattern for clean service communication
- Tool returns `outgoingMessage` with type `setSilenceDetection`
- Routes through OpenAIResponseService to ConversationRelayService
- Avoids service coupling by not injecting ConversationRelayService into OpenAIResponseService

#### ✅ Use Cases

**Payment Processing:**
- Disable silence detection while collecting card numbers via DTMF
- Prevents timeout messages during legitimate data entry periods
- Re-enable after payment information is captured

**Document Lookup:**
- Disable when caller is searching for documents or account information
- Allow extended silence without interruption
- Re-enable when ready to continue conversation

This enhancement provides flexible silence detection control while maintaining the simple, reliable flag-based design pattern. The LLM can now intelligently disable silence monitoring during activities where extended silence is expected and appropriate.

---

## Release v4.9.6

### Payment Service Consolidation and Environment Configuration

This release simplifies the payment service architecture by consolidating Agent Assisted Payments functionality directly into TwilioService, and moves payment configuration to environment variables for improved maintainability.

#### 🏗️ Simplified Payment Architecture

**Service Consolidation:**
- **Removed**: Separate `AgentAssistedPaymentsService.ts` file
- **Consolidated**: All payment methods now implemented directly in TwilioService
- **Simplified**: Eliminated facade pattern and lazy initialization complexity
- **Direct Implementation**: Payment methods use `this.twilioClient` directly without delegation

**Architecture Benefits:**
- Single file for all Twilio operations (calls, SMS, payments)
- Simpler code structure with fewer abstractions
- Direct method implementation without delegation overhead
- Aligns with reference implementation philosophy: "intentionally simple"
- Easier to understand and maintain for developers

#### 💰 Environment-Based Payment Configuration

**New Environment Variables:**
- **Added**: `CURRENCY` - Currency code for payments (e.g., USD, EUR, GBP), defaults to 'USD'
- **Added**: `TOKEN_TYPE` - Token type for tokenization (e.g., one-time, reusable), defaults to 'one-time'
- **Enhanced**: Payment configuration now fully environment-driven

**Configuration Consolidation:**
- Removed currency and tokenType from method parameters
- Centralized payment configuration in environment variables
- Consistent configuration access across all payment operations
- Updated `.env.example` with new payment configuration section

#### 🔧 Technical Implementation

**TwilioService Changes:**
- Added payment configuration properties: `currency`, `tokenType`, `paymentConnector`, `serverUrl`, `includeCvc`, `includePostalCode`
- Environment variables read once during constructor initialization
- Six payment methods implemented directly:
  - `startCapture()` - Initialize payment capture session
  - `captureCard()` - Capture card number
  - `captureCvc()` - Capture security code
  - `captureExpDate()` - Capture expiration date
  - `completeCapture()` - Finalize payment
  - `cancelCapture()` - Abort payment session
- Two private helper methods: `generateIdempotencyKey()` and `validateCallInProgress()`
- All payment methods use instance-level configuration from environment

This consolidation establishes a simpler, more maintainable architecture for payment services while improving configuration management through environment variables.

### TwilioService Architecture - LLM Tool Self-Containment

This release establishes a clear architectural pattern for when to use TwilioService versus direct Twilio API calls, particularly for LLM tools.

#### 🏗️ Architectural Decision

**LLM Tool Self-Containment Pattern:**
- LLM tools in `src/tools/` directory should be self-contained and call Twilio APIs directly
- TwilioService is reserved for complex operations requiring non-API level business logic
- This pattern prevents unnecessary service layer coupling and keeps tools portable

**Payment Tool Implementation:**
- Payment tools (`start-capture`, `capture-card`, etc.) call Twilio API directly
- Each tool initializes Twilio client with environment credentials
- Simple API operations without service layer overhead
- Self-contained, portable, and easy to test

This architectural pattern improves code maintainability, reduces unnecessary coupling, and establishes clear guidelines for payment tool development.

---

## Release v4.9.5

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Twilio Edge Location Support.

---

## Release v4.9.4

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on TwiML Generation Fix.

---

## Release v4.9.3

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Unified Response Service for Voice and Messaging.

---

## Release v4.9.2

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Generic Parameter Passing.

---

## Release v4.9.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Automatic Port Selection Enhancement.

---

## Release v4.9.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Type System Improvements & Code Quality.

---

## Release v4.8.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Configuration Structure Refinements & Asset Loading Simplification.

---

## Release v4.7.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Complete Configuration System Redesign.

---

## Release v4.6.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Asset Loading System Architecture Redesign.

---

## Release v4.5.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Silence Mode Call Handling Improvements.

---

## Release v4.5.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Listen Mode Implementation.

---

## Release v4.4.4

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Configuration Loading Fixes.

---

## Release v4.4.3

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Enhanced Silence Detection Configuration System.

---

## Release v4.4.2

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Performance Optimization Architecture.

---

## Release v4.4.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Language Configuration Optimization.

---

## Release v4.4.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Direct Parameter Configuration Migration.

---

## Release v4.3.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Complete CCRelay Method Support.

---

## Release v4.3.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Tool Type-Driven Architecture Migration.

---

## Release v4.2.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Unified Handler Architecture Refactoring.

---

## Release v4.2.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Dependency Injection Architecture Migration.

---

## Release v4.1.2

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Interface Method Splitting.

---

## Release v4.1.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Service Naming Refactoring.

---

## Release v4.1.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Service Architecture Refactoring.

---

## Release v4.0.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Duplicate Function Call Error Fix.

---

## Release v4.0.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Interface-Based Architecture Migration.

---

## Release v3.3.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Development & Documentation Updates.

---

## Release v3.3

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Migration to OpenAI Native Streaming Events.

---

## Release v3.2

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Migration to ToolEvent System.

---

## Release v3.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Migration to Response API.

---

## Release v3.0

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on TypeScript Conversion.

---

## Release v2.4

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Enhanced Tool Response Architecture.

---

## Release v2.3

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Interrupt Handling.

---

## Release v2.2

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Dynamic Context & Manifest Updates.

---

## Release v2.1

See [simple-conversation-relay](https://github.com/deshartman/simple-conversation-relay) for details on Dynamic Context & Manifest Loading and Twilio Status Callback Endpoint.

---

**Built with**: Twilio Conversation Relay • OpenAI GPT-4 • Twilio Agent Assisted Payments
