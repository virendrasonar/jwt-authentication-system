function toggleResetPassword(id, button) {
    const input = document.getElementById(id);
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.innerText = isPassword ? "Hide" : "Show";
}

async function resetPassword() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("message");

    message.style.color = "red";

    if (!token) {
        message.innerText = "Reset token is missing. Please request a new reset link.";
        return;
    }

    if (!password || !confirmPassword) {
        message.innerText = "Please fill both password fields.";
        return;
    }

    if (password !== confirmPassword) {
        message.innerText = "Passwords do not match.";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token,
                password
            })
        });

        const text = await response.text();

        if (!response.ok) {
            try {
                const data = JSON.parse(text);
                message.innerText = data.message || "Unable to reset password.";
            } catch (error) {
                message.innerText = text || "Unable to reset password.";
            }
            return;
        }

        message.style.color = "green";
        message.innerText = text || "Password reset successfully.";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    } catch (error) {
        message.innerText = "Unable to connect to server.";
        console.error(error);
    }
}
