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

    columns = db.execute("PRAGMA table_info(products)").fetchall()
    column_names = [column["name"] for column in columns]

    if "product_code" not in column_names:
        db.execute("ALTER TABLE products ADD COLUMN product_code TEXT")

    db.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_products_product_code
        ON products(product_code)
    """)

    db.commit()


def init_db():
    db = get_db()

    with current_app.open_resource("schema.sql") as file:
        db.executescript(file.read().decode("utf8"))

    migrate_db()


def init_app(app):
    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()