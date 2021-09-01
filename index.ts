"use strict";
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
import { uploadNFT } from "./uploadNFT";
import { orderCreated } from "./createOrder";
import { getNonce, verifySignature } from "./userManagement";
import { generateFileLink } from "./fileManagement";
import { finalizeBuyOrder } from "./executeOrder";
const corsOptions = {
  origin: function (origin:any, callback:any) {
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200
}

const app = express();
app.use(cors(corsOptions));
//app.use((req, res, next) => { setCorsHeaders(req, res, next) });
app.post('/uploadNFT', (req:Express.Request, res:Express.Response) => { uploadNFT(req, res) });
app.post('/orderCreated', (req: Express.Request, res: Express.Response) => { orderCreated(req, res) });
app.post('/getNonce', (req: Express.Request, res: Express.Response) => { getNonce(req, res) });
app.post('/verifySignature', (req: Express.Request, res: Express.Response) => { verifySignature(req, res) });
app.post("/generateFileLink", (req: Express.Request, res: Express.Response) => { generateFileLink(req, res) });
app.post("/finalizeBuyOrder", (req: Express.Request, res: Express.Response) => { finalizeBuyOrder(req, res) });

app.listen(4139,"0.0.0.0", () => { console.log("online."); });
