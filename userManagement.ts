import { ResultStorage } from "firebase-functions/v1/testLab";

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
export function getNonce(req: any, res: any) {
  const busboy = new Busboy({headers: req.headers});
  req.pipe(busboy);
  busboy.on("field", (fieldname: any, value: any) => {
    if (fieldname == "account") {
      
      const randomString: string = _getRandomString();
      const account = value;
      if (!_checkAddress(account)) {
        res.status(300).send("address bad.");
      } else {
        console.log("nonce to ", account);
        _saveNonce(account, randomString)
            .then((randomString) => {
              if (randomString) {
                console.log("nonce done for", account);
                res.status(200).send({nonce: randomString});
              } else {
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
/**
 *  verify signature
 * @param {req} req request
 * @param {res} res response
 */
export function verifySignature(req: any, res: any) {
  const busboy = new Busboy({headers: req.headers});
  req.pipe(busboy);
  let sig: string | null = null;
  let acc: string | null = null;
  let nonce: string | null = null;
  let network: number | null = null;
  busboy.on("field", (fieldname: any, value: any) => {
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

/**
 *
 * @param {string} account
 * @param {string} nonce
 * @param {number} network
 * @param {string} signature
 * @return {Promise<booean>}
 */
async function _verifySignature(account: string, nonce: string,
    network: number, signature: string): Promise<boolean> {
  const data = {
    "domain": {
      name: "Moto Network",
      version: "3",
      network: network,
    },
    "types": {
      "EIP712Domain": [
        {"name": "name", "type": "string"},
        {"name": "version", "type": "string"},
        {"name": "network", "type": "uint256"},
      ],
      "Identity": [
        {"name": "account", "type": "string"},
        {"name": "nonce", "type": "string"},
        {"name": "network", "type": "uint256"},
      ],
    },
    "primaryType": "Identity",
    "message": {account: account, nonce: nonce, network: network},
  };
  const recovered = sigUtil.recoverTypedSignature_v4({data: data, sig: signature});

  return (recovered == sigUtil.normalize(account)) && (nonce == await _getNonceFromDB(account));
}

/**
 *
 * @param {string} address
 * @return {boolean}
 */
function _checkAddress(address: string): boolean {
  const web3 = new Web3();
  const addressCheck = web3.utils.isAddress(address);
  return addressCheck;
}
/**
 *
 * @param {string} account
 * @return {Promise<string>}
 */
function issueToken(account: string): Promise<string> {
  return admin
      .auth()
      .createCustomToken(account);
}

/**
 *
 * @param {string} account
 * @return {Promise<string | null>}
 */
function _getNonceFromDB(account: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const userRef = db.collection("Users");
    userRef.where("account", "==", account).get()
        .then((snapshot: any) => {
          if (snapshot.empty) {
            resolve(null);
          } else {
            resolve(snapshot.docs[0].data().nonce);
          }
        })
        .catch((err: any) => {
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
function _saveNonce(account: string, randomString: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const userRef = db.collection("Users");
    userRef.where("account", "==", account).get()
        .then((snapshots: any) => {
          if (snapshots.empty) {
            userRef.add({account: account, nonce: randomString});
            resolve(randomString);
          } else {
            snapshots.forEach((snapshot: any) => {
              snapshot.ref.update({nonce: randomString});
              resolve(randomString);
            });
          }
        })
        .catch((err: any) => {
          console.log("_saveNonce ", err);
          reject(new Error("update user error"));
        });
  });
}

/**
 *
 * @return {string}
 */
function _getRandomString(): string {
  return randomString.generate(32);
}
