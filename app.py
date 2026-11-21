
import os
import smtplib
from email.message import EmailMessage

from flask import (
    Flask, render_template, request,
    redirect, url_for, session, jsonify
)
from werkzeug.security import (
    generate_password_hash, check_password_hash
)

from config import Config
import database

app = Flask(__name__)
app.config.from_object(Config)

database.init_app(app)

DELIVERY_CHARGE = 55

# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def api_error(message, status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status

def get_logged_in_user():
    return session.get("user_id")

def send_order_confirmation(user_email, user_name, order_id,
                            items, subtotal, delivery, total):
    username = os.getenv("MAIL_USERNAME")
    app_password = os.getenv("MAIL_APP_PASSWORD")

    if not username or not app_password:
        app.logger.warning(
            "Email not sent: Gmail environment variables are missing."
        )
        return False

    message = EmailMessage()
    message["Subject"] = f"Sweet Bakery - Order #{order_id} Confirmed"
    message["From"] = os.getenv("MAIL_FROM", username)
    message["To"] = user_email

    item_details = "\n".join(
        f"{item['name']} x {item['quantity']} - "
        f"₹{item['price'] * item['quantity']:.2f}"
        for item in items
    )

    message.set_content(f"""
Hello {user_name},

Thank you for ordering from Sweet Bakery!

Your order has been placed successfully.

Order ID: {order_id}

ORDER DETAILS
{item_details}

Subtotal: ₹{subtotal:.2f}
Delivery Charge: ₹{delivery:.2f}
Total Amount: ₹{total:.2f}

Order Status: Placed

Thank you for choosing Sweet Bakery.
We hope you enjoy every bite!

With love,
Sweet Bakery
""")

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
            server.starttls()
            server.login(username, app_password)
            server.send_message(message)

        return True

    except Exception:
        app.logger.exception("Order confirmation email could not be sent.")
        return False

# --------------------------------------------------
# PAGE ROUTES
# --------------------------------------------------

@app.route("/")
def home():
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("index.html")

@app.route("/menu")
def menu():
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("menu.html")

@app.route("/about")
def about():
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("about.html")

@app.route("/contact")
def contact():
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("contact.html")

@app.route("/login")
def login_page():
    if "user_id" in session:
        return redirect(url_for("home"))

    return render_template("login.html")

@app.route("/cart")
def cart():
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("my-cart.html")

# --------------------------------------------------
# SIGNUP API
# --------------------------------------------------

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return api_error("Please fill in all fields.")

    if len(name) < 2:
        return api_error("Name must contain at least 2 characters.")

    if len(password) < 8:
        return api_error("Password must contain at least 8 characters.")

    db = database.get_db()

    existing_user = db.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing_user:
        return api_error("An account with this email already exists.")

    password_hash = generate_password_hash(password)

    try:
        cursor = db.execute("""
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
        """, (name, email, password_hash))

        db.commit()

        session["user_id"] = cursor.lastrowid
        session["user_name"] = name
        session["user_email"] = email

        return jsonify({
            "success": True,
            "message": "Account created successfully."
        })

    except Exception:
        db.rollback()
        app.logger.exception("Signup failed.")
        return api_error("Unable to create your account.", 500)

# --------------------------------------------------
# LOGIN API
# --------------------------------------------------

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return api_error("Please enter your email and password.")

    db = database.get_db()

    user = db.execute("""
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = ?
    """, (email,)).fetchone()

    if not user or not check_password_hash(
        user["password_hash"], password
    ):
        return api_error("Invalid email or password.", 401)

    session.clear()
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_email"] = user["email"]

    return jsonify({
        "success": True,
        "message": "Login successful."
    })

# --------------------------------------------------
# CART API
# --------------------------------------------------

@app.route("/api/cart", methods=["GET"])
def get_cart():
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in to view your cart.", 401)

    db = database.get_db()

    cart_items = db.execute("""
        SELECT
            p.product_code,
            p.name,
            p.price,
            p.image,
            p.category,
            c.quantity,
            (p.price * c.quantity) AS item_total
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.id
    """, (user_id,)).fetchall()

    items = [dict(item) for item in cart_items]

    subtotal = sum(item["item_total"] for item in items)
    delivery = DELIVERY_CHARGE if items else 0
    total = subtotal + delivery

    return jsonify({
        "success": True,
        "items": items,
        "subtotal": subtotal,
        "delivery": delivery,
        "total": total
    })

@app.route("/api/cart", methods=["POST"])
def add_to_cart():
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in first.", 401)

    data = request.get_json(silent=True) or {}
    product_code = data.get("product_code") or data.get("id")

    if not product_code:
        return api_error("Product code is required.")

    db = database.get_db()

    product = db.execute("""
        SELECT id FROM products
        WHERE product_code = ? AND is_available = 1
    """, (product_code,)).fetchone()

    if not product:
        return api_error("Product not found.", 404)

    try:
        db.execute("""
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, 1)
            ON CONFLICT(user_id, product_id)
            DO UPDATE SET quantity = quantity + 1
        """, (user_id, product["id"]))

        db.commit()

        return jsonify({
            "success": True,
            "message": "Product added to cart."
        })

    except Exception:
        db.rollback()
        app.logger.exception("Adding product to cart failed.")
        return api_error("Unable to add product to cart.", 500)

@app.route("/api/cart/<product_code>", methods=["PATCH"])
def update_cart(product_code):
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in first.", 401)

    data = request.get_json(silent=True) or {}
    quantity = data.get("quantity")

    if not isinstance(quantity, int) or isinstance(quantity, bool):
        return api_error("Quantity must be a whole number.")

    if quantity < 1:
        return api_error("Quantity must be at least 1.")

    db = database.get_db()

    result = db.execute("""
        UPDATE cart_items
        SET quantity = ?
        WHERE user_id = ?
        AND product_id = (
            SELECT id FROM products WHERE product_code = ?
        )
    """, (quantity, user_id, product_code))

    db.commit()

    if result.rowcount == 0:
        return api_error("Cart item not found.", 404)

    return jsonify({
        "success": True,
        "message": "Cart quantity updated."
    })

@app.route("/api/cart/<product_code>", methods=["DELETE"])
def remove_from_cart(product_code):
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in first.", 401)

    db = database.get_db()

    result = db.execute("""
        DELETE FROM cart_items
        WHERE user_id = ?
        AND product_id = (
            SELECT id FROM products WHERE product_code = ?
        )
    """, (user_id, product_code))

    db.commit()

    if result.rowcount == 0:
        return api_error("Cart item not found.", 404)

    return jsonify({
        "success": True,
        "message": "Product removed from cart."
    })

# --------------------------------------------------
# PLACE ORDER API
# --------------------------------------------------

@app.route("/api/orders", methods=["POST"])
def place_order():
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in to place an order.", 401)

    db = database.get_db()

    user = db.execute("""
        SELECT name, email FROM users WHERE id = ?
    """, (user_id,)).fetchone()

    cart_items = db.execute("""
        SELECT
            p.id AS product_id,
            p.name,
            p.price,
            c.quantity
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    """, (user_id,)).fetchall()

    if not cart_items:
        return api_error("Your cart is empty.")

    subtotal = sum(
        item["price"] * item["quantity"]
        for item in cart_items
    )

    delivery = DELIVERY_CHARGE
    total = subtotal + delivery

    try:
        db.execute("BEGIN")

        order_cursor = db.execute("""
            INSERT INTO orders
            (user_id, total_amount, delivery_charge, status)
            VALUES (?, ?, ?, 'Placed')
        """, (user_id, total, delivery))

        order_id = order_cursor.lastrowid

        for item in cart_items:
            db.execute("""
                INSERT INTO order_items
                (order_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)
            """, (
                order_id,
                item["product_id"],
                item["quantity"],
                item["price"]
            ))

        db.execute(
            "DELETE FROM cart_items WHERE user_id = ?",
            (user_id,)
        )

        db.commit()

    except Exception:
        db.rollback()
        app.logger.exception("Order placement failed.")
        return api_error("Unable to place your order. Please try again.", 500)

    email_items = [
        {
            "name": item["name"],
            "price": item["price"],
            "quantity": item["quantity"]
        }
        for item in cart_items
    ]

    email_sent = send_order_confirmation(
        user["email"],
        user["name"],
        order_id,
        email_items,
        subtotal,
        delivery,
        total
    )

    return jsonify({
        "success": True,
        "message": "Your order has been placed successfully!",
        "order_id": order_id,
        "subtotal": subtotal,
        "delivery": delivery,
        "total": total,
        "email_sent": email_sent,
        "email_message": (
            "Confirmation email sent."
            if email_sent
            else "Order saved, but confirmation email could not be sent."
        )
    })

# --------------------------------------------------
# ORDER HISTORY API
# --------------------------------------------------

@app.route("/api/orders", methods=["GET"])
def get_orders():
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in to view your orders.", 401)

    db = database.get_db()

    orders = db.execute("""
        SELECT
            id,
            total_amount,
            delivery_charge,
            status,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
    """, (user_id,)).fetchall()

    result = []

    for order in orders:
        items = db.execute("""
            SELECT
                p.name,
                p.image,
                oi.quantity,
                oi.price,
                (oi.quantity * oi.price) AS item_total
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        """, (order["id"],)).fetchall()

        order_data = dict(order)
        order_data["items"] = [dict(item) for item in items]
        order_data["subtotal"] = (
            order["total_amount"] - order["delivery_charge"]
        )

        result.append(order_data)

    return jsonify({
        "success": True,
        "orders": result
    })

# --------------------------------------------------
# CONTACT MESSAGE API
# --------------------------------------------------

@app.route("/api/contact-messages", methods=["POST"])
def save_contact_message():
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in to send a message.", 401)

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return api_error("Please fill in all contact form fields.")

    db = database.get_db()

    try:
        db.execute("""
            INSERT INTO contact_messages
            (user_id, name, email, message)
            VALUES (?, ?, ?, ?)
        """, (user_id, name, email, message))

        db.commit()

        return jsonify({
            "success": True,
            "message": "Your message has been sent successfully!"
        })

    except Exception:
        db.rollback()
        app.logger.exception("Saving contact message failed.")
        return api_error("Unable to save your message.", 500)

@app.route("/api/contact-messages", methods=["GET"])
def get_contact_messages():
    user_id = get_logged_in_user()

    if not user_id:
        return api_error("Please log in first.", 401)

    db = database.get_db()

    messages = db.execute("""
        SELECT id, name, email, message, created_at
        FROM contact_messages
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
    """, (user_id,)).fetchall()

    return jsonify({
        "success": True,
        "messages": [dict(message) for message in messages]
    })

# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)