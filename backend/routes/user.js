// backend/routes/user.js
const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const jwt = require("jsonwebtoken");
const { createSecretToken } = require("../utils/SecretToken");
const z = require("zod");
const { authMiddleware } = require("../middleware/authMiddleware");

const signupbody = z.object({
  username: z.string(),
  password: z.string(),
  firstname: z.string(),
  lastname: z.string(),
});

const signinBody = z.object({
  username: z.string().email(),
  password: z.string(),
});

const updateBody = z.object({
  password: z.string(),
  firstName: z.string().optional(),
  lastname: z.string.optional(),
});

router.post("/signup", async (req, res) => {
  const { success } = signupbody.safeparse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "email already taken / incorrect inputs",
    });
  }

  const existinguser = await User.findone({
    username: req.body.username,
  });

  if (!existinguser) {
    return res.status(411).json({
      message: "Email already taken/Incorrect inputs",
    });
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });
  const userId = user._id;

  await Account.create({
    userId,
    balance: 1 + Math.random() * 10000,
  });

  const token = jwt.sign(
    {
      userId,
    },
    createSecretToken
  );

  res.json({
    message: "User created successfully",
    token: token,
  });
});

router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (user) {
    const token = jwt.sign(
      {
        userId: user._id,
      },
      createSecretToken
    );

    res.json({
      token: token,
    });
    return;
  }
  res.status(411).json({
    message: "Error while logging in",
  });
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating information",
    });
  }

  await User.updateOne(req.body, {
    id: req.userId,
  });

  res.json({
    message: "Updated successfully",
  });
});

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
