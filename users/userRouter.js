const express = require("express");
const db = require("./userDb");
const postDB = require("../posts/postDb");

const router = express.Router();

router.post("/", validateUser, async (req, res) => {
  const { name } = req.body;

  let user;
  try {
    user = await db.insert({ name });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: "The user information could not be saved." });
  }

  const insertedUser = await db.findById(user.id);

  return res.status(201).json(insertedUser);
});

router.post("/:id/posts", validateUserId, validatePost, async (req, res) => {
  const { user } = req;
  const { text } = req.body;

  const post = await postDB.insert({ text, user_id: user.id });

  if (!post)
    return res
      .status(500)
      .json({ error: "The comment information could not be retreived." });

  // Because sqlite3 doesn't supporting returning (it only returns the id of the created resource)
  // I have to refetch the post to get all of the data. (which is dumb)

  const insertedPost = await postDB.getById(post.id);

  return res.status(201).json(insertedPost);
});

router.get("/", async (req, res) => {
  const users = await db.get();

  if (!users)
    return res
      .status(500)
      .json({ error: "The posts information could not be retrieved." });

  return res.status(200).json(users);
});

router.get("/:id", validateUserId, async (req, res) => {
  const { user } = req;
  return res.status(200).json(user);
});

router.get("/:id/posts", validateUserId, async (req, res) => {
  const { user } = req;

  const posts = await db.getUserPosts(user.id);

  return res.status(200).json(posts);
});

router.delete("/:id", validateUserId, async (req, res) => {
  const { user } = req;
  try {
    await db.remove(user.id);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `The user with the ID of ${user.id} could not be removed.`,
    });
  }

  return res.status(200).json({
    message: `The user with the ID of ${user.id} was successfully deleted.`,
  });
});

router.put("/:id", validateUserId, validateUser, async (req, res) => {
  const { user } = req;

  const newUser = { name: req.body.name };

  try {
    await db.update(user.id, newUser);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: "The user information could not be modified." });
  }

  // Because sqlite3 doesn't supporting returning (it only returns the id of the created resource)
  // I have to refetch the post to get all of the data. (which is dumb)
  const updatedUser = await db.getById(id);

  return res.status(200).json(updatedUser);
});

//custom middleware

async function validateUserId(req, res, next) {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ errorMessage: "Please provide a user id." });

  let user;
  try {
    user = await db.getById(id);
  } catch (err) {
    return res
      .status(500)
      .json({ errorMessage: "Couldn't get user information" });
  }

  if (!user) return res.status(400).json({ error: "Invalid user id" });

  req.user = user;
  next();
}

function validateUser(req, res, next) {
  const { name } = req.body;

  if (!req.body) return res.status(400).json({ message: "missing user data" });

  if (!name)
    return res.status(400).json({ message: "missing required name field" });

  next();
}

function validatePost(req, res, next) {
  const { text } = req.body;

  if (!req.body) return res.status(400).json({ message: "missing post data" });

  if (!text)
    return res.status(400).json({ message: "missing required text field" });

  next();
}

module.exports = router;
