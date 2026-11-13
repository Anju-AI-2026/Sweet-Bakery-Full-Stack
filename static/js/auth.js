const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");


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

    try {
        const response = await fetch("/api/signup", {
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

        const result = await response.json();

        authMessage.textContent = result.message;

        if (!response.ok) {
            return;
        }

        signupForm.reset();

        setTimeout(function () {
            window.location.replace("/");
        }, 700);

    } catch (error) {
        authMessage.textContent = "Something went wrong. Please try again.";
    }
});


// Login.
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        authMessage.textContent = result.message;

        if (!response.ok) {
            return;
        }

        loginForm.reset();

        setTimeout(function () {
            window.location.replace("/");
        }, 700);

    } catch (error) {
        authMessage.textContent = "Something went wrong. Please try again.";
    }
});