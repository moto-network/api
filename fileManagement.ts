

import {NFT} from "./config";
const admin = require("firebase-admin");
const bucketUrl = "gs://motonetworknft";

const bucket = admin.storage().bucket(bucketUrl);
const db = admin.firestore();
const Busboy = require("busboy");

/**
 * check authetnication and generate a link if good
 * @param {any} req
 * @param {any} res
 * @return {void}
 */
export async function generateFileLink(req: any, res: any) {
  
  if (!req.headers.authorization.startsWith("Bearer ")) {
    
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {

    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];

  } else if (req.cookies) {

    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send("Unauthorized. No authorization infrastructure");
    return;
  }
  try {
    const busboy = new Busboy({headers: req.headers});
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);

    req.user = decodedIdToken;

    req.pipe(busboy);
    busboy.on("field", (fieldname: any, value: any) => {
      if (fieldname == "nft") {
        const nft: NFT = JSON.parse(value);
        console.log(`${nft.tokenId} link request.`);
        _generateLink(nft)
            .then((link) => {
              if (link) {
                console.log(`${nft.tokenId} link request done.`);
                res.status(200).send({link: link});
              } else {
                res.status(500).send(null);
              }
            })
            .catch((err) => {
              console.log("_generateLink error: ", err);
              res.status(500).send();
            });
      }
    });

    busboy.on("finish", () => { });

  } catch (error) {
    console.log("GenFileLink error ", error);
    res.status(403).send("Unauthorized");
    return;
  }
}

/**
 * generate a signed url to download the file.
 * @param {NFT} nft
 * @return {Promise<string>}
 */
function _generateLink(nft: NFT): Promise<string> {
  return new Promise((resolve, reject) => {
    db.collection("Links").where("tokenId", "==", nft.tokenId).get()
        .then((snapshots: any) => {
          if (!snapshots.empty) {
            const linkInfo = snapshots.docs[0].data();
            const file = bucket.file(linkInfo.location);
            const signedUrlOptions = {
              action: "read",
              expires: Date.now() + 3 * 60 * 60 * 1000,
            };

            file.getSignedUrl(signedUrlOptions)
                .then((result:any) => {
                  if (result) {
                    resolve(result[0]);// google sends urls as arrays
                  } else {

                    reject(new Error("Couldnt find result"));
                  }
                });
          } else {
            console.log("file not found for ", nft.tokenId);
            reject(new Error("no file found"));
          }
        })
        .catch((err: any) => {

          reject(err);
        });
  });
}
