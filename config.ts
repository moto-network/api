export interface UniqueOwnable {
  owner: string;
  id: string;
  network: number;
}

export interface NFT extends UniqueOwnable {
  name: string;
  contractAddress: string;
  contentHash: string;
  creator: string;
}

export interface FileNFT extends NFT {
  readonly smImg?: string;
  readonly medImg?: string;
  readonly pHash?: string;
}

export interface ListingNFT extends NFT {
  readonly onSale: boolean;
  order: Listing;
}

export interface SearchResults {
  query: string;
  suggestedRoute?: string;
  result?: any;
  empty: boolean;
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
  expiresAt?: string;
  buyer?: string;
}

export interface Account {
  address: string;
  network: number;
}

export type ListingCollection = {
  [id: string]: Listing;
}

export type NFTCollection<NFTType extends NFT> = {
  [tokenId: string]: NFTType;
}

export type LocalSession = {
  owner: string;
  data?: SessionData;
}

export type Tier = UniqueOwnable & {
  name?: string;
  valid: boolean;
  desc?: string;
  price: string;
  commission?: string;
}


export type Subscription = {
  tier: Tier;
  expirationDate: string;
}

export type SessionData = {
  [dataId: string]: any;
}

export interface TransactionReceipt {
  status: boolean;
  hash: string;
  index?: number;
  blockHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  cumulativeGasUsed?: number;
  gasUsed?: number;
  logs?: any[] //array of logs ..change
}

export interface Contract {
  name: string;
  address: string;
  abi: any;
  desc?: string;
}


interface Network {
  provider: string;
  contracts: Record<string, Contract>;
  explorerBaseUrl: string;//must be url
  name: string,
  symbol: string
}

const marketplaceJSON = require("./Marketplace.json");
const motoVerifiedNFT = require("./BEPMotoNFT.json");
const subscriptionsJSON = require("./Subscriptions.json");
const nftTestnetAddress: string = "0x4De41909a50B92b025BA95f8ddf7e7a126dC40Cd";
const ganacheNFTAddress: string = "0x0233654873Fc5130530286C9FcB64f8218E01825";
const ganachenftMarketAddress: string = "0xb52D64dFF89eDF37738C99F609E436dA5Ef8d534";
const binanceTestMarketAddress: string = "0xd4DF6E0236A01B64DB7f01f970F375384F9f5943";

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

const bscTestnetContracts: Record<string,Contract> = {
  "nft": nftTestnet,
  "market": binaanceTestMarketContract,
  "subscription":subscriptionBscTest
};

const ganacheContractsCollection: Record<string,Contract> = {
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

const networkCollection: Record<string,Network> = {
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
 *  get contract information
 * @param {number} network
 * @param {string} name
 * @return {Contract} contractDataType
 */
export function getContract(network: number, name: string): Contract {
  return networkCollection[network].contracts[name];
}


