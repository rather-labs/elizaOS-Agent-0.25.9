import type { Action, Plugin } from "@elizaos/core";
import transferAction from "./actions/transfer.ts";
//import createWalletAction from "./actions/createWallet.ts";
//import loadWalletAction from "./actions/loadWallet.ts";
//import borrowAction from "./actions/evaaBorrow";
//import supplyAction from "./actions/evaaSupply";
//import withdrawAction from "./actions/evaaWithdraw";
//import repayAction from "./actions/evaaRepay";
//import positionsAction from "./actions/evaaPositions";
//import stakeAction from "./actions/stake.ts";
//import unstakeAction from "./actions/unstake.ts";
//import getPoolInfoAction from "./actions/getPoolInfo.ts";
//import batchTransferAction from "./actions/batchTransfer.ts";
//import auctionAction from "./actions/auctionInteraction.ts";
//import createListingAction from "./actions/createListing.ts";
//import buyListingAction from "./actions/buyListing.ts";
//import createAuctionAction from "./actions/createAuction.ts";
//import bidListingAction from "./actions/bidListing.ts";
//import cancelListingAction from "./actions/cancelListing.ts";
import { WalletProvider, nativeWalletProvider } from "./providers/wallet.ts";
//import transferNFTAction from "./actions/transferNFT.ts"
//import mintNFTAction from "./actions/mintNFT.ts"
//import getCollectionDataAction from "./actions/getCollectionData.ts"
//import updateNFTMetadataAction from "./actions/updateNFTMetadata.ts";
//import tokenPriceAction from "./actions/tokenPrice.ts";
//import { tonTokenPriceProvider } from "./providers/tokenProvider.ts";
//import jettonInteractionAction from "./actions/jettonInteraction.ts";
//import { StakingProvider, nativeStakingProvider } from "./providers/staking.ts";
import { swapStonAction, 
         finishSwapStonAction, 
         getPendingStonSwapDetailsAction
        } from "./actions/swapSton.ts";
import queryStonAssetAction from "./actions/queryStonAsset.ts";
//import dexAction from "./actions/dex.ts";

import { tonConnectProvider } from "./providers/tonConnect.ts";
import {
  connectAction,
  disconnectAction,
  showConnectionStatusAction,
} from "./actions/tonConnect.ts";
import tonConnectTransactionAction from "./actions/tonConnectTransaction.ts";

export const tonPlugin: Plugin = {
  name: "ton",
  description: "Ton Plugin for Eliza",
  actions: [
    transferAction,
    //createWalletAction,
    //loadWalletAction,
    //stakeAction,
    //unstakeAction,
    //borrowAction,
    //supplyAction,
    //withdrawAction,
    //repayAction,
    //positionsAction,
    //getPoolInfoAction,
    //batchTransferAction,
    connectAction,
    disconnectAction,
    showConnectionStatusAction,
    //tonConnectTransactionAction,
    //tokenPriceAction,
    swapStonAction,
    finishSwapStonAction,
    getPendingStonSwapDetailsAction,
    queryStonAssetAction,
    //createListingAction as Action,
    //createAuctionAction as Action,
    //bidListingAction as Action,
    //buyListingAction as Action,
    //cancelListingAction as Action,
    //auctionAction as Action,
    //transferNFTAction as Action,
    //mintNFTAction as Action,
    //updateNFTMetadataAction as Action,
    //getCollectionDataAction as Action,
    //dexAction as Action,
    //jettonInteractionAction as Action,
  ],
  evaluators: [],
  providers: [
    nativeWalletProvider,
    // nativeStakingProvider,
    tonConnectProvider,
    //tonTokenPriceProvider,
  ],
};

export default tonPlugin;
