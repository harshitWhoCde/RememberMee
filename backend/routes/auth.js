const express = require("express");
const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();


router.post("/register", async (req, res) => {
    console.log("REGISTER HIT"); // 👈 debug only

    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return res.status(201).json({ msg: "User registered successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server error" });
    }
});


// 🔹 LOGIN API (👉 YOUR STEP 5 CODE GOES HERE)
router.post("/login", async (req, res) => {
    console.log("Login Attempt Body:", req.body);
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!email || !password) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        if (!user) {
            return res.status(400).json({ msg: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "default_super_secret_key_123",
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error(error); // 👈 IMPORTANT (see error in terminal)
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;