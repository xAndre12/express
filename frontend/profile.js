const logout = document.querySelector(".logout")
const role = document.querySelector(".role")
const title = document.querySelector(".title")
const userContent = document.querySelector(".user-content")
const createUser = document.querySelector(".createUser")
const chatWrapper = document.querySelector(".chat-wrapper")
const closeChat = document.querySelector(".close-chat")
const sendChat = document.querySelector(".send-chat")
const chatInput = document.querySelector(".chat-input")
const textBox = document.querySelector(".text-box")
const chatTranscript = document.querySelector(".chat-transcript")

let editing = 0
let token = ''
let user = {}

const createNewUser = async (email, password, username) => {
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
    console.log(usersList)
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

        deleteButton.addEventListener("click", async () => {
            const req = await fetch(`http://localhost:3000/delete-user/${usersList[index]._id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            const res = await req.json();

            if (res) window.location.reload();
        })

        buttonsWrapper.appendChild(editButton)
        buttonsWrapper.appendChild(deleteButton)

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
            const create = await createNewUser(createUsername.value, createEmail.value, createPassword.value)
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

window.addEventListener('load', async () => {
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

    if (data?.status == 400) {
        localStorage.removeItem("token")
        window.location.href = "/frontend/login.html"
    }
    if (data?.status == 200) {
        title.innerHTML = "Welcome back," + user.username

        const response = await fetch("http://localhost:3000/user-chat", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        const chats = await response.json();

        chats.forEach((item, index) => {
            console.log(index)

            const p1 = document.createElement("p")
            const p2 = document.createElement("p")

            p1.innerHTML = item.message_send
            p2.innerHTML = item.message_response

            chatTranscript.appendChild(p1)
            chatTranscript.appendChild(p2)
        });

        console.log(chats);

        const obj = {
            test1: 'test 1',
            test2: "test 2"
        }

        const arr = ['test 1', 'test 2']

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
        else {
            // userContent.innerHTML = "lorem ipsum"
            createUser.style.display = "none"
        }
    }


});

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

closeChat.addEventListener("click", (e) => {
    e.stopPropagation()
    chatWrapper.classList.remove("press");
    textBox.innerHTML = ""
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
                user_id: user.id
            })
        });

        chatInput.value = "";
    }
};

sendChat.addEventListener("click", async () => {
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

});