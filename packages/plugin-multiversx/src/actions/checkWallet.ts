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
import { BigNumber } from "bignumber.js";

export default {
    name: "CHECK_WALLET_MVX",
    similes: ["WALLET_BALANCE_MVX", "TOKENS_HELD_MVX"],
    description: "Checks the agent's wallet and returns token balances in Multiversx blockchain",
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating wallet check action for user:", message.userId);
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
        elizaLogger.log("Starting CHECK_WALLET handler...");

        try {
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");

            const walletProvider = new WalletProvider(privateKey, network);

            const tokens = await walletProvider.getTokensData();

            const egldBalance = await walletProvider.getBalance();
            const humanReadableEgldBalance = new BigNumber(egldBalance)
                    .dividedBy(Math.pow(10, 18))
                    .toFixed(2);

            if (!tokens || tokens.length === 0) {
                elizaLogger.log("No tokens found in the wallet.");
                callback?.({
                    text: "No tokens found in the wallet.",
                    content: { tokens: [] },
                });
                return false;
            }

            const tokenBalances = await Promise.all(
            tokens.map(async (token) => {
                const humanReadableBalance = new BigNumber(token.balance)
                    .dividedBy(Math.pow(10, token.rawResponse.decimals || 18))
                    .toFixed(2);

                return {
                    identifier: token.identifier.split('-')[0],
                    balance: humanReadableBalance,
                };
            })
        );

        callback?.({
            text: `Here are the tokens in my wallet: ${tokenBalances.map(token => 
                `${token.balance} ${token.identifier}`).join(", ")} and ${humanReadableEgldBalance} EGLD`
        });

            return true;
        } catch (error) {
            elizaLogger.error("Error checking wallet:", error);
            callback?.({
                text: `Could not retrieve wallet balances. Error: ${error.message}`});
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What tokens do you have?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check quickly",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you check your wallet?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Of course, let me see",
                },
            },
        ],
    ],
} as Action;
