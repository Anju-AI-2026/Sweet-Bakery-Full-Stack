from flask import (
    Flask, render_template, request,
    redirect, url_for, session, jsonify
)
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
import database


app = Flask(__name__)
app.config.from_object(Config)

database.init_app(app)


# Home
@app.route("/")
def home():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("index.html")


# Menu
@app.route("/menu")
def menu():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("menu.html")


# About
@app.route("/about")
def about():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("about.html")


# Contact
@app.route("/contact")
def contact():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("contact.html")


# Login page
@app.route("/login")
def login():
    if "user_id" in session:
        return redirect(url_for("home"))

    return render_template("login.html")


# Sign Up API
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "Invalid request."}), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if len(name) < 2:
        return jsonify({"success": False, "message": "Please enter your name."}), 400

    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters."}), 400

    db = database.get_db()

    existing_user = db.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing_user:
        return jsonify({
            "success": False,
            "message": "This email is already registered. Please log in."
        }), 409

    password_hash = generate_password_hash(password)

    cursor = db.execute(
        """
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
        """,
        (name, email, password_hash)
    )

    db.commit()

    session.clear()
    session["user_id"] = cursor.lastrowid
    session["user_name"] = name

    return jsonify({
        "success": True,
        "message": "Account created! Welcome to Sweet Bakery."
    })


# Login API
@app.route("/api/login", methods=["POST"])
def login_user():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "Invalid request."}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    db = database.get_db()

    user = db.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({
            "success": False,
            "message": "Incorrect email or password. Please try again."
        }), 401

    session.clear()
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return jsonify({
        "success": True,
        "message": "Login successful! Welcome back."
    })


# Cart
@app.route("/cart")
def cart():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("my-cart.html")


# Logout
@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)