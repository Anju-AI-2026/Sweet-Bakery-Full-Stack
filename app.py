
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


# Cart Page
@app.route("/cart")
def cart():
    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("my-cart.html")


# Get Cart API
@app.route("/api/cart", methods=["GET"])
def get_cart():
    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = database.get_db()

    items = db.execute("""
        SELECT
            products.product_code,
            products.name,
            products.price,
            products.image,
            cart_items.quantity,
            products.price * cart_items.quantity AS item_total
        FROM cart_items
        JOIN products ON cart_items.product_id = products.id
        WHERE cart_items.user_id = ?
        ORDER BY cart_items.id
    """, (session["user_id"],)).fetchall()

    cart_items = [dict(item) for item in items]
    subtotal = sum(item["item_total"] for item in cart_items)

    return jsonify({
        "success": True,
        "items": cart_items,
        "subtotal": subtotal,
        "delivery": 0,
        "total": subtotal
    })


# Add to Cart API
@app.route("/api/cart", methods=["POST"])
def add_to_cart():
    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    data = request.get_json(silent=True) or {}
    product_code = data.get("product_code", "")

    if not isinstance(product_code, str) or not product_code.strip():
        return jsonify({
            "success": False,
            "message": "Product code is required."
        }), 400

    product_code = product_code.strip()

    db = database.get_db()

    product = db.execute("""
        SELECT id FROM products
        WHERE product_code = ? AND is_available = 1
    """, (product_code,)).fetchone()

    if product is None:
        return jsonify({
            "success": False,
            "message": "Product not found or unavailable."
        }), 404

    db.execute("""
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, product_id)
        DO UPDATE SET quantity = quantity + 1
    """, (session["user_id"], product["id"]))

    db.commit()

    return jsonify({
        "success": True,
        "message": "Product added to cart."
    })


# Update Cart Quantity API
@app.route("/api/cart/<product_code>", methods=["PATCH"])
def update_cart_quantity(product_code):
    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    data = request.get_json(silent=True) or {}
    quantity = data.get("quantity")

    if type(quantity) is not int or quantity < 1:
        return jsonify({
            "success": False,
            "message": "Quantity must be a positive whole number."
        }), 400

    db = database.get_db()

    result = db.execute("""
        UPDATE cart_items
        SET quantity = ?
        WHERE user_id = ?
        AND product_id = (
            SELECT id FROM products WHERE product_code = ?
        )
    """, (quantity, session["user_id"], product_code))

    if result.rowcount == 0:
        return jsonify({
            "success": False,
            "message": "Product not found in your cart."
        }), 404

    db.commit()

    return jsonify({
        "success": True,
        "message": "Cart quantity updated."
    })


# Remove Cart Item API
@app.route("/api/cart/<product_code>", methods=["DELETE"])
def remove_from_cart(product_code):
    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = database.get_db()

    result = db.execute("""
        DELETE FROM cart_items
        WHERE user_id = ?
        AND product_id = (
            SELECT id FROM products WHERE product_code = ?
        )
    """, (session["user_id"], product_code))

    if result.rowcount == 0:
        return jsonify({
            "success": False,
            "message": "Product not found in your cart."
        }), 404

    db.commit()

    return jsonify({
        "success": True,
        "message": "Product removed from cart."
    })


# Logout
@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)
