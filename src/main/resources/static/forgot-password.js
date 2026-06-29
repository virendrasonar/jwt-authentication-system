async function requestPasswordReset() {
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message");
    const resetLinkBox = document.getElementById("resetLinkBox");
    const resetLink = document.getElementById("resetLink");

    resetLinkBox.classList.add("hidden");
    message.style.color = "red";

    if (!email) {
        message.innerText = "Please enter your email address.";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/auth/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            message.innerText = data.message || "Unable to generate reset link.";
            return;
        }

        const fullResetUrl = window.location.origin + data.resetUrl;
        message.style.color = "green";
        message.innerText = data.message;
        resetLink.href = fullResetUrl;
        resetLink.innerText = fullResetUrl;
        resetLinkBox.classList.remove("hidden");
    } catch (error) {
        message.innerText = "Unable to connect to server.";
        console.error(error);
    }
}
