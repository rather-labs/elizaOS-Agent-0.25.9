import {
    elizaLogger,
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { WalletProvider } from "../providers/wallet";
import { validateMultiversxConfig } from "../environment";

export default {
    name: "GET_ADDRESS_MVX",
    similes: ["CHECK_ADDRESS_MVX", "GIVE_ADDRESS_MVX"],
    description: "Return the agent's wallet address in Multiversx blockchain",
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating get address action for user:", message.userId);
        await validateMultiversxConfig(runtime);
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ) => {
        elizaLogger.log("Starting GET_ADDRESS handler...");

        try {
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");

            const walletProvider = new WalletProvider(privateKey, network);

            const address = walletProvider.getAddress().toBech32();

        callback?.({
            text: `My wallet address is ${address}`
        });

            return true;
        } catch (error) {
            elizaLogger.error("Error checking address:", error);
            callback?.({
                text: `Could not retrieve wallet address. Error: ${error.message}`});
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you provide me with your wallet address?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Just a moment, I'll find that for you",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What is your address?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Give me a second, I'll check it",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please share your wallet address",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll take care of that for you right now",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you send me your wallet address?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure, let me grab that for you",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "May I have your wallet address?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Hang tight, I'll fetch it for you",
                },
            },
        ]
    ]

} as Action;
