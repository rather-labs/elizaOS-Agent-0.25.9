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
import axios from "axios";

export default {
    name: "RECEIVE_EGLD",
    similes: ["GET_EGLD"],
    description: "Generates a QR code for sending EGLD to the agent's wallet in Multiversx blockchain",
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating receive EGLD action for user:", message.userId);
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
        elizaLogger.log("Starting RECEIVE_EGLD handler...");

        try {
    const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
    const network = runtime.getSetting("MVX_NETWORK");
    const qrCodeApiUrl = runtime.getSetting("QR_CODE_API_URL");

    if (!qrCodeApiUrl) {
        throw new Error("QR_CODE_API_URL is not defined in runtime settings");
    }

    const walletProvider = new WalletProvider(privateKey, network);
    const address = walletProvider.getAddress().toBech32();

    const amount = message.content.text.match(/\d+(\.\d+)?/);

    if (!amount) {
        callback?.({
            text: "Please specify the amount of EGLD you'd like to send.",
        });
        return false;
    }

    const amountValue = new BigNumber(amount[0]);
    const paymentUrl = `multiversx:${address}?amount=${amountValue.toFixed()}`;

    const encodedPaymentUrl = encodeURIComponent(paymentUrl);

    elizaLogger.info(`Sending data to API for QR code generation...`);

    const response = await axios.post(`${qrCodeApiUrl}/generate_qr?data=${encodedPaymentUrl}`);

    elizaLogger.info(`API response received: ${JSON.stringify(response.data)}`);

    if (response.data && response.data.preview_url) {
        const qrCodeImageUrl = `${qrCodeApiUrl}${response.data.preview_url}`;

        elizaLogger.info(`QR code generated successfully: ${qrCodeImageUrl}`);

        callback?.({
            text: `Here is the QR code to send ${amountValue.toFixed()} EGLD to my wallet, scan it with xPortal: ${qrCodeImageUrl}`,
        });

        return true;
    } else {
        elizaLogger.error("Failed to generate QR code, no image URL returned");
        throw new Error('Failed to generate QR code');
    }
    } catch (error) {
        elizaLogger.error("Error generating QR code for sending EGLD:", error);
        callback?.({
            text: `Could not generate the QR code. Error: ${error.message}`,
        });
    }
        },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to send 2 EGLD to the agent.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Here is the QR code to send 2.00 EGLD to my wallet:",
                },
            },
        ],
    ],
} as Action;
