const express = require("express");
const cors = require("cors");
const users = require("./users/userRouter");
const posts = require("./posts/postRouter");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 5000;

const logger = (req, res, next) => {
  console.log(`${req.method} - ${req.url} - ${Date.now()}`);
  next();
};

const server = express();
server.use(logger);
server.use(cors());
server.use(express.json());

server.use("/api/users", users);
server.use("/api/posts", posts);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
