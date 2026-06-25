const resetInput = document.querySelector(".resetInput")
const resetButton = document.querySelector(".resetButton")
const error = document.querySelector(".error")

const getUserAdmin = async () => {
    const req = await fetch("http://localhost:3000/users", {
        method: "GET",
        headers: {
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicGFzc3dvcmQiOiJwYXNzd29yZCIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoidGVzdCIsImlhdCI6MTc3NzYzMzYzMywiZXhwIjoxODA5MTkxMjMzfQ.34-bdU-zShfpDv0lQSzDdintXvfYwwbpREEfVsAXUx0`
        }
    });

    const users = await req.json();

    const admin = users.find(user => user.role === "admin");

    return admin;
};

const updateAdmin = async(admin) => {
    const req = await fetch(`http://localhost:3000/users/${admin._id}`,{
        method: "PUT",
            headers: {
                "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicGFzc3dvcmQiOiJwYXNzd29yZCIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoidGVzdCIsImlhdCI6MTc3NzYzMzYzMywiZXhwIjoxODA5MTkxMjMzfQ.34-bdU-zShfpDv0lQSzDdintXvfYwwbpREEfVsAXUx0`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...admin,
                isAdmin: true
            })

    })

    const response = await req.json();

        if (req.status === 200) {
            setTimeout(() => {
                window.location.href = 'http://127.0.0.1:5500/frontend/login.html'
            }, 1000);
        }
}

resetButton.addEventListener("click", async () => {
    if (resetInput.value === "") {
        error.style.display = "flex";

        setTimeout(() => {
            error.style.display = "none";
        }, 3000);

        return;
    }

    const admin = await getUserAdmin();


    const newAdmin = { 
        ...admin,
        password: resetInput.value
     }


    updateAdmin(newAdmin)
    
     
});


window.addEventListener("load",()=>{
    if(window.location.search !== "?reset_admin"){
        window.location.href = 'http://127.0.0.1:5500/frontend/login.html'
    }
})