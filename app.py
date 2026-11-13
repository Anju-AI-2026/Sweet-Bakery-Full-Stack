from flask import Flask, render_template
from config import Config
import database


app = Flask(__name__)
app.config.from_object(Config)

database.init_app(app)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/menu")
def menu():
    return render_template("menu.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/contact")
def contact():
    return render_template("contact.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/cart")
def cart():
    return render_template("my-cart.html")


if __name__ == "__main__":
    app.run(debug=True)