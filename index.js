import express from "express";
import { config } from "dotenv";
import { connect } from "mongoose";
import { UserModel as User } from "./models/User.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
// import { WebSocketServer } from 'ws';
// import { MessageModel as Message } from './models/Message.js';

const app = express();
// app.use(cors({
//     credentials: true,
//     origin: "0.0.0.0"
// }));

// Need to use in order to parse the json in the request body
app.use(express.json());
app.use(cookieParser());
config();

connect(process.env.MONGO_URL);
const JWT_SECRET = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

app.get("/test", (req, res) => {
  console.log("test route called");
  res.json("testing successful");
});
app.get("/", (req, res) => {
  console.log("/ (Root) path called");
  res.json("Root path");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  console.log("Called register", username);
  console.log("Exists ==> ", User.find({username:{$exists: true} }));

//   User.findOne({ username: username }, (err, user) => {
//     if (user) {
//       return res.json({ message: "USer Exists" });
//     }
//   });

  User.create({
    username: username,
    password: bcrypt.hashSync(password, bcryptSalt),
  })
    .then((userDetails) => {
      // After Creating the user we want it to Sign it by auth via a JWT
      jwt.sign(
        { userId: userDetails._id, username: userDetails.username },
        JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;

          console.log("Created User ");

          return res.cookie("token", token).status(201).json({
            username: userDetails.username,
            id: userDetails._id,
          });
        }
      );
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then((foundUser) => {
      if (foundUser) {
        const isPassOk = bcrypt.compare(password, foundUser.password);
        if (isPassOk) {
          jwt.sign(
            { userId: foundUser._id, username: username },
            JWT_SECRET,
            {},
            (err, token) => {
              if (err) throw err;

              res.cookie("token", token).json({
                id: foundUser._id,
                username: foundUser.username,
              });
            }
          );
        }
      } else {
        console.log("User not found!!");
        res.status(404).json("User not found");
      }
    })
    .catch((err) => {
      console.log("Error while Logging in", err);
    });
});

app.get("/profile", (req, res) => {
  // console.log("Request => ", req)
  const { token } = req.cookies;

  if (token) {
    jwt.verify(token, JWT_SECRET, {}, (err, UserData) => {
      if (err) throw err;

      res.json(UserData);
    });
  } else {
    res.status(401).json("No token found");
  }
});

const server = app.listen(4000);
