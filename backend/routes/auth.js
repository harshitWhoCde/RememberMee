const express = require("express");
const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();


router.post("/register", async (req, res) => {
    console.log("Registration Attempt:", req.body);

    let { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }

    try {
        email = email.toLowerCase().trim();
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log("Registration failed: User already exists", email);
            return res.status(400).json({ msg: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        console.log("User registered successfully ✅:", email);
        return res.status(201).json({ msg: "User registered successfully" });

    } catch (error) {
        console.error("Registration Error ❌:", error);
        return res.status(500).json({ msg: "Server error" });
    }
});


router.post("/login", async (req, res) => {
    console.log("Login Attempt:", req.body);
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }

    try {
        email = email.toLowerCase().trim();
        const user = await User.findOne({ email });

        if (!user) {
            console.log("Login failed: User not found", email);
            return res.status(400).json({ msg: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Login failed: Invalid credentials for", email);
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "default_super_secret_key_123",
            { expiresIn: "1d" }
        );

        console.log("User logged in successfully ✅:", email);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login Error ❌:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;