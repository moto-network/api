"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContract = exports.getContractAddress = exports.getProvider = void 0;
const marketplaceJSON = require("./Marketplace.json");
const motoVerifiedNFT = require("./BEPMotoNFT.json");
const subscriptionsJSON = require("./Subscriptions.json");
const nftTestnetAddress = "0x4De41909a50B92b025BA95f8ddf7e7a126dC40Cd";
const ganacheNFTAddress = "0x0233654873Fc5130530286C9FcB64f8218E01825";
const ganachenftMarketAddress = "0xb52D64dFF89eDF37738C99F609E436dA5Ef8d534";
const binanceTestMarketAddress = "0xd4DF6E0236A01B64DB7f01f970F375384F9f5943";
const contractAddresses = {
    "97": { "nft": nftTestnetAddress },
    "1337": { "nft": ganacheNFTAddress },
};
const nftTestnet = {
    name: "nft",
    address: nftTestnetAddress,
    abi: motoVerifiedNFT.abi,
};
const binaanceTestMarketContract = {
    name: "market",
    address: binanceTestMarketAddress,
    abi: marketplaceJSON.abi,
};
const ganacheMarketContract = {
    name: "market",
    address: ganachenftMarketAddress,
    abi: marketplaceJSON.abi,
};
const ganacheNFTContract = {
    name: "nft",
    address: ganacheNFTAddress,
    abi: motoVerifiedNFT.abi,
};
const subscriptionBscTest = {
    name: "subscription",
    address: "0xbD1023Ebe5C9433C18C55f9B4b774F9b8F9771D4",
    abi: subscriptionsJSON.abi
};
const bscTestnetContracts = {
    "nft": nftTestnet,
    "market": binaanceTestMarketContract,
    "subscription": subscriptionBscTest
};
const ganacheContractsCollection = {
    "nft": ganacheNFTContract,
    "market": ganacheMarketContract,
};
// const mainnetContracts: ContractCollection = {};
const ganacheNetwork = {
    provider: "http://127.0.0.1:38970",
    contracts: ganacheContractsCollection,
    explorerBaseUrl: "https://testnet.bscscan.com/",
    name: "ganache",
    symbol: "ganache",
};
const bscTestnetNetwork = {
    provider: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    contracts: bscTestnetContracts,
    explorerBaseUrl: "https://testnet.bscscan.com/",
    name: "Binance Smart Chain  TESTNEST",
    symbol: "BSC",
};
/* const bscMainnetNetwork: Network = {
  provider: "https://bsc-dataseed.binance.org/",
  contracts: mainnetContracts,
  explorerBaseUrl: "https://testnet.bscscan.com/",
  name: "Binance Smart Chain",
  symbol: "BSC_TESTNET"
};*/
const networkCollection = {
    "97": bscTestnetNetwork,
    "1337": ganacheNetwork,
};
/**
 * get provider to connect to web3
 * @param {number} network
 * @return {string} url
 */
function getProvider(network) {
    const index = network.toString(10);
    if (typeof networkCollection[index] !== "undefined") {
        return networkCollection[index].provider;
    }
    return null;
}
exports.getProvider = getProvider;
/**
 * get contract address might deprecate
 * @param {number} network
 * @param {string} name easy name of contract
 * @return {string} address
 */
function getContractAddress(network, name) {
    return contractAddresses[network][name];
}
exports.getContractAddress = getContractAddress;
/**
 *  get contract information
 * @param {number} network
 * @param {string} name
 * @return {Contract} contractDataType
 */
function getContract(network, name) {
    return networkCollection[network].contracts[name];
}
exports.getContract = getContract;
//# sourceMappingURL=config.js.map