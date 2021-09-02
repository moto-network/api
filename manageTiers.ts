
import { getContract, getProvider, Tier } from "./config";

const admin = require("firebase-admin");
const db = admin.firestore();
const Busboy = require("busboy");
const Web3 = require("web3");

export function createTier(req: any, res: any) {
  const busboy = new Busboy({ headers: req.headers });
  req.pipe(busboy);
  let tier: Tier | null = null;
  busboy.on("field", (fieldname: any, value: any) => {
    if (fieldname == "tier") {
      try {
        tier = JSON.parse(value);
        console.log(tier);
      }
      catch (err) {
        res.status(300).send("malformed request");
      }
      

    }
  });
  busboy.on("finish", async () => {
    try {
      if (tier && checkData(tier) && validateTier(tier)) {
        createRecord(tier)
          .then((result: boolean) => {
            res.status(200).send();
            console.log("processed tier: ", tier?.tierId);
          })
          .catch((err) => {
            console.log("update error;", err);
            res.status(500).send('updateError');

          })
      }
      else {
        console.log("not good");
        res.status(300).send();
      }
    }
    catch (err) {
      console.log("rerr", err);
      res.status(500).send("something went wrong");
    }
  });
}

export function updateTier(req: any, res: any) {
  const busboy = new Busboy({ headers: req.headers });
  req.pipe(busboy);
  let tier: Tier | null = null;
  busboy.on("field", (fieldname: any, value: any) => {
    if (fieldname == "tier") {
      try {
        tier = JSON.parse(value);
       }
      catch (err) {
        res.status(300).send();
      }

    }
  });
  busboy.on("finish", async () => {
    try {
      if (tier && checkData(tier) && validateTier(tier)) {
        updateRecord(tier)
          .then((result: boolean) => {
            console.log("updated tier: ", tier?.tierId);
            res.status(200).send();
          })
          .catch((err) => {
            console.log("err", err);
            res.status(500).send(err.message);
          })
      }
      else {
        res.status(300).send("you error");
      }
    }
    catch (err) {
      res.status(500).send("something went wrong");
    }
  });
}


export async function cancelTier(req: any, res: any) {
  try {
    const token: string | null = getToken(req, res);
    const account: string = token ? await getAccount(token) : res.status(401);

    if (!account) {
      res.status(401).send();
    }
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    busboy.on("field", (fieldname: any, value: any) => {
      if (fieldname == "tier") {
        const id: string = JSON.parse(value);
        console.log(`cancel request: ${id}`);
        removeRecord(id, account)
          .then(() => {
            console.log(`${account} canceled tier: ${id}`);
            res.status(200).send();
          })
          .catch((err) => {
            console.log("err from cancelling tier ", err);
            res.status(500).send();
          });
      }
    });
  }
  catch (err) {
    res.status(500)
  }

}

function createRecord(tier: Tier): Promise<boolean> {

  return db.collection("Tiers")
    .add(tier)
    .then((result: any) => {
      if (result) {

        return true;
      }
      else {
        return false;
      }
    })
    .catch((err: any) => {
      return Promise.reject(err);
    })
}

function updateRecord(tier: Tier): Promise<boolean> {
  console.log("tier is ", tier.tierId);
  return db.collection("Tiers")
    .where("tierId", "==", tier.tierId).get()
    .then((snapshot: any) => {
      if (snapshot.empty) {
        console.log("tier not found");
        return Promise.reject(new Error("tier not found."));
      }
      else {
        return snapshot.forEach((snapshot: any) => {
          snapshot.ref.update(tier);
        });

      }
    });

}

function removeRecord(tierId: string, account: string): Promise<boolean> {
  return db.collection("Tiers")
    .where("tierId", "==", tierId)
    .delete()
    .then((result: any) => {
      if (result) {
        return true;
      }
      else {
        return false;
      }
    })
    .catch((err: any) => {
      return Promise.reject(err);
    })
}

function validateTier(tier: Tier): Promise<boolean> {

  return getTier(tier)
    .then((tier: Tier) => {
      if (tier) {
        return tier.valid
      }
      else {
        return false;
      }
    })
    .catch((err) => {
      console.log("validate tier error", err);
      return Promise.reject(err);
    });
}

function getTier(tier: Tier): Promise<Tier> {
  const web3 = new Web3(getProvider(tier.network));
  const subscriptions = getContract(tier.network, "subscription");
  const contract = new web3.eth.Contract(subscriptions.abi, subscriptions.address);
  return contract.methods.getTier(tier.tierId)
    .call()
    .then((result: any[]) => {
      if (result) {
        const tier = {
          valid: result[0],
          tierId: result[1],
          creator: result[2],
          price: result[3],
          commission: result[3],
        }
        return tier;
      }
      else {
        return false;
      }
    })
    .catch((err: any) => {
      return Promise.reject(err);
    });
}

function checkData(tier: any): boolean {
  console.log(tier);
  console.log(tier.creator);
  const web3 = new Web3(getProvider(97));
  const validCheck = typeof tier.valid == 'boolean';
  const networkCheck = checkNetwork(tier.network);
  const creatorCheck = checkAddress(tier.creator);
  const priceCheck = checkPrice(tier.price);

  function checkAddress(address: string): boolean {
    console.log("address  ", address);
    console.table({ address: web3.utils.isAddress(address), checksum: web3.utils.checkAddressChecksum(address) });
    return web3.utils.isAddress(address) && web3.utils.checkAddressChecksum(address);
  }

  function checkPrice(price: string): boolean {
    const BigNumber = require("bignumber.js");
    const priceBN = new BigNumber(price);
    return priceBN.isInteger() && priceBN.isPositive();
  }

  function checkNetwork(network: number | string): boolean {
    if (typeof network == 'number') {
      return true;
    }
    else if (typeof network == 'string') {
      return web3.utils.isHex(network);
    }
    else {
      return false;
    }
  }
  console.table({ valid: validCheck, network: networkCheck, creator: creatorCheck, price: priceCheck })
  return validCheck && networkCheck && creatorCheck && priceCheck;
}


function getAccount(token: string): Promise<string> {
  return admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken: any) => {
      if (decodedToken) {
        return decodedToken.uid;
      }
      else {
        return Promise.reject(new Error("user not found."));
      }
    })
    .catch((err: any) => {
      return Promise.reject(err);
    });
}

function getToken(req: any, res: any): string | null {
  let token: string | null = null;
  if (!req.headers.authorization.startsWith("Bearer ")) {

    res.status(403).send("Unauthorized");
  }


  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {

    // Read the ID Token from the Authorization header.
    token = req.headers.authorization.split("Bearer ")[1];

  } else if (req.cookies) {

    // Read the ID Token from cookie.
    return req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send("Unauthorized. No authorization infrastructure");

  }
  return token;
}
