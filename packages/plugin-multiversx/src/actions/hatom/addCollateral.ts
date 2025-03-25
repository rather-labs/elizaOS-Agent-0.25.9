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
import { WalletProvider } from "../../providers/wallet";
import { validateMultiversxConfig } from "../../environment";
import { addCollateralSchema } from "../../utils/schemas";
import { MVX_NETWORK_CONFIG } from "../../constants";
export interface AddCollateralContent extends Content {
    amount: string;
    tokenIdentifier: string;
}
import { isUserAuthorized } from "../../utils/accessTokenManagement";

const addCollateralTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

### Example responses:

\`\`\`json
{
    "amount": "100",
    "tokenIdentifier": "HEGLD"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Token address or HeroTag
- Amount to transfer
- Token identifier

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "ADD_COLLATERAL",
    similes: [
        "PUT_IN_COLLATERAL",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating add Collateral action for user:", message.userId);
        await validateMultiversxConfig(runtime);
        return true;
    },
    description: "Add token in collateral in the Hatom lending protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ) => {
        elizaLogger.log("Starting ADD_COLLATERAL handler...");

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

        // Compose addCollateral context
        const addCollateralContext = composeContext({
            state: currentState,
            template: addCollateralTemplate,
        });

        // Generate addCollateral content
        const content = await generateObject({
            runtime,
            context: addCollateralContext,
            modelClass: ModelClass.SMALL,
            schema: addCollateralSchema,
        });

        const addCollateralContent = content.object as AddCollateralContent;
        const isAddCollateralContent =
            typeof addCollateralContent.amount === "string" &&
            typeof addCollateralContent.tokenIdentifier === "string";

        elizaLogger.log("addCollateral content received:", addCollateralContent);

        // Validate transfer content
        if (!isAddCollateralContent) {
            elizaLogger.error("Invalid content for ADD_COLLATERAL action.");
            if (callback) {
                callback({
                    text: "Unable to process addCollateral request. Invalid content provided.",
                    content: { error: "Invalid addCollateral content" },
                });
            }
            return false;
        }

        try {
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");
            const networkConfig = MVX_NETWORK_CONFIG[network];

            const walletProvider = new WalletProvider(privateKey, network);

            const receiverAddress = networkConfig.hatomEgldCollateralSC

            const [ticker, nonce] =
                addCollateralContent.tokenIdentifier.split("-");

            let identifier = addCollateralContent.tokenIdentifier;
            
            if (!nonce) {
                const token = await walletProvider.getTokenFromWallet(identifier);

                identifier = token;
            }

            const txHash = await walletProvider.sendESDT({
                receiverAddress: receiverAddress,
                amount: addCollateralContent.amount,
                identifier,
                data: "enterMarkets",
                gasLimit: 250000000
            });

            const txURL = walletProvider.getTransactionURL(txHash);
            callback?.({
                text: `Transaction sent successfully! You can view it here: ${txURL}.`,
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error during addCollateral transfer:", error);
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
                    text: "Add 200 HEGLD in collateral",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll add 200 HEGLD in collateral now...",
                    action: "ADD_COLLATERAL",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Put 500 HHTM in collateral on Hatom",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll put 500 HHTM in collateral now...",
                    action: "ADD_COLLATERAL",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
