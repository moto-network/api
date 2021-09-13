"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeBuyOrder = void 0;
const Web3 = require("web3");
const admin = require("firebase-admin");
const db = admin.firestore();
const Busboy = require("busboy");
const config_1 = require("./config");
const createOrder_1 = require("./createOrder");
/**
 * records an order in the database
 * @param {any} req
 * @param {any} res
 */
function finalizeBuyOrder(req, res) {
    let nft = null;
    let hash = null;
    if (req.method !== "POST") {
        res.writeHead(200, { Connection: "close" });
        res.end();
    }
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    busboy.on("field", (fieldname, value) => {
        if (fieldname == "nft") {
            nft = JSON.parse(value);
            if (!nft.order) {
                res.status(300).send("no order.");
            }
        }
        if (fieldname == "transactionHash") {
            hash = value;
        }
    });
    busboy.on("finish", function () {
        if (nft && hash) {
            console.log(`${nft.id} buy order. hash: ${hash}`);
            findAlreadyExecutedOrder(nft, hash)
                .then((order) => {
                if (order) {
                    updateDB(order)
                        .then((result) => {
                        if (result) {
                            console.log(`${nft === null || nft === void 0 ? void 0 : nft.id} buy order done. hash: ${hash}`);
                            res.status(200).send(order);
                        }
                        else {
                            res.status(300);
                        }
                    })
                        .catch((err) => {
                        console.log(err);
                        res.status(300);
                    });
                }
            })
                .catch((err) => {
                console.log(err);
                res.status(300);
            });
        }
        else {
            res.status(300).send("no.");
        }
    });
}
exports.finalizeBuyOrder = finalizeBuyOrder;
/**
 *
 * @param {ListingNFT} nft
 * @param {string} hash
 * @return {Promise<Listing | null>}
 */
function findAlreadyExecutedOrder(nft, hash) {
    return new Promise((resolve, reject) => {
        const motoMarket = config_1.getContract(nft.network, "market");
        const web3 = new Web3(config_1.getProvider(nft.network));
        const marketContract = new web3.eth
            .Contract(motoMarket.abi, motoMarket.address);
        web3.eth.getTransactionReceipt(hash)
            .then((transactionReceipt) => {
            if (!transactionReceipt) {
                reject(new Error("No Transaction Receipt."));
            }
            const blockNumber = transactionReceipt.blockNumber;
            const options = {
                filter: {
                    assetId: nft.id,
                    seller: nft.owner,
                },
                fromBlock: blockNumber,
            };
            marketContract
                .getPastEvents("OrderSuccessful", options)
                .then((events) => {
                if (events.length == 0) {
                    resolve(null);
                }
                else if (events.length == 1) {
                    resolve(createOrder_1.toOrderType(events[0], web3));
                }
            })
                .catch((err) => {
                console.log('err', err);
                reject(new Error("contract error"));
            });
        });
    });
}
/**
 * update db
 * @param {Listing} order
 * @return {Promise<boolean>}
 */
function updateDB(order) {
    return new Promise((resolve, reject) => {
        Promise.all([_updateNFT(order), _updateOrder(order)])
            .then((results) => {
            if (results[0] && results[1]) {
                resolve(true);
            }
            else {
                reject(new Error("there was an update errror"));
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 *
 * @param {Listing} order
 * @return {Promise<boolean>}
 */
function _updateNFT(order) {
    const FieldValue = admin.firestore.FieldValue;
    const nftRef = db.collection("NFTs");
    return new Promise((resolve, reject) => {
        nftRef.where("order.id", "==", order.id).get()
            .then((snapshots) => {
            if (snapshots.empty) {
                reject(new Error("not found"));
            }
            else {
                snapshots.forEach((snapshot) => {
                    snapshot.ref.update({
                        onSale: false,
                        order: FieldValue.delete(),
                        owner: order.buyer,
                    });
                    resolve(true);
                });
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 *
 * @param {Listing} order
 * @return {Promise<boolean>}
 */
function _updateOrder(order) {
    const orderRef = db.collection("Orders");
    return new Promise((resolve, reject) => {
        orderRef.where("id", "==", order.id).get()
            .then((snapshots) => {
            if (snapshots.empty) {
                reject(new Error("not found"));
            }
            else {
                snapshots.forEach((snapshot) => {
                    snapshot.ref.update({
                        onSale: false,
                        saleDate: admin.firestore.Timestamp.fromDate(new Date()),
                    });
                    resolve(true);
                });
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
// function createDownloadLink() { }
//# sourceMappingURL=executeOrder.js.map