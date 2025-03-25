import {
    elizaLogger,
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    generateObject,
    composeContext,
    type Action,
} from "@elizaos/core";
import { WalletProvider } from "../../providers/wallet";
import { MVX_NETWORK_CONFIG } from "../../constants";
import { validateMultiversxConfig } from "../../environment";
import { lendegldSchema } from "../../utils/schemas";
export interface lendegldContent extends Content {
    amount: string;
}
import { isUserAuthorized } from "../../utils/accessTokenManagement";

const lendegldTemplate = `Respond with a JSON markdown block containing only the extracted value.

Example response:
\`\`\`json
{
    "amount": "10"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the lending request:
- Amount (as a string without any currency symbol or unit)

Respond with a JSON markdown block containing only the extracted value.`; 


export default {
    name: "LEND_EGLD",
    similes: [""],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating lend egld action for user:", message.userId);
        await validateMultiversxConfig(runtime);
        return true;
    },
    description: "Lend EGLD on Hatom.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting LEND_EGLD handler...");

        elizaLogger.log("Handler initialized. Checking user authorization...");

        if (!isUserAuthorized(message.userId, runtime)) {
            elizaLogger.error(
                "Unauthorized user attempted to create a token:",
                message.userId
            );
            if (callback) {
                callback({
                    text: "You do not have permission to create a token.",
                    content: { error: "Unauthorized user" },
                });
            }
            return false;
        }

        // Initialize or update state
        let currentState: State;
        if (!state) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(state);
        }

        // Compose lendegld context
        const lendegldContext = composeContext({
            state: currentState,
            template: lendegldTemplate,
        });

        // Generate lendegld content
        const content = await generateObject({
            runtime,
            context: lendegldContext,
            modelClass: ModelClass.SMALL,
            schema: lendegldSchema,
        });

        const lendegldContent = content.object as lendegldContent;
        const islendegldContent =
            lendegldContent.amount;

        // Validate lendegld content
        if (!islendegldContent) {
            elizaLogger.error("Invalid content for LEND_EGLD action.");
            if (callback) {
                callback({
                    text: "Unable to process lend request. Invalid content provided.",
                    content: { error: "Invalid lend content" },
                });
            }
            return false;
        }

        try {
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");
            const networkConfig = MVX_NETWORK_CONFIG[network];

            const walletProvider = new WalletProvider(privateKey, network);

            const receiverAddress = networkConfig.hatomEgldLendingSC

            const txHash = await walletProvider.sendEGLD({
                receiverAddress: receiverAddress,
                amount: lendegldContent.amount,
                data: "mint",
                gasLimit: 50000000
            });

            const txURL = walletProvider.getTransactionURL(txHash);
            callback?.({
                text: `Transaction sent successfully! You can view it here: ${txURL}.`,
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error during lending:", error);
            if (callback) {
                callback({
                    text: `Error lending egld: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to lend 10 EGLD",
                    action: "LEND",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully processed lending request.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Lend 50 EGLD",
                    action: "LEND",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully processed lending request.",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
