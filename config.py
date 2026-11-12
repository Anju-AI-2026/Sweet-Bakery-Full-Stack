import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "sweet-bakery-development-key"

    DATABASE = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "instance",
        "sweet_bakery.db"
    )