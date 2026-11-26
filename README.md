# 🧁 Sweet Bakery — Full Stack Web Application

A bakery-themed full-stack web application developed using **Python, Flask, SQLite, HTML, CSS, and JavaScript**.

Sweet Bakery allows users to create accounts, explore bakery products, manage shopping carts, place orders, view order history, and send contact messages.

## ✨ Features

### 🔐 User Authentication
- User registration and login.
- Secure password hashing.
- Flask session-based authentication.
- Protected application pages.

### 🍰 Product Menu
- 16 bakery products across four categories.
- Product information and prices stored in SQLite.
- Browse products and add them to the shopping cart.

### 🛒 Shopping Cart
- Add products to the cart.
- Increase or decrease product quantities.
- Remove products.
- Automatic subtotal and total calculation.
- Separate cart data for each user.

### 📦 Order Management
- Place orders using cart contents.
- Store order details in SQLite.
- Preserve product prices in order records.
- View personal order history.

### 💌 Contact Messages
- Submit contact messages through the website.
- Store messages in SQLite.
- View messages associated with the logged-in account.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Website styling |
| JavaScript | Frontend interactions |
| Python | Backend programming |
| Flask | Web framework |
| SQLite | Database management |
| Werkzeug | Password hashing |

---

## 📸 Screenshots

The project includes screenshots of the homepage, product menu, authentication pages, shopping cart, order process, and contact pages.

**View the complete screenshot gallery:** [Output Screenshots](output_images/README.md)

---

## 📂 Project Structure

```text
Sweet-Bakery-Full-Stack/
│
├── app.py
├── config.py
├── database.py
├── schema.sql
├── requirements.txt
├── README.md
├── .gitignore
│
├── instance/
│   └── sweet_bakery.db
│
├── output_images/
│   └── README.md
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── auth.js
│   │   └── script.js
│   │
│   └── images/
│       ├── banners/
│       ├── cakes/
│       ├── cookies/
│       ├── desserts/
│       └── pastries/
│
└── templates/
    ├── about.html
    ├── contact.html
    ├── index.html
    ├── login.html
    ├── menu.html
    ├── my-cart.html
    └── reset-login.html
```

*The SQLite database is created locally when the application initializes.*

---

## 🚀 Installation and Setup

### 1. Clone the repository

```powershell
git clone https://github.com/Anju-AI-2026/Sweet-Bakery-Full-Stack.git
```

### 2. Open the project folder

```powershell
cd Sweet-Bakery-Full-Stack
```

### 3. Create a virtual environment

```powershell
python -m venv .venv
```

### 4. Activate the virtual environment

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

### 5. Install dependencies

```powershell
pip install -r requirements.txt
```

### 6. Run the application

```powershell
python app.py
```

Open your browser and visit:

```text
http://127.0.0.1:5000
```

---

## 🗄️ Database Design

The application uses SQLite with the following main tables:

- `users` — Registered user accounts.
- `products` — Bakery product information.
- `cart_items` — User-specific shopping cart items.
- `orders` — Placed orders.
- `order_items` — Individual products belonging to orders.
- `contact_messages` — User contact messages.

---

## 🎯 Learning Outcomes

This project demonstrates practical implementation of:

- Flask application development.
- Frontend and backend integration.
- REST-style API development.
- JavaScript Fetch API.
- SQLite database operations.
- SQL relationships and foreign keys.
- User authentication and session management.
- Password hashing.
- CRUD operations.
- Database-backed shopping cart and order management.
- Git and GitHub version control.

---

## 👩‍💻 Developer

**Anjali Ramesh Sangannavar**

Computer Science and Engineering Diploma Student

GitHub: [Anju-AI-2026](https://github.com/Anju-AI-2026)

---

Copyright © 2026 Anjali Ramesh Sangannavar. All rights reserved.