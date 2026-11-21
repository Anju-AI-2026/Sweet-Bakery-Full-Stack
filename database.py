
import sqlite3
from flask import current_app, g

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")

    return g.db

def close_db(error=None):
    db = g.pop("db", None)

    if db is not None:
        db.close()

def migrate_db():
    db = get_db()

    # Add product_code to older databases if missing.
    product_columns = db.execute(
        "PRAGMA table_info(products)"
    ).fetchall()

    product_column_names = [
        column["name"] for column in product_columns
    ]

    if "product_code" not in product_column_names:
        db.execute(
            "ALTER TABLE products ADD COLUMN product_code TEXT"
        )

    db.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_products_product_code
        ON products(product_code)
    """)

    # Store the delivery charge with each order.
    order_columns = db.execute(
        "PRAGMA table_info(orders)"
    ).fetchall()

    order_column_names = [
        column["name"] for column in order_columns
    ]

    if "delivery_charge" not in order_column_names:
        db.execute("""
            ALTER TABLE orders
            ADD COLUMN delivery_charge REAL NOT NULL DEFAULT 0
        """)

    db.commit()

def seed_products():
    db = get_db()

    products = [
        ("cake1", "Chocolate Cake", "Rich chocolate cake with a soft, creamy and delicious finish.", 550, "images/cakes/cake1.jpeg", "Cakes"),
        ("cake2", "Strawberry Cake", "Soft cake layered with creamy strawberry goodness.", 600, "images/cakes/cake2.jpeg", "Cakes"),
        ("cake3", "Black Forest Cake", "Chocolate cake with cream, chocolate and delicious cherries.", 650, "images/cakes/cake3.jpeg", "Cakes"),
        ("cake4", "Vanilla Cake", "Light vanilla cake with smooth and creamy frosting.", 500, "images/cakes/cake4.jpeg", "Cakes"),

        ("pastry1", "Chocolate Pastry", "Soft chocolate pastry with delicious creamy layers.", 120, "images/pastries/pastry1.jpeg", "Pastries"),
        ("pastry2", "Cream Pastry", "Soft pastry filled with smooth and creamy layers.", 110, "images/pastries/pastry2.jpeg", "Pastries"),
        ("pastry3", "Strawberry Pastry", "Creamy pastry topped with sweet and fresh strawberries.", 130, "images/pastries/pastry3.jpeg", "Pastries"),
        ("pastry4", "Butter Croissant", "Flaky, buttery and freshly baked for a perfect little treat.", 100, "images/pastries/pastry4.jpeg", "Pastries"),

        ("cookie1", "Chocolate Chip Cookie", "Buttery cookie packed with delicious chocolate chips.", 80, "images/cookies/cookie1.jpeg", "Cookies"),
        ("cookie2", "Butter Cookie", "Crisp, buttery and delicately sweet cookies for every craving.", 70, "images/cookies/cookie2.jpeg", "Cookies"),
        ("cookie3", "Oatmeal Cookie", "Soft and wholesome oatmeal cookie with a warm homemade taste.", 90, "images/cookies/cookie3.jpeg", "Cookies"),
        ("cookie4", "Red Velvet Cookie", "Soft red velvet cookie with a deliciously rich chocolate taste.", 100, "images/cookies/cookie4.jpeg", "Cookies"),

        ("muffin1", "Vanilla Cupcake", "Soft vanilla cupcake topped with smooth and creamy frosting.", 90, "images/desserts/muffin1.jpeg", "Sweet Treats"),
        ("muffin2", "Chocolate Cupcake", "Moist chocolate cupcake with rich chocolate frosting.", 100, "images/desserts/muffin2.jpeg", "Sweet Treats"),
        ("dessert1", "Strawberry Cheesecake", "Creamy cheesecake topped with sweet strawberry goodness.", 150, "images/desserts/muffin3.jpeg", "Sweet Treats"),
        ("dessert2", "Chocolate Brownie", "Rich, fudgy chocolate brownie with a deliciously soft centre.", 120, "images/desserts/muffin4.jpeg", "Sweet Treats")
    ]

    db.executemany("""
        INSERT OR IGNORE INTO products
        (product_code, name, description, price, image, category)
        VALUES (?, ?, ?, ?, ?, ?)
    """, products)

    db.commit()

def init_db():
    db = get_db()

    with current_app.open_resource("schema.sql") as file:
        db.executescript(file.read().decode("utf8"))

    migrate_db()
    seed_products()

def init_app(app):
    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()