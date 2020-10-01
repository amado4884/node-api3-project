const express = require("express");
const db = require("./userDb");
const postDB = require("../posts/postDb");

const router = express.Router();

router.post("/", async (req, res) => {
  const { name } = req.body;

  if (!name)
    return res.status(400).json({
      errorMessage: "Please provide a name for this new user.",
    });

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

router.post("/:id/posts", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!id)
    return res.status(400).json({ errorMessage: "Please provide a user id." });

  if (!text)
    return res
      .status(400)
      .json({ errorMessage: "Please provide text for the post." });

  let user;
  try {
    user = await db.getById(id);
  } catch (err) {
    return res
      .status(404)
      .json({ error: "The user information could not be retrieved." });
  }

  if (user.length === 0)
    return res
      .status(404)
      .json({ message: "The user with the specified ID does not exist." });

  const post = await postDB.insert({ text, user_id: id });

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

router.get("/:id/posts", async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ errorMessage: "Please provide a valid ID." });

  let user;
  try {
    user = await db.getById(id);
  } catch (err) {
    return res
      .status(404)
      .json({ error: "The post information could not be retrieved." });
  }

  if (user.length === 0)
    return res
      .status(404)
      .json({ message: "The post with the specified ID does not exist." });

  const posts = await db.getUserPosts(id);

  return res.status(200).json(posts);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ errorMessage: "Please provide a valid ID." });

  const user = await db.findById(id);

  if (user.length === 0)
    return res
      .status(404)
      .json({ message: "The user with the specified ID does not exist." });

  try {
    await db.remove(id);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `The user with the ID of ${id} could not be removed.`,
    });
  }

  return res.status(200).json({
    message: `The user with the ID of ${id} was successfully deleted.`,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!id)
    return res.status(400).json({ errorMessage: "Please provide a valid ID." });

  if (!name)
    return res.status(400).json({
      errorMessage: "Please provide name for the user.",
    });

  try {
    await db.getById(id);
  } catch (err) {
    return res
      .status(404)
      .json({ message: "The post with the specified ID does not exist." });
  }

  const newUser = { name };

  try {
    await db.update(id, newUser);
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
    return res.status(400).json({ error: "Invalid user id" });
  }

  req.user = user;
  next();
}

function validateUser(req, res, next) {
  // do your magic!
}

function validatePost(req, res, next) {
  // do your magic!
}

module.exports = router;
