"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadNFT = void 0;
const uuid_1 = require("uuid");
const Busboy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const jimp = require("jimp");
const admin = require("firebase-admin");
const bucketUrl = "gs://motonetworknft";
const bucket = admin.storage().bucket(bucketUrl);
const db = admin.firestore();
/**
 * adds nft information to firebase database to be accessible to other components
 * @param {object} req
 * @param {object} res
 * @return {void} void
 */
function uploadNFT(req, res) {
    console.log("start here");
    const busboy = new Busboy({ headers: req.headers });
    let nftFilename = null;
    let nft = null;
    const fileInfo = {
        nftfilename: "",
        mimetype: "",
        encoding: "",
        filename: "",
    };
    let filepath = "";
    const tmpdir = os.tmpdir();
    req.pipe(busboy);
    busboy.on("field", (fieldname, value) => {
        if (fieldname == "nft") {
            console.log("got nft");
            nft = JSON.parse(value);
            if (!value) {
                return res.status(300).send();
            }
            nftFilename = nft.contentHash;
            fileInfo.nftfilename = nftFilename;
            db.collection("NFTs").add(nft)
                .then(() => { })
                .catch((err) => {
                res.status(500).send();
            });
        }
    });
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        console.log("found file");
        filepath = path.join(tmpdir, filename);
        fileInfo.mimetype = mimetype;
        fileInfo.encoding = encoding;
        fileInfo.filename = filename;
        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);
        file.on("end", () => {
            writeStream.end();
        });
    });
    busboy.on("finish", () => {
        console.log("busy boy on finish");
        if (nft && nftFilename) {
            console.log(`processing ${nft.tokenId}`);
            processFile(fileInfo, filepath, nft)
                .then((result) => {
                if (result) {
                    console.log(`${nft === null || nft === void 0 ? void 0 : nft.tokenId} success.`);
                    res.status(200).send(true);
                }
                else {
                    console.log(`${nft === null || nft === void 0 ? void 0 : nft.tokenId} failed.`);
                    res.status(500).send(false);
                }
            })
                .catch((err) => {
                console.log("error ", err);
                res.status(500).send(false);
            });
        }
    });
    busboy.on("error", (err) => {
        console.log("someting went wrong", err);
    });
}
exports.uploadNFT = uploadNFT;
/**
 *
 * @param {Metadata}fileInfo
 * @param {string} filepath
 * @param {NFT} nft
 * @return {Promise<boolean>} promise finished
 */
function processFile(fileInfo, filepath, nft) {
    return new Promise((resolve, reject) => {
        if (fileInfo.mimetype.startsWith("image")) {
            Promise.all([genPreviewAndPhash(fileInfo, filepath),
                sendToStorage(fileInfo, filepath)])
                .then((results) => {
                if (results[0] && results[1]) {
                    resolve(updateDBAndSaveLocation(fileInfo, results[1], nft));
                }
            })
                .catch((err) => {
                reject(err);
            });
        }
        else {
            sendToStorage(fileInfo, filepath)
                .then((fileLocation) => {
                if (fileLocation) {
                    resolve(updateDBAndSaveLocation(fileInfo, fileLocation, nft));
                }
            })
                .catch((err) => {
                Promise.reject(err);
            });
        }
    });
}
/**
 *
 * @param {Metadata} fileInfo
 * @param {string} fileLocation
 * @param {nft} nft
 * @return {Promise<boolean>}
 */
function updateDBAndSaveLocation(fileInfo, fileLocation, nft) {
    return new Promise((resolve, reject) => {
        Promise.all([updateDb(fileInfo), _saveFileLocation(fileLocation, nft)])
            .then((results) => {
            if (results[0] && results[1]) {
                resolve(true);
            }
            else {
                reject(new Error("update error"));
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 * send to storage
 * @param {object} metadata has file info
 * @param {string} filepath the data
 * @return {Promise}
 */
function sendToStorage(metadata, filepath) {
    const location = metadata.mimetype.slice(0, metadata.mimetype.indexOf("/") + 1);
    return new Promise((resolve, reject) => {
        bucket
            .upload(filepath, {
            "destination": location + metadata.nftfilename,
            "contentType": metadata.mimetype,
            "contentEncoding": metadata.encoding,
            "gzip": true,
            "contentDisposition": "Attachement;filename=" + metadata.filename,
            "metadata": {
                "contentEncoding": metadata.encoding,
                "contentType": metadata.mimetype,
                "metadata": {
                    firebaseStorageDownloadTokens: uuid_1.v4(),
                },
            },
            "private": false,
        })
            .then((result) => {
            if (result) {
                resolve(location + metadata.nftfilename);
            }
            else {
                reject(new Error("storage update didnt work"));
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 * generate preview images and the phash
 * @param {Metadata} metadata
 * @param {string} filepath
 * @return {promise }
 */
function genPreviewAndPhash(metadata, filepath) {
    const tmpdir = os.tmpdir();
    const logoFile = "./logo.png";
    const smMeta = {
        filename: "sm_" + metadata.filename,
        nftfilename: "sm_" + metadata.nftfilename,
        encoding: metadata.encoding,
        mimetype: metadata.mimetype,
    };
    const medMeta = {
        filename: "med_" + metadata.filename,
        nftfilename: "med_" + metadata.nftfilename,
        encoding: metadata.encoding,
        mimetype: metadata.mimetype,
    };
    const smPath = path.join(tmpdir, smMeta.nftfilename);
    const medPath = path.join(tmpdir, medMeta.nftfilename);
    return Promise.all([
        jimp.read(logoFile), jimp.read(filepath)
    ])
        .then((files) => {
        const logo = files[0];
        const uploadedFile = files[1];
        const medImg = uploadedFile.clone();
        const smImg = uploadedFile.clone();
        const smLogo = logo.clone();
        const medLogo = logo.clone();
        metadata.phash = uploadedFile.hash(16);
        medLogo
            .contain(medImg.bitmap.width, jimp.AUTO)
            .opacity(0.4);
        medImg
            .composite(medLogo, 0, Math.floor(medImg.bitmap.height / 3), [
            {
                mode: jimp.BLEND_ADD,
                opacitySource: 1,
                opacityDest: 0.5,
            },
        ])
            .resize(700, jimp.AUTO)
            .quality(60);
        smLogo
            .contain(smImg.bitmap.width, jimp.AUTO)
            .opacity(0.3);
        smImg
            .composite(smLogo, 0, Math.floor(smImg.bitmap.height / 3), [
            {
                mode: jimp.BLEND_ADD,
                opacitySource: 1,
                opacityDest: 0.5,
            },
        ])
            .resize(jimp.AUTO, 400)
            .quality(20);
        return Promise.all([
            saveFile(smImg, smMeta, smPath),
            saveFile(medImg, medMeta, medPath),
        ]);
    })
        .catch((err) => {
        console.log("err", err);
    });
    /**
     *
     * @param {any} image
     * @param {metadata} metadata
     * @param {string} path
     * @return {promise}
     */
    function saveFile(image, metadata, path) {
        return image.writeAsync(path)
            .then(() => {
            return sendToStorage(metadata, path);
        })
            .catch((err) => {
            console.log("err,", err);
            return Promise.reject(err);
        });
    }
}
/**
 * udpate firestore DB
 * @param {Metadata} metadata
 * @return {promise}
 */
function updateDb(metadata) {
    if (metadata.mimetype.startsWith("image")) {
        prepareSignedUrls(metadata)
            .then((signedUrlsObject) => {
            const newData = addJSONs([metadata, signedUrlsObject]);
            return _updateDB(newData);
        })
            .catch((err) => {
            console.log("err", err);
            return Promise.reject(err);
        });
    }
    return _updateDB(metadata);
}
/**
 *
 * @param {string} fileLocation
 * @param {NFT} nft
 * @return {Promise<any>}
 */
function _saveFileLocation(fileLocation, nft) {
    const linksRef = db.collection("Links");
    const linkInfo = {
        tokenId: nft.tokenId,
        contentHash: nft.contentHash,
        location: fileLocation,
    };
    return linksRef.add(linkInfo);
}
/**
 * save new data to previous db records
 * @param {Metadata} data
 * @return {Promise}
 */
function _updateDB(data) {
    const nftRef = db.collection("NFTs");
    return new Promise((resolve, reject) => {
        nftRef.where("contentHash", "==", data.nftfilename).get()
            .then((snapshots) => {
            if (snapshots.empty) {
                resolve(false);
            }
            else {
                snapshots.forEach((snapshot) => {
                    snapshot.ref.update(data);
                });
                resolve(true);
            }
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 *
 * @param {Metadata} metadata
 * @return {Promise}
 */
function prepareSignedUrls(metadata) {
    const smImgFile = bucket.file("image/" + "sm_" + metadata.nftfilename);
    const medImgFile = bucket.file("image/" + "med_" + metadata.nftfilename);
    const signedUrlOptions = {
        action: "read",
        expires: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
    };
    return Promise.all([smImgFile.getSignedUrl(signedUrlOptions),
        medImgFile.getSignedUrl(signedUrlOptions),
    ])
        .then((signedUrls) => {
        const newInfo = {
            "smImg": signedUrls[0][0],
            "medImg": signedUrls[1][0], // google sends urls as arrays
        };
        return newInfo;
    })
        .catch((err) => {
        console.log("err", err);
        return Promise.reject(err);
    });
}
/**
 * combines an array of objects into one
 * @param {any[]}jsonArray
 * @return {any}
 */
function addJSONs(jsonArray) {
    const newObject = {};
    for (let index = 0; index < jsonArray.length; index++) {
        for (const key in jsonArray[index]) {
            if (Object.prototype.hasOwnProperty.call(jsonArray[index], key)) {
                newObject[key] = jsonArray[index][key];
            }
        }
    }
    return newObject;
}
//# sourceMappingURL=uploadNFT.js.map