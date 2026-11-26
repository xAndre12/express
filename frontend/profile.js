const logout = document.querySelector(".logout")
const role = document.querySelector(".role")
const title = document.querySelector(".title")
const userContent = document.querySelector(".user-content")
const createUser = document.querySelector(".createUser")
const chatWrapper = document.querySelector(".chat-wrapper")
const paymentWrapper = document.querySelector(".pay-button-wrapper")
const closeChat = document.querySelector(".close-chat")
const sendChat = document.querySelector(".send-chat")
const chatInput = document.querySelector(".chat-input")
const textBox = document.querySelector(".text-box")
const chatTranscript = document.querySelector(".chat-transcript")

let firstMessage = true
let editing = 0
let token = ''
let user = {}
let conversationId = ''
let payed = false

const verifyDate = (userDate, currentDate) => {
    if (userDate === currentDate) {
        return true
    }
    else {
        return false
    }
}



window.addEventListener('load', async () => {

    const params = new URLSearchParams(document.location.search);
    const sessionId = params.get("session_id")

    // chatWrapper.style.display = "block";
    token = localStorage.getItem('token')

    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }
    const response = await fetch("http://localhost:3000/profile", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await response;

    user = await data.json();
    console.log(user)
    if (user.payment === "paid") {
        chatWrapper.style.display = "block";


        const subscriptionInterval = setInterval(async () => {
            const now = new Date();

            const currentDate = now.toLocaleString('en-US', {
                month: 'long',
                year: 'numeric'
            }).toLowerCase().replace(' ', '-');
            console.log(verifyDate(user.createdAt, currentDate))

            if (verifyDate(user.createdAt, currentDate) === false) {
                clearInterval(subscriptionInterval);
                const request = await fetch("http://localhost:3000/user-payment", {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        payment: "unpaid",
                        createdAt: "undefined"
                    })
                })
                const response = await request.json();

                if (response.status == "success") {
                    window.location.reload()
                }
                console.log(response)
            }
        }, 60000);
    }
    else {
        paymentWrapper.style.display = "flex";
    }

    if (sessionId) {
        console.log("apelez API")
        const now = new Date();

        const currentDate = now.toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
        }).toLowerCase().replace(' ', '-');

        const request = await fetch(`http://localhost:3000/validate-payment/${sessionId}`, {
            method: "GET",
        })
        const res = await request.json();

        if (res.payment_status === 'paid') {
            const request = await fetch(`http://localhost:3000/user-payment`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    payment: "paid",
                    createdAt: currentDate
                })
            })
            const response = await request.json();

            if (response.status === 'success') {
                chatWrapper.style.display = "block";
                paymentWrapper.style.display = "none";
            }
        }
    }

    if (data?.status == 400) {
        localStorage.removeItem("token")
        window.location.href = "/frontend/login.html"
    }

    const groupedchats = await fetch("http://localhost:3000/user-conversation/null", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const raspuns = await groupedchats
    const userGroupedConversations = await raspuns.json();

    if (raspuns?.status === 200) {
        userGroupedConversations.reverse().forEach((item) => {

            const conversationWrapper = document.createElement("div")

            conversationWrapper.classList.add("conversation-wrapper");

            conversationWrapper.innerHTML = item.chats[0].message_send;

            conversationWrapper.addEventListener('click', () => {
                conversationWrapper.classList.toggle("active")
                conversationWrapper.innerHTML = ''

                if (conversationWrapper.classList.value.includes('active')) {
                    const chatConversation = document.createElement("div");
                    chatConversation.classList.add("chat-transcript");

                    item.chats.forEach((itemChat) => {

                        const p1 = document.createElement("p")
                        const p2 = document.createElement("p")

                        p1.innerHTML = itemChat.message_send
                        p2.innerHTML = itemChat.message_response

                        chatConversation.appendChild(p1)
                        chatConversation.appendChild(p2)
                    });

                    conversationWrapper.appendChild(chatConversation)

                } else {
                    conversationWrapper.innerHTML = item.chats[0].message_send;
                }
            })

            userContent.appendChild(conversationWrapper)
        })
        role.innerHTML = user.role

        if (user.role === "admin") {
            const ul = document.createElement('ul');
            createUser.style.display = "block"
            createUserList(ul);

            createUser.addEventListener("click", () => {
                userContent.innerHTML = "";
                userContent.appendChild(createUserForm(ul))
            })

            chatWrapper.style.display = "none";
        }
    }

    if (data?.status == 200) {
        title.innerHTML = "Welcome back," + user.username

        role.innerHTML = user.role
        if (user.role === "admin") {
            const ul = document.createElement('ul');
            createUser.style.display = "block"
            createUserList(ul);

            createUser.addEventListener("click", () => {
                userContent.innerHTML = "";
                userContent.appendChild(createUserForm(ul))
            })
        }
    }

});

const createNewUser = async (username, email, password) => {
    const response = await fetch("http://localhost:3000/sign-up", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, username })
    });
    if (response.status === 200) {
        return true
    }
    else {
        return false
    }
}

const createUserList = async (ul) => {
    const users = await fetch("http://localhost:3000/users", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })

    const response = await users.json()

    const usersList = response.filter((item) => item.role !== 'admin');

    const req = await fetch(`http://localhost:3000/all-users-conversations`, {
        method: "GET",
        headers: {
            "authorization": `Bearer ${token}`
        }
    })
    const conversationList = await req.json();

    for (let index = 0; index < usersList.length; index++) {

        const li = document.createElement("li")

        const userInfo = document.createElement('div')
        userInfo.classList.add('user-info');

        const p = document.createElement("p")
        p.textContent = usersList[index].username

        const buttonsWrapper = document.createElement("div")
        buttonsWrapper.classList.add("buttons-wrapper")

        const editButton = document.createElement("button")
        editButton.classList.add("edit")
        editButton.textContent = "Edit"

        editButton.addEventListener("click", () => {
            const editWrapper = createEditUser(li, usersList[index].username, usersList[index].password, usersList[index].email, usersList[index]._id)
            const existEditWrapper = li.querySelector('.edit-wrapper')

            if (!existEditWrapper) {
                li.appendChild(editWrapper)
            }

        })


        const deleteButton = document.createElement("button")
        deleteButton.classList.add("delete")
        deleteButton.textContent = "Delete"

        const conversationsButton = document.createElement("button")
        conversationsButton.classList.add("delete")
        conversationsButton.textContent = "Convs. DEL"

        const showConversationsButton = document.createElement("button")
        showConversationsButton.classList.add("show-conversations")
        showConversationsButton.textContent = "Show Conv."

        deleteButton.addEventListener("click", async () => {

            const req = await fetch(`http://localhost:3000/delete-user/${usersList[index]._id}/${usersList[index].id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            const res = await req.json();

            if (res) window.location.reload();
        })

        let conversationShown = false;

        showConversationsButton.addEventListener("click", async () => {

            if (conversationShown === false) {

                const req = await fetch(
                    `http://localhost:3000/user-conversation/${usersList[index].id}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );

                const res = await req.json();

                showConversationsButton.innerHTML = "Hide";
                conversationShown = true;

                if (res?.length) {
                    res.forEach(groupedchats => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.classList.add("conversation-wrapper");

                        const primulMesaj = groupedchats.chats[0].message_send || "empty";

                        const deleteSingleConversation = document.createElement("button");
                        deleteSingleConversation.classList.add("delete-single");
                        deleteSingleConversation.innerHTML = "delete";

                        deleteSingleConversation.addEventListener("click", async () => {
                            console.log(groupedchats.chats[0].conversation_id);

                            const req = await fetch(`http://localhost:3000/delete-single-conversation/${groupedchats.chats[0].conversation_id}`, {
                                method: "DELETE",
                                headers: {
                                    "Authorization": `Bearer ${token}`
                                }
                            })
                            const res = await req.json();
                        })

                        div.textContent = primulMesaj;
                        div.appendChild(deleteSingleConversation)

                        userInfo.appendChild(div);

                    });
                }
            } else {
                conversationShown = false;
                showConversationsButton.innerHTML = "Show Conv.";
                const conversationsUser = document.querySelectorAll('.conversation-wrapper')
                conversationsUser.forEach(element => {
                    userInfo.removeChild(element);
                });
            }
        });

        conversationsButton.addEventListener("click", async () => {
            const req = await fetch(`http://localhost:3000/conversations-delete/${usersList[index].id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            const res = await req.json();

            if (res) window.location.reload();
        })


        const hasConversation = conversationList.find((value) => {
            return value.user_id === usersList[index].id
        })

        buttonsWrapper.appendChild(editButton)
        buttonsWrapper.appendChild(deleteButton)

        if (hasConversation) {
            buttonsWrapper.appendChild(conversationsButton)
            buttonsWrapper.appendChild(showConversationsButton)
        }

        userInfo.appendChild(p)
        userInfo.appendChild(buttonsWrapper)

        li.appendChild(userInfo)

        ul.appendChild(li)

    }
    userContent.innerHTML = "";
    userContent.appendChild(ul);
}

const createEditUser = (li, username, password, email, index) => {
    const editWrapper = document.createElement("div")
    editWrapper.classList.add("edit-wrapper")

    const editUsername = document.createElement("input")
    editUsername.type = "text"
    editUsername.placeholder = username

    const editEmail = document.createElement("input")
    editEmail.type = "email"
    editEmail.placeholder = email

    const editPassword = document.createElement("input")
    editPassword.type = "text"
    editPassword.placeholder = password

    const buttonsWrapper = document.createElement("div")
    buttonsWrapper.classList.add("buttons-wrapper")

    const updateButton = document.createElement("button")
    updateButton.classList.add("update")
    updateButton.textContent = "Update"


    updateButton.addEventListener("click", async () => {
        let newUser = {
            username: "",
            email: "",
            password: ""
        }
        if (editUsername.value != "") {
            newUser.username = editUsername.value
        }
        else {
            newUser.username = username
        }
        if (editEmail.value != "") {
            newUser.email = editEmail.value
        }
        else {
            newUser.email = email
        }
        if (editPassword.value != "") {
            newUser.password = editPassword.value
        }
        else {
            newUser.password = password
        }

        const req = await fetch(`http://localhost:3000/users/${index}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        })
        const user = await req.json();
        if (req.status == 200) {
            window.location.reload();
        }
    })

    const closeButton = document.createElement("button")
    closeButton.classList = "close"
    closeButton.textContent = "Close"

    closeButton.addEventListener("click", () => {
        li.removeChild(editWrapper)
    })
    editWrapper.appendChild(editUsername)
    editWrapper.appendChild(editEmail)
    editWrapper.appendChild(editPassword)

    buttonsWrapper.appendChild(updateButton)
    buttonsWrapper.appendChild(closeButton)

    editWrapper.appendChild(buttonsWrapper)

    return editWrapper;
}
const createUserForm = (li) => {
    const createWrapper = document.createElement("div")
    createWrapper.classList.add("new-user-wrapper")

    const p = document.createElement("p")
    p.textContent = "Create a new user"

    const createUsername = document.createElement("input")
    createUsername.type = "text"
    createUsername.placeholder = "Username"

    const createEmail = document.createElement("input")
    createEmail.type = "email"
    createEmail.placeholder = "Email"

    const createPassword = document.createElement("input")
    createPassword.type = "text"
    createPassword.placeholder = "Password"

    const buttonsWrapper = document.createElement("div")
    buttonsWrapper.classList.add("buttons-wrapper")

    const createButton = document.createElement("button")
    createButton.classList.add("create")
    createButton.textContent = "Create"

    const errorMessage = document.createElement('p')

    createButton.addEventListener("click", async () => {

        if (createUsername.value && createEmail.value && createPassword.value) {

            await createNewUser(createUsername.value, createEmail.value, createPassword.value)

            const ul = document.createElement('ul');
            createUserList(ul)
        } else {
            errorMessage.classList.add('error-message')
            createWrapper.appendChild(errorMessage)
            errorMessage.textContent = "Please complete every field"
            setTimeout(() => {
                createWrapper.removeChild(errorMessage);
            }, 3000)

        }
    })

    const closeButton = document.createElement("button")
    closeButton.classList.add("close")
    closeButton.textContent = "Close"

    closeButton.addEventListener("click", () => {
        const ul = document.createElement('ul');
        createUserList(ul)
    })

    createWrapper.appendChild(p)
    createWrapper.appendChild(createUsername)
    createWrapper.appendChild(createEmail)
    createWrapper.appendChild(createPassword)


    buttonsWrapper.appendChild(createButton)
    buttonsWrapper.appendChild(closeButton)

    createWrapper.appendChild(buttonsWrapper)

    return createWrapper
}

const handleLogout = async () => {
    const token = localStorage.getItem('token')

    const response = await fetch("http://localhost:3000/logout", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    const data = await response;
    if (data?.status == 200) {
        localStorage.removeItem("token")
        window.location.href = "/frontend/login.html"
    }
}

logout.addEventListener("click", () => {
    handleLogout()
})

chatWrapper.addEventListener("click", () => {
    chatWrapper.classList.add("press");
});
let responding = false;

closeChat.addEventListener("click", (e) => {
    if (responding === false) {
        e.stopPropagation()
        chatWrapper.classList.remove("press");
        textBox.innerHTML = ""
        firstMessage = true
        chatInput.value = "";
    }
});

const handleCallAI = async (loading, textValue) => {
    const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama3",
            stream: false,
            messages: [
                {
                    role: "user",
                    content: textValue
                }
            ]
        })
    });

    const response = await res.json();


    if (response.message.content) {
        loading.remove();

        const aiResponse = document.createElement("p");
        aiResponse.textContent = response.message.content;
        textBox.appendChild(aiResponse);

        await fetch("http://localhost:3000/user-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message_send: textValue,
                message_response: response.message.content,
                user_id: user.id,
                conversation_id: conversationId
            })
        });

        chatInput.value = "";
    }
    responding = false;
};

sendChat.addEventListener("click", async () => {
    if (responding === false && chatInput.value !== "") {
        responding = true;
        if (firstMessage === true) {
            conversationId = crypto.randomUUID();

            const date = new Date();
            const currentDate = date.toLocaleString()

            const response = await fetch("http://localhost:3000/user-conversation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    created_at: currentDate,
                    user_id: user.id
                })
            })

            firstMessage = false
        }

        const message = chatInput.value;

        const newMessage = document.createElement("p");
        newMessage.textContent = message;
        textBox.appendChild(newMessage);



        const loading = document.createElement("img");
        loading.src = "loading.gif";
        loading.style.width = "120px";
        loading.style.marginLeft = "auto"
        textBox.appendChild(loading);

        await handleCallAI(loading, chatInput.value);

    }
});


paymentWrapper.querySelector('button').addEventListener("click", async () => {
    const req = await fetch("http://localhost:3000/start-payment", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const response = await req.json()

    window.location.replace(response.url);
})
