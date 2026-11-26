// https://docs.ollama.com
const uuid = require('uuid');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const stripe = require('stripe')
const mongoose = require('mongoose');

const PORT = 3000;

app.use(cors());
app.use(express.json())

const stripeAPI = new stripe("sk_test_51UQp6xRFNGqt0pBAHByaRLq9lr0pZOEa6GKTuyPBbXMUONAqTBjUjZ8sTBh8JarVAqpyQeAkuBrftgK4xG2S6zdh00BF0SYaiJ")

const UserSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    username: { type: String, require: true },
    role: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    payment: { type: String, require: true },
    createdAt: { type: String, require: true }
})

const BlacklistSchema = new mongoose.Schema({
    token: { type: String, require: true }
})

const UserChatSchema = new mongoose.Schema({
    message_send: { type: String, require: true },
    message_response: { type: String, require: true },
    user_id: { type: String, require: true },
    conversation_id: { type: String, require: true },
})

const UserConversationSchema = new mongoose.Schema({
    created_at: { type: String, require: true },
    conversation_id: { type: String, require: true },
    user_id: { type: String, require: true },
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

    jwt.verify(token, JWT_SECRET, async (err, value) => {
        if (err !== null && err.toString().includes("signature")) {
            return res.status(400).json("invalid token")
        }
        if (err !== null && err.toString().includes("expired")) {

            return res.status(400).json("expired token")
        }
        if (err !== null && err) {
            return res.status(400).json(err).toString()
        }
        await User.find({ id: value.id }).then((userData) => {
            req.user = { ...value, payment: userData[0]?.payment, createdAt: userData[0]?.createdAt };
            next()
        })
    })
}

const generateToken = (user) => {
    return jwt.sign({ email: user.email, password: user.password, role: user.role, username: user.username, id: user.id }, JWT_SECRET, { expiresIn: "1h" });
}

//Stripe integration

app.post("/start-payment", async (req, res) => {
    try {
        const session = await stripeAPI.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: { name: 'Test' },
                        unit_amount: 1000
                    },
                    quantity: 1
                }
            ],
            success_url: 'http://localhost:5500/frontend/profile.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:5500/frontend/profile.html?canceled=true}'
        })

        res.status(200).json({ url: session.url })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message })
    }
})


app.get("/validate-payment/:sessionId", async (req, res) => {
    const session_id = req.params.sessionId

    try {
        const session = await stripeAPI.checkout.sessions.retrieve(session_id);

        res.status(200).json({
            status: session.status,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_email
        });

    } catch (err) {
        res.status(400).json({ error: err })
    }
})

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

        const now = new Date();

        const currentDate = now.toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
        }).toLowerCase().replace(' ', '-');

        const userId = uuid.v4();
        const newUser = await User.create({ email, password, username, role: 'user', id: userId, payment: 'paid', createdAt: currentDate  })
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

app.delete("/delete-user/:id/:userId", authentificateToken, async (req, res) => {

    const id = req.params.id;
    const userId = req.params.userId

    await User.deleteOne({
        _id: id
    })

    await UserConversation.deleteMany({
        user_id: userId
    })

    await UserChat.deleteMany({
        user_id: userId

    })

    res.status(200).json(true)
})

app.delete("/conversations-delete/:userId", authentificateToken, async (req, res) => {
    const userId = req.params.userId

    await UserConversation.deleteMany({
        user_id: userId
    })
    await UserChat.deleteMany({
        user_id: userId
    })
    res.status(200).json(true)
})

app.post("/user-chat", authentificateToken, async (req, res) => {
    const { message_send, message_response, user_id, conversation_id } = req.body

    if (message_send === undefined || message_response === undefined || user_id === undefined || conversation_id === undefined) {
        return res.status(400).json("All fields are required")
    }

    try {
        await UserChat.create({ message_send, message_response, user_id, conversation_id })
        return res.status(200).json({
            created: true
        })
    }
    catch (err) {
        return res.status(500).json({
            message: err.message,
            code: err.code,
            keyValue: err.keyValue
        });
    }
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



app.get("/user-conversation/:userId", authentificateToken, async (req, res) => {
    const userId = req.params.userId

    const conversations = await UserConversation.find({
        user_id: userId !== "null" ? userId : req.user.id
    });

    const chats = await UserChat.find({
        user_id: userId !== "null" ? userId : req.user.id
    });
    const groupedchats = conversations.map(function (conversation) {

        const conversationChats = chats.filter(function (chat) {
            return chat.conversation_id === conversation.conversation_id;
        });

        return {
            ...conversation.toObject(),
            chats: conversationChats
        };
    });

    res.status(200).json(groupedchats);
});

app.get("/all-users-conversations", authentificateToken, async (req, res) => {
    const conversations = await UserConversation.find({})
    const chats = await UserChat.find({});
    res.status(200).json(conversations, chats)
})

app.delete("/delete-single-conversation/:conversationId", authentificateToken, async (req, res) => {
    const conversation_id = req.params.conversationId
    res.status(200).json("conversation_id: " + conversation_id + " deleted")
    await UserConversation.deleteOne({
        conversation_id: conversation_id
    })
    await UserChat.deleteMany({
        conversation_id: conversation_id
    })
})

app.put("/user-payment", authentificateToken, async (req, res) => {
    const userId = req.body.userId;
    const payment = req.body.payment;
    const createdAt = req.body.createdAt

    await User.findOneAndUpdate(
        { id: userId },
        { $set: { payment: payment, createdAt:createdAt} },
        // {$set:{createdAt:createdAt}}
    )

    res.status(200).json({ status: 'success' })
})





app.listen(PORT, () => {
    console.log("Am pornit server-ul")
})

