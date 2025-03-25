import {
    elizaLogger,
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    composeContext,
    generateObject,
    type Action,
} from "@elizaos/core";
import { WalletProvider } from "../providers/wallet";
import { validateMultiversxConfig } from "../environment";
import { transferSchema } from "../utils/schemas";
import { MVX_NETWORK_CONFIG } from "../constants";
import { resolveHerotag } from "../utils/resolveHerotag";
export interface TransferContent extends Content {
    receiver: string;
    amount: string;
    tokenIdentifier?: string;
}
import { isUserAuthorized } from "../utils/accessTokenManagement";

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

### Example responses:

#### Example 1: Token transfer to HeroTag
\`\`\`json
{
    "receiver": "elpulpo",
    "amount": "100000",
    "tokenIdentifier": "KWAK"
}
\`\`\`

#### Example 2: EGLD transfer to address
\`\`\`json
{
    "receiver": "erd1pws6zyhwv7t8dut0rkkvxgqatt5dzag4ghdlkqxm3jjutwaytuqque48zp",
    "amount": "10",
    "tokenIdentifier": "EGLD",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Token address or HeroTag
- Amount to transfer
- Token identifier

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "SEND_TOKEN_MVX",
    similes: [
        "SEND_TOKEN_MVX",
        "TRANSFER_TOKEN_MVX",
        "TRANSFER_TOKENS_MVX",
        "SEND_TOKENS_MVX",
        "SEND_EGLD_MVX",
        "PAY_MVX",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating send token action for user:", message.userId);
        await validateMultiversxConfig(runtime);
        return true;
    },
    description: "Transfer tokens from the agent wallet to another address in Multiversx blockchain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ) => {
        elizaLogger.log("Starting SEND_TOKEN handler...");

        elizaLogger.log("Handler initialized. Checking user authorization...");

        if (!isUserAuthorized(message.userId, runtime)) {
            elizaLogger.error(
                "Unauthorized user attempted to transfer a token:",
                message.userId
            );
            if (callback) {
                callback({
                    text: "You do not have permission to transfer a token.",
                    content: { error: "Unauthorized user" },
                });
            }
            return false;
        }

        let currentState: State;
        if (!state) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(state);
        }

        // Compose transfer context
        const transferContext = composeContext({
            state: currentState,
            template: transferTemplate,
        });

        // Generate transfer content
        const content = await generateObject({
            runtime,
            context: transferContext,
            modelClass: ModelClass.SMALL,
            schema: transferSchema,
        });

        const transferContent = content.object as TransferContent;
        const isTransferContent =
            typeof transferContent.receiver === "string" &&
            typeof transferContent.amount === "string";

        elizaLogger.log("Transfer content received:", transferContent);

        // Validate transfer content
        if (!isTransferContent) {
            elizaLogger.error("Invalid content for TRANSFER_TOKEN action.");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        try {
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");
            const networkConfig = MVX_NETWORK_CONFIG[network];

            const walletProvider = new WalletProvider(privateKey, network);

            let receiverAddress = transferContent.receiver;

            if (!receiverAddress || receiverAddress.toLowerCase() === "null") {
                elizaLogger.error(
                    "Invalid recipient detected (null). Aborting transaction."
                );
                callback?.({
                    text: "Invalid recipient. Please provide a valid address or Herotag.",
                    content: { error: "Invalid recipient" },
                });
                return false;
            }

            if (!receiverAddress.startsWith("erd1")) {
                elizaLogger.log(
                    `Detected potential Herotag: ${receiverAddress}, resolving to an address...`
                );

                const resolvedAddress = await resolveHerotag(receiverAddress);

                if (!resolvedAddress) {
                    elizaLogger.error(
                        `Failed to resolve Herotag: ${receiverAddress}. Aborting transaction.`
                    );
                    callback?.({
                        text: `Could not resolve Herotag "${receiverAddress}". Please check the spelling.`,
                        content: { error: "Unresolved Herotag" },
                    });
                    return false;
                }

                receiverAddress = resolvedAddress;
            }

            elizaLogger.log(`Final receiver address: ${receiverAddress}`);

            if (
                transferContent.tokenIdentifier &&
                transferContent.tokenIdentifier.toLowerCase() !== "egld"
            ) {
                const [ticker, nonce] =
                    transferContent.tokenIdentifier.split("-");

                let identifier = transferContent.tokenIdentifier;
                
                if (!nonce) {
                    const token = await walletProvider.getTokenFromWallet(identifier);

                    identifier = token;
                }

                const txHash = await walletProvider.sendESDT({
                    receiverAddress: receiverAddress,
                    amount: transferContent.amount,
                    identifier,
                });

                const txURL = walletProvider.getTransactionURL(txHash);
                callback?.({
                    text: `Transaction sent successfully! You can view it here: ${txURL}.`,
                });

                return true;
            }

            const txHash = await walletProvider.sendEGLD({
                receiverAddress: receiverAddress,
                amount: transferContent.amount,
            });

            const txURL = walletProvider.getTransactionURL(txHash);
            callback?.({
                text: `Transaction sent successfully! You can view it here: ${txURL}.`,
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error during token transfer:", error);
            callback?.({
                text: error.message,
                content: { error: error.message },
            });

            return "";
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 EGLD to erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 EGLD tokens now...",
                    action: "SEND_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 TST-a8b23d to erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 TST-a8b23d tokens now...",
                    action: "SEND_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;