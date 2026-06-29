async function signup() {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    const message = document.getElementById("message");
    const button = document.querySelector(".primary-action");

    message.style.color = "red";

    // Validation

    if (name === "" || email === "" || password === "" || confirmPassword === "") {
        message.innerText = "Please fill all fields.";
        return;
    }

    if (password !== confirmPassword) {
        message.innerText = "Passwords do not match.";
        return;
    }

    if (!terms) {
        message.innerText = "Please accept the Terms & Conditions.";
        return;
    }

    button.disabled = true;
    button.innerText = "Creating Account...";

    try {

        const response = await fetch("http://localhost:8080/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })

        });

        const data = await response.json();

        if (response.ok) {

            message.style.color = "lime";

            message.innerText =
                "✅ Account created successfully! Redirecting to Login...";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } else {

            message.style.color = "#ff8080";

            if (data.message) {
                message.innerText = data.message;
            } else {
                message.innerText = "Signup failed. Please try again.";
            }

        }

    } catch (error) {

        message.style.color = "#ff8080";

        message.innerText =
            "Unable to connect to the server.";

    }

    button.disabled = false;
    button.innerText = "Create Account";
}
