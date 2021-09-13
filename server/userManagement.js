"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = exports.getNonce = void 0;
const sigUtil = require("eth-sig-util");
const Web3 = require("web3");
const admin = require("firebase-admin");
const randomString = require("randomstring");
const db = admin.firestore();
const Busboy = require("busboy");
/**
 *  get nonce for signature
 * @param {any} req request
 * @param {any} res response
 */
function getNonce(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    busboy.on("field", (fieldname, value) => {
        if (fieldname == "account") {
            const randomString = _getRandomString();
            const account = value;
            if (!_checkAddress(account)) {
                res.status(300).send("address bad.");
            }
            else {
                console.log("nonce to ", account);
                _saveNonce(account, randomString)
                    .then((randomString) => {
                    if (randomString) {
                        console.log("nonce done for", account);
                        res.status(200).send({ nonce: randomString });
                    }
                    else {
                        console.log("random string error");
                        res.status(500).send("no");
                    }
                });
            }
        }
    });
    busboy.on("finish", () => {
    });
}
exports.getNonce = getNonce;
/**
 *  verify signature
 * @param {req} req request
 * @param {res} res response
 */
function verifySignature(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    let sig = null;
    let acc = null;
    let nonce = null;
    let network = null;
    busboy.on("field", (fieldname, value) => {
        if (fieldname == "signature") {
            sig = value;
        }
        if (fieldname == "account") {
            acc = value;
            console.log("verifying sig: ", acc);
        }
        if (fieldname == "nonce") {
            nonce = value;
        }
        if (fieldname == "network") {
            network = parseInt(value);
        }
    });
    busboy.on("finish", async () => {
        if (sig && acc && nonce && network) {
            console.log(`${acc} signature received.`);
            if (await _verifySignature(acc, nonce, network, sig)) {
                _saveNonce(acc, _getRandomString());
                console.log(`${acc} token issuance`);
                issueToken(acc)
                    .then((token) => {
                    res.status(200).send({ token: token });
                })
                    .catch((err) => {
                    console.log("error issuing token ", err);
                    res.status(500).send(null);
                });
            }
            else {
                res.status(300).send("signature invalid.");
            }
        }
        else {
            res.status(300).send("data malformed.");
        }
    });
}
exports.verifySignature = verifySignature;
/**
 *
 * @param {string} account
 * @param {string} nonce
 * @param {number} network
 * @param {string} signature
 * @return {Promise<booean>}
 */
async function _verifySignature(account, nonce, network, signature) {
    const data = {
        "domain": {
            name: "Moto Network",
            version: "3",
            network: network,
        },
        "types": {
            "EIP712Domain": [
                { "name": "name", "type": "string" },
                { "name": "version", "type": "string" },
                { "name": "network", "type": "uint256" },
            ],
            "Identity": [
                { "name": "account", "type": "string" },
                { "name": "nonce", "type": "string" },
                { "name": "network", "type": "uint256" },
            ],
        },
        "primaryType": "Identity",
        "message": { account: account, nonce: nonce, network: network },
    };
    const recovered = sigUtil.recoverTypedSignature_v4({ data: data, sig: signature });
    return (recovered == sigUtil.normalize(account)) && (nonce == await _getNonceFromDB(account));
}
/**
 *
 * @param {string} address
 * @return {boolean}
 */
function _checkAddress(address) {
    const web3 = new Web3();
    const addressCheck = web3.utils.isAddress(address);
    return addressCheck;
}
/**
 *
 * @param {string} account
 * @return {Promise<string>}
 */
function issueToken(account) {
    return admin
        .auth()
        .createCustomToken(account);
}
/**
 *
 * @param {string} account
 * @return {Promise<string | null>}
 */
function _getNonceFromDB(account) {
    return new Promise((resolve, reject) => {
        const userRef = db.collection("Users");
        userRef.where("account", "==", account).get()
            .then((snapshot) => {
            if (snapshot.empty) {
                resolve(null);
            }
            else {
                resolve(snapshot.docs[0].data().nonce);
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 *
 * @param {string } account
 * @param {string} randomString
 * @return {Promise<string>}
 */
function _saveNonce(account, randomString) {
    return new Promise((resolve, reject) => {
        const userRef = db.collection("Users");
        userRef.where("account", "==", account).get()
            .then((snapshots) => {
            if (snapshots.empty) {
                userRef.add({ account: account, nonce: randomString });
                resolve(randomString);
            }
            else {
                snapshots.forEach((snapshot) => {
                    snapshot.ref.update({ nonce: randomString });
                    resolve(randomString);
                });
            }
        })
            .catch((err) => {
            console.log("_saveNonce ", err);
            reject(new Error("update user error"));
        });
    });
}
/**
 *
 * @return {string}
 */
function _getRandomString() {
    return randomString.generate(32);
}
//# sourceMappingURL=userManagement.js.map