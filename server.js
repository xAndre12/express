// https://docs.ollama.com
const uuid = require('uuid');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

const PORT = 3000;

app.use(cors());
app.use(express.json())


const UserSchema = new mongoose.Schema({
    id: {type: String,  unique: true},
    username: { type: String, require: true },
    role: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true }
})

const BlacklistSchema = new mongoose.Schema({
    token: { type: String, require: true }
})

const UserChatSchema = new mongoose.Schema({
    message_send: { type: String, require: true },
    message_response: { type: String, require: true },
    user_id: { type: String, require: true, unique: true },
    conversation_id: { type: String, require: true, unique: true },
})

const UserConversationSchema = new mongoose.Schema({
    created_at: { type: String, require: true },
    conversation_id: { type: String, require: true, unique: true },
    user_id: { type: String, require: true, unique: true },
})

const User = mongoose.model("User", UserSchema);
const BlackList = mongoose.model("BlackList", BlacklistSchema);
const UserChat = mongoose.model("UserChat", UserChatSchema);
const UserConversation = mongoose.model("UserConversation", UserConversationSchema);

const JWT_SECRET = 'a4f8b84e2b1dcd7d0bb8f3c1b88b45d74fefb13d926cb1d2e61b23d66cc12d0a'

mongoose.connect("mongodb+srv://admin:admin@cluster0.jgftyc5.mongodb.net/?appName=Cluster0")
    .then(() => { console.log("MongoDB connected") })
    .catch((err) => { console.log(err) })


//middleware
const authentificateToken = async (req, res, next) => {
    const headers = req.headers.authorization
    const token = headers && headers.split(" ")[1]
    if (token === undefined) {
        return res.status(400).json("token does not exist")
    }
    try {
        const existingToken = await BlackList.findOne({ token })
        if (existingToken) { return res.status(400).json("log out token") }
    }
    catch (err) {
        res.status(500).json("Bad response")
    }

    jwt.verify(token, JWT_SECRET, (err, value) => {
        if (err !== null && err.toString().includes("signature")) {
            return res.status(400).json("invalid token")
        }
        if (err !== null && err.toString().includes("expired")) {

            return res.status(400).json("expired token")
        }
        if (err !== null && err) {
            return res.status(400).json(err).toString()
        }
        req.user = value;
        next()
    })
}

const generateToken = (user) => {
    return jwt.sign({ email: user.email, password: user.password, role: user.role, username: user.username, id: user.id  }, JWT_SECRET, { expiresIn: "1h" });
}

app.post("/sign-up", async (req, res) => {
    const { username, email, password } = req.body

    if (password === undefined || email === undefined || username === undefined || !password.length || !email.length) {
        return res.status(400).json("Please complete all signup fileds.")
    }

    try {
        const existing = await User.findOne({ email })
        if (existing) {
            return res.status(400).json("email already exist")
        }

        const userId = uuid.v4();
        const newUser = await User.create({ email, password, username, role: 'user', id: userId })
        const token = generateToken(newUser)

        res.status(200).json(`user created ${token}`)
    } catch (err) {
        res.status(500).json("Bad response")
    }
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    if (password === undefined || email === undefined) {
        return res.status(400).json("This fields are required")
    }
    try {
        const user = await User.findOne({ email })
        if (user.email === email && user.password === password) {
            const token = generateToken({ email, password, role: user.role, username: user.username, id: user.id })
            return res.status(200).json(token)
        }
    }
    catch (err) { res.status(500).json("Please complete all login fileds.") }
})

app.post("/logout", authentificateToken, async (req, res) => {
    const headers = req.headers.authorization
    const token = headers.split(" ")[1]
    await BlackList.create({ token })
    return res.status(200).json("logged out successfully")
})

app.get("/users", authentificateToken, async (req, res) => {
    const users = await User.find()
    res.status(200).json(users)
})

app.get("/profile", authentificateToken, (req, res) => {
    res.status(200).json({ ...req.user })
})

app.put('/users/:id', authentificateToken, async (req, res) => {
    const { isAdmin } = req?.body;

    const user = { ...req?.body, role: isAdmin ? 'admin' : 'user' };

    const id = req.params.id;

    await User.findByIdAndUpdate(id, user)

    res.status(200).json(user)

})

app.delete("/delete-user/:id", authentificateToken, async (req, res) => {
    const id = req.params.id;
    await User.deleteOne({
        _id: id
    })
    res.status(200).json(true)
})

app.post("/user-chat", authentificateToken, async (req, res) => {
    const { message_send, message_response, user_id, conversation_id } = req.body

    if (message_send === undefined || message_response === undefined || user_id === undefined) {
        return res.status(400).json("All fields are required")
    }

    try {
       await UserChat.create({ message_send, message_response, user_id })
       return res.status(200).json({
            created: true
       })
    }
    catch (err) { res.status(500).json("Something went wrong", err) }
});

app.get("/user-chat", authentificateToken, async (req, res) => {
    const chats = await UserChat.find({
        user_id: req.user.id
    });
    res.status(200).json(chats);
});


app.post("/user-conversation", authentificateToken, async (req, res) => {
    const { conversation_id, created_at, user_id } = req.body

    if (conversation_id === undefined || created_at === undefined || user_id === undefined) {
        return res.status(400).json("All fields are required")
    }

    try {
       await UserConversation.create({ conversation_id, created_at, user_id })
       return res.status(200).json({
            created: true
       })
    }
    catch (err) { res.status(500).json("Something went wrong", err) }
});

app.get("/user-conversation", authentificateToken, async (req, res) => {
    const conversation = await UserConversation.find({
        user_id: req.user.id
    });
    res.status(200).json(conversation);
});

app.listen(PORT, () => {
    console.log("Am pornit server-ul")
})