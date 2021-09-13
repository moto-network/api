const Web3 = require("web3");
const admin = require("firebase-admin");
const db = admin.firestore();
const Busboy = require("busboy");

import {NFT, getProvider, getContract, Contract, Listing, TransactionReceipt} from "./config";


/**
 * is called from client
 * @param {any} req request object
 * @param {any} res response object
 */
export function orderCreated(req: any, res: any) {
  let nft: NFT | null = null;
  let hash: string | null = null;
  if (req.method !== "POST") {
    res.writeHead(200, {Connection: "close"});
    res.end();
  }
  const busboy = new Busboy({headers: req.headers});
  req.pipe(busboy);
  busboy.on("field", (fieldname: string, value: string) => {
    if (fieldname == "nft") {
      try {
        nft = JSON.parse(value);
      } catch (err) {
        res.status(300).send("malformed data.");
      }
    }
    if (fieldname == "transactionHash") {
      hash = value;
    }
  });
  busboy.on("finish", function() {
    if (nft && hash) {
      console.log(`${nft.id} order created. hash: ${hash}`)
      saveLatestOrder(nft, hash)
          .then((order: Listing) => {
            if (order) {
              Promise.all([saveOrderToDb(order), updateNFT(order)])
                  .then((results) => {
                    if (results[0] && results[1]) {
                      console.log(`${nft?.id} order done.`);
                      res.send(order);
                    } else {
                      res.status(500);
                      res.send("something went wrong");
                    }
                  })
                  .catch((error) => {
                    console.log(error);
                    res.send(500).send("something went wrong");
                  });
            } else {
              res.status(200);
              res.send({results: null});
            }
          });
    } else {
      console.log("dont have nft");
    }
  });

}

/**
 * @param {NFT} nft file being sold
 * @param {string} hash hash
 */
async function saveLatestOrder(nft: NFT, hash:string): Promise<any> {
  return new Promise((resolve, reject) => {
    const motoMarket: Contract = getContract(nft.network, "market");
    const web3 = new Web3(getProvider(nft.network));
    const marketContract = new web3.eth
        .Contract(motoMarket.abi, motoMarket.address);
    web3.eth.getTransactionReceipt(hash)
        .then((receipt: TransactionReceipt) => {
          if (!receipt) {
            reject(new Error("No receipt."));
          }
          const options = {
            filter: {
              assetId: nft.id,
              seller: nft.owner,
            },
            fromBlock: receipt.blockNumber,
          };
          marketContract
              .getPastEvents("OrderCreated", options)
              .then((events: any[]) => {
                if (events.length == 0) {
                  resolve(null);
                } else if (events.length == 1) {
                  resolve(toOrderType(events[0], web3));
                } else if (events.length > 1) {
                  const order = events
                      .reduce((prev, current) => {
                        return (prev.blockNumber > current.blockNumber) ? prev : current;
                      });

                  resolve(toOrderType(order, web3));
                }
              });
        })
        .catch((err: any) => {
          console.log("err", err);
        });
  });
}

/**
 * converts input from chain into Listing Type
 * @param {any} rawData data to be converted
 * @param {any} web3 is the web3 for converting to Hex
 * @return {Listing} order order
 */
export function toOrderType(rawData: any, web3: any): Listing {
  const order: Listing = {
    address: rawData.address,
    blockNumber: rawData.blockNumber,
    transactionHash: rawData.transactionHash,
    id: rawData.returnValues.id,
    tokenId: web3.utils.toHex(rawData.returnValues.assetId),
    seller: rawData.returnValues.seller,
    contractAddress: rawData.returnValues.nftAddress,
    price: rawData.returnValues.priceInWei,
    expiresAt: rawData.returnValues.expiresAt,
  };
  if (rawData.returnValues.buyer) {
    order.buyer = rawData.returnValues.buyer;
  }
  return order;
}

/**
 *
 * @param {Listing} order order
 * @return {Promise<any>} probably?
 */
function saveOrderToDb(order: Listing): Promise<boolean> {
  const orderRef = db.collection("Orders");
  return new Promise<boolean>((resolve, reject) => {
    orderRef.where("id", "==", order.id).get()
        .then((snapshots: any) => {
          if (snapshots.empty) {
            db.collection("Orders").add(order);
            resolve(true);
          } else {
            snapshots.forEach((snapshot: any) => {
              snapshot.ref.update(order);
            });
            resolve(true);
          }
        })
        .catch((err: any) => {

          reject(err);
        });
  });
}

/**
 * asdafasdf
 * @param { Listing } order the order beng processed
 * @return {any}
 */
function updateNFT(order: Listing): Promise<boolean> {
  const nftRef = db.collection("NFTs");
  return new Promise((resolve, reject) => {
    nftRef.where("tokenId", "==", order.id).get()
        .then((snapshots: any) => {
          if (snapshots.empty) {
            resolve(false);
          } else {
            snapshots.forEach((snapshot: any) => {
              snapshot.ref.update({onSale: true, order: order});
            });
            resolve(true);
          }
        })
        .catch((err: any) => {
          reject(err);
        });
  });
}
