const token = localStorage.getItem("token");
let currentUser = null;

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("userForm").addEventListener("submit", saveUser);
document.getElementById("dashboardNavLink").addEventListener("click", handleDashboardNav);
document.getElementById("usersNavLink").addEventListener("click", handleUsersNav);
document.getElementById("accountNavLink").addEventListener("click", handleAccountNav);

loadDashboard();

async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
            ...(options.headers || {})
        }
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized");
    }

    return response;
}

async function loadDashboard() {
    try {
        const response = await apiFetch("http://localhost:8080/dashboard");

        if (!response.ok) {
            throw new Error("Unable to load dashboard");
        }

        const data = await response.json();
        currentUser = data;

        document.getElementById("welcome").innerText = "Welcome, " + data.name;
        document.getElementById("name").innerText = data.name;
        document.getElementById("email").innerText = data.email;
        document.getElementById("role").innerText = data.role;
        document.getElementById("message").innerText = data.message;

        if (data.role === "ADMIN") {
            document.getElementById("usersNavLink").href = "#adminPanel";
            document.getElementById("adminPanel").classList.remove("hidden");
            setRole("USER");
            loadUsers();
        } else {
            document.getElementById("usersNavLink").href = "#";
            document.getElementById("adminPanel").classList.add("hidden");
        }
    } catch (error) {
        console.log(error);
        clearSession();
        window.location.href = "login.html";
    }
}

async function loadUsers() {
    const adminMessage = document.getElementById("adminMessage");
    const usersTable = document.getElementById("usersTable");

    try {
        const response = await apiFetch("http://localhost:8080/admin/users");

        if (!response.ok) {
            throw new Error("Unable to load users");
        }

        const users = await response.json();
        usersTable.innerHTML = "";

        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="role-pill">${escapeHtml(user.role)}</span></td>
                <td class="actions"></td>
            `;

            const actions = row.querySelector(".actions");
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "icon-action-btn role-action-btn";
            editButton.innerText = "✎";
            editButton.title = "Change role";
            editButton.setAttribute("aria-label", "Change role");
            editButton.addEventListener("click", () => editUser(user));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "icon-action-btn remove-action-btn";
            deleteButton.innerText = "🗑";
            deleteButton.title = "Remove access";
            deleteButton.setAttribute("aria-label", "Remove access");
            deleteButton.addEventListener("click", () => deleteUser(user.id));

            actions.append(editButton, deleteButton);
            usersTable.appendChild(row);
        });

        adminMessage.innerText = "";
    } catch (error) {
        adminMessage.innerText = error.message;
    }
}

async function saveUser(event) {
    event.preventDefault();

    const id = document.getElementById("userId").value;
    const password = document.getElementById("userPassword").value;
    const adminMessage = document.getElementById("adminMessage");
    const isEditing = Boolean(id);

    const payload = {
        name: document.getElementById("userName").value.trim(),
        role: document.getElementById("userRole").value
    };

    if (!isEditing) {
        payload.email = document.getElementById("userEmail").value.trim();
    }

    if (!isEditing && password) {
        payload.password = password;
    }

    if (!isEditing && !password) {
        adminMessage.innerText = "Password is required for a new user.";
        return;
    }

    try {
        const response = await apiFetch(
            id ? "http://localhost:8080/admin/users/" + id : "http://localhost:8080/admin/users",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            }
        );

        const data = response.status === 204 ? null : await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to save user");
        }

        adminMessage.innerText = id ? "User updated successfully." : "User created successfully.";
        showToast(adminMessage.innerText);
        resetForm();
        loadUsers();
    } catch (error) {
        adminMessage.innerText = error.message;
    }
}

function editUser(user) {
    document.getElementById("userId").value = user.id;
    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userName").disabled = false;
    document.getElementById("userEmail").disabled = true;
    document.getElementById("userPassword").disabled = true;
    document.getElementById("userPassword").value = "";
    document.getElementById("userPassword").required = false;
    document.getElementById("userNameField").classList.remove("hidden");
    document.getElementById("userEmailField").classList.remove("hidden");
    document.getElementById("userPasswordField").classList.add("hidden");
    setRole(user.role);
    setRoleLocked(currentUser && currentUser.id === user.id);
    document.getElementById("userForm").classList.add("role-editing");
    document.getElementById("saveUserButton").innerText = "Save changes";
    document.getElementById("cancelEditButton").classList.remove("hidden");
    document.getElementById("adminMessage").innerText = currentUser && currentUser.id === user.id
        ? "Editing your profile. Your own admin role is locked."
        : "Editing " + user.name + ". Password cannot be changed here.";
    document.getElementById("userForm").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function deleteUser(id) {
    if (currentUser && currentUser.id === id) {
        document.getElementById("adminMessage").innerText = "You cannot delete your own logged-in account.";
        return;
    }

    if (!confirm("Remove this user's access?")) {
        return;
    }

    try {
        const response = await apiFetch("http://localhost:8080/admin/users/" + id, {
            method: "DELETE"
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Unable to delete user");
        }

        document.getElementById("adminMessage").innerText = "User access removed.";
        showToast("User access removed.");
        loadUsers();
    } catch (error) {
        document.getElementById("adminMessage").innerText = error.message;
    }
}

function resetForm() {
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("userName").disabled = false;
    document.getElementById("userEmail").disabled = false;
    document.getElementById("userPassword").disabled = false;
    setRoleLocked(false);
    setRole("USER");
    document.getElementById("userPassword").placeholder = "Password";
    document.getElementById("userPassword").required = false;
    document.getElementById("userNameField").classList.remove("hidden");
    document.getElementById("userEmailField").classList.remove("hidden");
    document.getElementById("userPasswordField").classList.remove("hidden");
    document.getElementById("userForm").classList.remove("role-editing");
    document.getElementById("saveUserButton").innerText = "Add user";
    document.getElementById("cancelEditButton").classList.add("hidden");
    document.getElementById("adminMessage").innerText = "";
}

function setRole(role) {
    document.getElementById("userRole").value = role;
    document.querySelectorAll(".role-option").forEach(button => {
        button.classList.toggle("active", button.dataset.role === role);
    });
}

function setRoleLocked(locked) {
    document.querySelectorAll(".role-option").forEach(button => {
        button.disabled = locked;
    });
}

function handleDashboardNav(event) {
    event.preventDefault();
    setActiveNav(event.currentTarget);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleUsersNav(event) {
    event.preventDefault();
    setActiveNav(event.currentTarget);

    if (!currentUser || currentUser.role !== "ADMIN") {
        showToast("Administrator access required. You do not have permission to access Users.");
        return;
    }

    document.getElementById("adminPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleAccountNav(event) {
    event.preventDefault();
    setActiveNav(event.currentTarget);
    document.getElementById("accountPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("accountPanel").classList.add("highlight-panel");
    showToast("Account details are shown.");

    setTimeout(() => {
        document.getElementById("accountPanel").classList.remove("highlight-panel");
    }, 1400);
}

function setActiveNav(activeLink) {
    document.querySelectorAll(".nav-list a").forEach(link => link.classList.remove("active"));
    activeLink.classList.add("active");
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.remove("hidden");

    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
        toast.classList.add("hidden");
    }, 3200);
}

function logout() {
    clearSession();
    window.location.href = "login.html";
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.innerText = value == null ? "" : value;
    return div.innerHTML;
}
