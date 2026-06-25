const title = document.querySelector(".text")
const login = document.querySelector(".login")
const switchPage = document.querySelector(".switch-page")
const email = document.querySelector(".email")
const password = document.querySelector(".password")
const username = document.querySelector(".username")
const error = document.querySelector('.error');
const overlay = document.querySelector('.overlay')
const overlayButton = document.querySelector(".close-button")
const overlayText = document.querySelector(".overlay-text")

const handleAuthentificate = async (endpoint) => {
    const response = await fetch(`http://localhost:3000/${endpoint}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(endpoint === 'login' ?
            { email: email.value, password: password.value } :
            { email: email.value, password: password.value, username: username.value })
    });
    const content = await response.json();

    if (response.status === 200) {
        localStorage.setItem('token', content)
        window.location.href = '/frontend/profile.html'
    } else {
        error.innerHTML = content;
        error.style.display = 'flex';
        setTimeout(() => {
            error.style.display = 'none';
            error.innerHTML = '';
        }, 2000)
    }

}

switchPage.addEventListener("click", () => {
    if (switchPage.innerHTML === "Sign up") {
        title.innerHTML = "Sign up portal"
        login.innerHTML = "Sign up"
        switchPage.innerHTML = "Login"
        switchPage.style.background = "rgb(107, 187, 107)"
        login.style.background = "rgb(209, 110, 110)"
        username.style.display = "flex"
    }
    else {
        title.innerHTML = "Login portal"
        login.innerHTML = "Login"
        switchPage.innerHTML = "Sign up"
        login.style.background = "rgb(107, 187, 107)"
        switchPage.style.background = "rgb(209, 110, 110)"
        username.style.display = "none"
    }
})
login.addEventListener("click", () => {
    if (switchPage.innerHTML === "Sign up") {
        handleAuthentificate('login')
    }
    else (
        handleAuthentificate('sign-up')
    )
})

let typedWord = "";
let firstTry = true

document.addEventListener("keydown", function (event) {
    if (!firstTry) {
        console.log(event.key)
        if (event.key === 'Backspace') {
            typedWord = typedWord.slice(0, typedWord.length - 1)
            overlayText.innerHTML = typedWord
            console.log(typedWord)
            return;
        }
        if (event.key.length === 1) {
            typedWord = typedWord + event.key;
            overlayText.innerHTML = typedWord
            console.log(typedWord)
        }

        if (typedWord === "reset_admin") {
            window.location.href =
                "http://127.0.0.1:5500/frontend/reset.html?reset_admin";
        }

    }
    if (event.ctrlKey && event.key.toLowerCase() === "q" && firstTry) {
        firstTry = false;
        overlay.style.display = "flex"
    }



});
overlayButton.addEventListener("click",()=>{
    overlay.style.display = "none"
    firstTry = true;
    typedWord = "";
    overlayText.innerHTML = "";
})

