
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");

const ACCOUNT_KEY = "sweetBakeryAccounts";
const SESSION_KEY = "sweetBakeryLoggedIn";

function getAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) || {};
    } catch {
        return {};
    }
}

// Demo-only password hash. Not suitable for real authentication.
async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Switch to Sign Up.
document.getElementById("showSignup").addEventListener("click", function () {
    loginForm.hidden = true;
    signupForm.hidden = false;

    authTitle.textContent = "Create Your Account";
    authSubtitle.textContent = "Join our little bakery family.";
    authMessage.textContent = "";
});

// Switch to Login.
document.getElementById("showLogin").addEventListener("click", function () {
    signupForm.hidden = true;
    loginForm.hidden = false;

    authTitle.textContent = "Welcome Back!";
    authSubtitle.textContent = "Log in to your Sweet Bakery account.";
    authMessage.textContent = "";
});

// Sign Up.
signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (name.length < 2) {
        authMessage.textContent = "Please enter your name.";
        return;
    }

    if (password.length < 8) {
        authMessage.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        authMessage.textContent = "Your passwords do not match.";
        return;
    }

    const accounts = getAccounts();

    if (accounts[email]) {
        authMessage.textContent = "This email is already registered. Please log in.";
        return;
    }

    const passwordHash = await hashPassword(password);

    accounts[email] = {
        name: name,
        passwordHash: passwordHash
    };

    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
    sessionStorage.setItem(SESSION_KEY, "true");
    localStorage.setItem("sweetBakeryUserName", name);
    localStorage.setItem("sweetBakeryUserEmail", email);

    authMessage.textContent = "Account created! Welcome to Sweet Bakery.";

    signupForm.reset();

    setTimeout(function () {
        window.location.replace("index.html");
    }, 700);
});

// Login.
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const accounts = getAccounts();
    const account = accounts[email];

    if (!account) {
        authMessage.textContent = "No account found with this email. Please sign up first.";
        return;
    }

    const passwordHash = await hashPassword(password);

    if (passwordHash !== account.passwordHash) {
        authMessage.textContent = "Incorrect password. Please try again.";
        return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    localStorage.setItem("sweetBakeryUserName", account.name);
    localStorage.setItem("sweetBakeryUserEmail", email);

    authMessage.textContent = "Login successful! Welcome back.";

    loginForm.reset();

    setTimeout(function () {
        window.location.replace("index.html");
    }, 700);
});
