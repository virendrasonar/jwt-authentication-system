function togglePassword(id, eye) {
    const input = document.getElementById(id);

    if (input.type === "password") {
        input.type = "text";
        eye.innerHTML = "Hide";
    } else {
        input.type = "password";
        eye.innerHTML = "Show";
    }
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (email === "" || password === "") {
        message.style.color = "red";
        message.innerText = "Please enter email and password.";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("role", data.role);

            message.style.color = "lime";
            message.innerText = "Login successful. Redirecting...";

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } else {
            message.style.color = "red";
            message.innerText = data.message || "Invalid email or password";
        }
    } catch (error) {
        message.style.color = "red";
        message.innerText = "Unable to connect to server.";
        console.error(error);
    }
}
