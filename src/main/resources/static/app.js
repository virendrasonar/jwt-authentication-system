let isLogin = true;

// DOM elements
const formTitle = document.getElementById("formTitle");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passError = document.getElementById("passError");
const msg = document.getElementById("msg");

const actionBtn = document.getElementById("actionBtn");
const toggleText = document.getElementById("toggleText");
const protectedBtn = document.getElementById("protectedBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Event listeners (cleaner than onclick)
actionBtn.addEventListener("click", handleAction);
toggleText.addEventListener("click", toggleForm);
protectedBtn.addEventListener("click", callProtectedAPI);
logoutBtn.addEventListener("click", logout);

// Toggle form
function toggleForm() {
    isLogin = !isLogin;

    formTitle.innerText = isLogin ? "Login" : "Signup";
    actionBtn.innerText = isLogin ? "Login" : "Signup";
    nameInput.style.display = isLogin ? "none" : "block";

    msg.innerText = "";
}

// Main handler
function handleAction() {
    if (isLogin) login();
    else signup();
}

// Signup
function signup() {

    let name = nameInput.value;
    let email = emailInput.value;
    let password = passwordInput.value;

    clearErrors();

    if (!name) return nameError.innerText = "Name is required";
    if (!email || !email.includes("@")) return emailError.innerText = "Enter valid email";
    if (!password || password.length < 8) return passError.innerText = "Min 8 characters";

    fetch("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, email, password })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        msg.style.color = "green";
        msg.innerText = "Signup successful. Please login";
        toggleForm();
    })
    .catch(err => showError(err.message));
}

// Login
function login() {

    let email = emailInput.value;
    let password = passwordInput.value;

    clearErrors();

    if (!email || !email.includes("@")) return emailError.innerText = "Enter valid email";
    if (!password || password.length < 8) return passError.innerText = "Min 8 characters";

    fetch("/api/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        localStorage.setItem("token", data.token);

        msg.style.color = "green";
        msg.innerText = "Login successful";
    })
    .catch(err => showError(err.message));
}

// Protected API
function callProtectedAPI() {

    const token = localStorage.getItem("token");

    if (!token) return showError("Login first");

    fetch("/api/test", {
        headers: { Authorization: "Bearer " + token }
    })
    .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.text();
    })
    .then(data => {
        msg.style.color = "green";
        msg.innerText = data;
    })
    .catch(err => showError(err.message));
}

// Logout
function logout() {
    localStorage.removeItem("token");
    msg.innerText = "Logged out";
}

// Helpers
function clearErrors() {
    nameError.innerText = "";
    emailError.innerText = "";
    passError.innerText = "";
    msg.innerText = "";
}

function showError(message) {
    msg.style.color = "red";
    msg.innerText = message;
}