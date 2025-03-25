import type { Plugin } from "@elizaos/core";
import transfer from "./actions/transfer";
import createToken from "./actions/createToken";
import swap from "./actions/swap";
import receiveEgld from "./actions/receiveEgld";
import lendEgld from "./actions/hatom/lendEgld";
import addCollateral from "./actions/hatom/addCollateral";
import getAddress from "./actions/getAddress";
import checkWallet from "./actions/checkWallet";

export const multiversxPlugin: Plugin = {
    name: "multiversx",
    description: "MultiversX Plugin for Eliza",
    actions: [
        transfer, 
        //createToken, 
        swap, 
        //receiveEgld, 
        //lendEgld, 
        getAddress, 
        checkWallet, 
        //addCollateral
    ],
    evaluators: [],
    providers: [],
};

export default multiversxPlugin;
