"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
const bucketUrl = "gs://motonetworknft";
const admin = require("firebase-admin");
const serviceAccount = require("./motonetwork-dd52ce6878e4.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketUrl,
});
const ALLOWED_ORIGINS = ["http://motonetwork.io", "http://localhost:4200"];
const cors = require("cors");
const express = require('express');
const uploadNFT_1 = require("./uploadNFT");
const createOrder_1 = require("./createOrder");
const userManagement_1 = require("./userManagement");
const fileManagement_1 = require("./fileManagement");
const executeOrder_1 = require("./executeOrder");
const subscriptionManagement_1 = require("./subscriptionManagement");
const corsOptions = {
    origin: function (origin, callback) {
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};
const app = express();
app.use(cors(corsOptions));
//app.use((req, res, next) => { setCorsHeaders(req, res, next) });
app.post('/uploadNFT', (req, res) => { uploadNFT_1.uploadNFT(req, res); });
app.post('/orderCreated', (req, res) => { createOrder_1.orderCreated(req, res); });
app.post('/getNonce', (req, res) => { userManagement_1.getNonce(req, res); });
app.post('/verifySignature', (req, res) => { userManagement_1.verifySignature(req, res); });
app.post("/generateFileLink", (req, res) => { fileManagement_1.generateFileLink(req, res); });
app.post("/finalizeBuyOrder", (req, res) => { executeOrder_1.finalizeBuyOrder(req, res); });
app.post("/createTier", (req, res) => { subscriptionManagement_1.createTier(req, res); });
app.post("/updateTier", (req, res) => { subscriptionManagement_1.updateTier(req, res); });
app.post("/cancelTier", (req, res) => { subscriptionManagement_1.cancelTier(req, res); });
app.listen(4139, "0.0.0.0", () => { console.log("online."); });
//# sourceMappingURL=index.js.map