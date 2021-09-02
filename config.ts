export interface Contract {
  name: string;
  address: string;
  abi: any;
}
export interface ListingNFT extends NFT {
  readonly onSale: boolean;
  order: Listing;
}

export interface Listing {
  address: string;
  blockNumber: number;
  transactionHash: string;
  id: string;
  tokenId: string;
  seller: string;
  contractAddress: string;
  price: string;
  expiresAt: string;
}

export interface Tier{
  name ?: string;
  valid: boolean;
  tierId ?: string;
  desc ?: string;
  creator: string;
  network: number;
  price: string;
  commission ?: string;
}

export type Subscription = {
  tier: Tier;
  expirationDate: string;
}

export interface NFT {
  name: string;
  owner: string;
  network: number;
  tokenId: string;
  contractAddress: string;
  contentHash: string;
  creator: string;
}

export interface Order {
  address: string;
  blockNumber: number;
  transactionHash: string;
  id: string;
  tokenId: string;
  seller: string;
  contractAddress: string;
  price: string;
  expiresAt: number;
  buyer?: string;
}

export interface TransactionReceipt {
  status: boolean;
  transactionHash: string;
  transactionIndex?: number;
  blockHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  cumulativeGasUsed?: number;
  gasUsed?: number;
  logs?: any[] // array of logs ..change
}

interface ContractCollection {
  [address: string]: Contract;
}


interface Network {
  provider: string;
  contracts: ContractCollection;
  explorerBaseUrl: string;// must be url
  name: string,
  symbol: string
}

type NetworkCollection = {
  [network: string]: Network;
}

type AddressCollection = {
  [network: string]: any;
}


const marketplaceJSON = require("./Marketplace.json");
const motoVerifiedNFT = require("./BEPMotoNFT.json");
const subscriptionsJSON = require("./Subscriptions.json");
const nftTestnetAddress: string = "0x4De41909a50B92b025BA95f8ddf7e7a126dC40Cd";
const ganacheNFTAddress: string = "0x0233654873Fc5130530286C9FcB64f8218E01825";
const ganachenftMarketAddress: string = "0xb52D64dFF89eDF37738C99F609E436dA5Ef8d534";
const binanceTestMarketAddress: string = "0xd4DF6E0236A01B64DB7f01f970F375384F9f5943";
const contractAddresses: AddressCollection = {
  "97": {"nft": nftTestnetAddress},
  "1337": {"nft": ganacheNFTAddress},
};
const nftTestnet: Contract = {
  name: "nft",
  address: nftTestnetAddress,
  abi: motoVerifiedNFT.abi,
};
const binaanceTestMarketContract: Contract = {
  name: "market",
  address: binanceTestMarketAddress,
  abi: marketplaceJSON.abi,
};
const ganacheMarketContract: Contract = {
  name: "market",
  address: ganachenftMarketAddress,
  abi: marketplaceJSON.abi,
};
const ganacheNFTContract: Contract = {
  name: "nft",
  address: ganacheNFTAddress,
  abi: motoVerifiedNFT.abi,
};

const subscriptionBscTest: Contract = {
  name: "subscription",
  address: "0xbD1023Ebe5C9433C18C55f9B4b774F9b8F9771D4",
  abi:subscriptionsJSON.abi
}

const bscTestnetContracts: ContractCollection = {
  "nft": nftTestnet,
  "market": binaanceTestMarketContract,
  "subscription":subscriptionBscTest
};

const ganacheContractsCollection: ContractCollection = {
  "nft": ganacheNFTContract,
  "market": ganacheMarketContract,
};
// const mainnetContracts: ContractCollection = {};

const ganacheNetwork: Network = {
  provider: "http://127.0.0.1:38970",
  contracts: ganacheContractsCollection,
  explorerBaseUrl: "https://testnet.bscscan.com/",
  name: "ganache",
  symbol: "ganache",
};

const bscTestnetNetwork: Network = {
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

const networkCollection: NetworkCollection = {
  "97": bscTestnetNetwork,
  "1337": ganacheNetwork,
};
/**
 * get provider to connect to web3
 * @param {number} network
 * @return {string} url
 */
export function getProvider(network: number): string | null {
  const index = network.toString(10);
  if (typeof networkCollection[index] !== "undefined") {
    return networkCollection[index].provider;
  }
  return null;
}
/**
 * get contract address might deprecate
 * @param {number} network
 * @param {string} name easy name of contract
 * @return {string} address
 */
export function getContractAddress(network: number, name: string): string {
  return contractAddresses[network][name];
}

/**
 *  get contract information
 * @param {number} network
 * @param {string} name
 * @return {Contract} contractDataType
 */
export function getContract(network: number, name: string): Contract {
  return networkCollection[network].contracts[name];
}


