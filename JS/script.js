
 // =========================================
 // SWEET BAKERY
 // SHOPPING CART
 // =========================================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let orderHistory =
    JSON.parse(localStorage.getItem("orderHistory")) || [];


// ---------- Add Product to Cart ----------

function addToCart(name, price, image) {

    const existingProduct = cart.find(
        item => item.name === name
    );

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: Number(price),
            image: image,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(name + " added to cart!");
}


// ---------- Connect Menu Buttons ----------

const cartButtons = document.querySelectorAll(".cart-btn");

cartButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        if (!name || button.dataset.price === undefined) {
            return;
        }

        const productCard = button.closest(".menu-card");

        const imageElement = productCard
            ? productCard.querySelector("img")
            : null;

        const image = imageElement
            ? imageElement.getAttribute("src")
            : "";

        addToCart(name, price, image);

    });

});


// =========================================
// CART PRODUCT SLIDER
// =========================================

let currentProduct = 0;


// ---------- Display Cart Product ----------

function displayCart() {

    const cartItems = document.querySelector(".cart-items");

    if (!cartItems) {
        return;
    }

    if (cart.length === 0) {

        currentProduct = 0;

        cartItems.innerHTML = `
            <h2>Your Items</h2>

            <div class="empty-cart">
                <h3>Your cart is empty</h3>
                <p>Add some delicious treats from our menu!</p>
                <a href="menu.html" class="cart-btn">
                    Browse Menu
                </a>
            </div>
        `;

        calculateCartTotal();
        return;
    }

    if (currentProduct >= cart.length) {
        currentProduct = cart.length - 1;
    }

    if (currentProduct < 0) {
        currentProduct = 0;
    }

    const item = cart[currentProduct];

    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    const itemTotal = price * quantity;

    cartItems.innerHTML = `
        <h2>Your Items</h2>

        <div class="cart-item">

            ${
                item.image
                    ? `<img
                        src="${item.image}"
                        alt="${item.name}"
                        class="cart-product-image"
                    >`
                    : ""
            }

            <h3></h3>

            <p class="cart-product-price"></p>
            <p class="cart-product-quantity"></p>
            <p class="cart-product-total"></p>

            <button
                type="button"
                class="remove-cart-item"
                id="removeCartItemBtn"
            >
                Remove
            </button>

        </div>

        <div class="cart-navigation">

            <button
                type="button"
                id="previousProductBtn"
                ${cart.length <= 1 ? "disabled" : ""}
            >
                ← Previous
            </button>

            <span>
                Product ${currentProduct + 1} of ${cart.length}
            </span>

            <button
                type="button"
                id="nextProductBtn"
                ${cart.length <= 1 ? "disabled" : ""}
            >
                Next →
            </button>

        </div>
    `;

    const productCard = cartItems.querySelector(".cart-item");

    productCard.querySelector("h3").textContent = item.name;

    productCard.querySelector(".cart-product-price").textContent =
        "Price: ₹" + price.toFixed(2);

    productCard.querySelector(".cart-product-quantity").textContent =
        "Quantity: " + quantity;

    productCard.querySelector(".cart-product-total").textContent =
        "Item Total: ₹" + itemTotal.toFixed(2);

    document
        .querySelector("#removeCartItemBtn")
        .addEventListener("click", function() {
            removeCartItem(currentProduct);
        });

    document
        .querySelector("#previousProductBtn")
        .addEventListener("click", previousProduct);

    document
        .querySelector("#nextProductBtn")
        .addEventListener("click", nextProduct);

    calculateCartTotal();

}


// ---------- Next Product ----------

function nextProduct() {

    if (cart.length === 0) {
        return;
    }

    currentProduct++;

    if (currentProduct >= cart.length) {
        currentProduct = 0;
    }

    displayCart();

}


// ---------- Previous Product ----------

function previousProduct() {

    if (cart.length === 0) {
        return;
    }

    currentProduct--;

    if (currentProduct < 0) {
        currentProduct = cart.length - 1;
    }

    displayCart();

}


// ---------- Remove Cart Product ----------

function removeCartItem(index) {

    if (index < 0 || index >= cart.length) {
        return;
    }

    cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));

    if (currentProduct >= cart.length) {
        currentProduct = Math.max(0, cart.length - 1);
    }

    displayCart();

}


// =========================================
// AUTOMATIC SUBTOTAL AND TOTAL
// =========================================

const DELIVERY_CHARGE = 0;


function calculateCartTotal() {

    let subtotal = 0;

    cart.forEach(function(item) {

        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;

        subtotal += price * quantity;

    });

    const delivery = cart.length > 0
        ? DELIVERY_CHARGE
        : 0;

    const total = subtotal + delivery;

    const subtotalElement =
        document.getElementById("cartSubtotal");

    const deliveryElement =
        document.getElementById("cartDelivery");

    const totalElement =
        document.getElementById("cartTotal");

    const placeOrderButton =
        document.getElementById("placeOrderBtn");

    if (subtotalElement) {
        subtotalElement.textContent =
            "₹" + subtotal.toFixed(2);
    }

    if (deliveryElement) {
        deliveryElement.textContent =
            "₹" + delivery.toFixed(2);
    }

    if (totalElement) {
        totalElement.textContent =
            "₹" + total.toFixed(2);
    }

    if (placeOrderButton) {
        placeOrderButton.disabled = cart.length === 0;
    }

}


// =========================================
// PLACE ORDER
// =========================================

const placeOrderButton =
    document.getElementById("placeOrderBtn");

if (placeOrderButton) {

    placeOrderButton.addEventListener("click", function() {

        if (cart.length === 0) {
            alert(
                "Your cart is empty. Please add some treats first!"
            );
            return;
        }

        let total = 0;

        cart.forEach(function(item) {
            total +=
                (Number(item.price) || 0) *
                (Number(item.quantity) || 1);
        });

        total += DELIVERY_CHARGE;

        const confirmed = confirm(
            "Place your Sweet Bakery order?\n\n" +
            "Total: ₹" + total.toFixed(2) +
            "\n\nClick OK to confirm your order."
        );

        if (!confirmed) {
            return;
        }

        // ---------- Save Order Before Clearing Cart ----------

        const newOrder = {
            orderNumber: Date.now(),
            date: new Date().toLocaleString(),

            items: cart.map(function(item) {
                return {
                    name: item.name,
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 1,
                    image: item.image || ""
                };
            }),

            total: total
        };

        orderHistory.push(newOrder);

        localStorage.setItem(
            "orderHistory",
            JSON.stringify(orderHistory)
        );

        // ---------- Clear Cart ----------

        cart = [];
        currentProduct = 0;

        localStorage.setItem("cart", JSON.stringify(cart));

        displayCart();

        alert(
            "Your order has been placed successfully! ❤️\n" +
            "Thank you for choosing Sweet Bakery!"
        );

    });

}


// =========================================
// VIEW ORDER HISTORY
// =========================================

const viewOrderHistoryBtn =
    document.querySelector("#viewOrderHistoryBtn");

const orderHistoryContainer =
    document.querySelector("#orderHistory");


if (viewOrderHistoryBtn && orderHistoryContainer) {

    viewOrderHistoryBtn.addEventListener("click", function() {

        // ---------- Hide Order History ----------

        if (orderHistoryContainer.innerHTML !== "") {

            orderHistoryContainer.innerHTML = "";

            viewOrderHistoryBtn.textContent =
                "View Order History";

            return;

        }

        // ---------- No Orders Yet ----------

        if (orderHistory.length === 0) {

            const emptyMessage = document.createElement("div");
            emptyMessage.className = "order-history-empty";

            const heading = document.createElement("h3");
            heading.textContent = "No orders yet 🧁";

            const message = document.createElement("p");
            message.textContent =
                "Your confirmed orders will appear here.";

            emptyMessage.appendChild(heading);
            emptyMessage.appendChild(message);

            orderHistoryContainer.appendChild(emptyMessage);

            viewOrderHistoryBtn.textContent =
                "Hide Order History";

            return;

        }

        // ---------- Display Newest Orders First ----------

        orderHistoryContainer.innerHTML = "";

        [...orderHistory].reverse().forEach(function(order) {

            const orderCard = document.createElement("div");
            orderCard.className = "order-history-card";

            const heading = document.createElement("h3");
            heading.textContent =
                "Order #" + order.orderNumber;

            orderCard.appendChild(heading);

            const dateText = document.createElement("p");
            dateText.textContent = "Date: " + order.date;

            orderCard.appendChild(dateText);

            const itemsHeading = document.createElement("h4");
            itemsHeading.textContent = "Items";

            orderCard.appendChild(itemsHeading);

            order.items.forEach(function(item) {

                const itemText = document.createElement("p");

                const itemTotal =
                    (Number(item.price) || 0) *
                    (Number(item.quantity) || 1);

                itemText.textContent =
                    item.name +
                    " × " + item.quantity +
                    " — ₹" + itemTotal.toFixed(2);

                orderCard.appendChild(itemText);

            });

            const totalText = document.createElement("p");

            totalText.textContent =
                "Order Total: ₹" +
                Number(order.total).toFixed(2);

            orderCard.appendChild(totalText);

            orderHistoryContainer.appendChild(orderCard);

        });

        viewOrderHistoryBtn.textContent =
            "Hide Order History";

    });

}


// ---------- Load Cart ----------

displayCart();


// =========================================
// CONTACT FORM
// =========================================

let contactMessages =
    JSON.parse(localStorage.getItem("contactMessages")) || [];


// ---------- Contact Form ----------

const contactForm =
    document.querySelector("#contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const name =
            document.querySelector("#name").value.trim();

        const email =
            document.querySelector("#email").value.trim();

        const message =
            document.querySelector("#message").value.trim();

        // ---------- Validation ----------

        if (name === "" || email === "" || message === "") {
            alert("Please fill in all fields.");
            return;
        }

        // ---------- Create Message ----------

        const newMessage = {
            name: name,
            email: email,
            message: message
        };

        // ---------- Save Message ----------

        contactMessages.push(newMessage);

        localStorage.setItem(
            "contactMessages",
            JSON.stringify(contactMessages)
        );

        alert("Your message has been sent successfully! ❤️");

        contactForm.reset();

    });

}


// =========================================
// VIEW SAVED MESSAGES
// =========================================

const viewMessagesBtn =
    document.querySelector("#viewMessagesBtn");

const savedMessages =
    document.querySelector("#savedMessages");


if (viewMessagesBtn && savedMessages) {

    viewMessagesBtn.addEventListener("click", function() {

        // ---------- Hide Messages ----------

        if (savedMessages.innerHTML !== "") {

            savedMessages.innerHTML = "";

            viewMessagesBtn.textContent =
                "View Saved Messages";

            return;

        }

        // ---------- No Messages ----------

        if (contactMessages.length === 0) {

            savedMessages.innerHTML = `
                <div class="saved-message-empty">
                    <p>No saved messages yet.</p>
                </div>
            `;

            viewMessagesBtn.textContent =
                "Hide Saved Messages";

            return;

        }

        // ---------- Display All Messages ----------

        savedMessages.innerHTML = "";

        contactMessages.forEach(function(item, index) {

            const messageCard = document.createElement("div");
            messageCard.className = "saved-message-card";

            const heading = document.createElement("h3");
            heading.textContent = "Message " + (index + 1);

            const nameText = document.createElement("p");
            nameText.textContent = "Name: " + item.name;

            const emailText = document.createElement("p");
            emailText.textContent = "Email: " + item.email;

            const messageText = document.createElement("p");
            messageText.textContent = "Message: " + item.message;

            messageCard.appendChild(heading);
            messageCard.appendChild(nameText);
            messageCard.appendChild(emailText);
            messageCard.appendChild(messageText);

            savedMessages.appendChild(messageCard);

        });

        viewMessagesBtn.textContent =
            "Hide Saved Messages";

    });

}
