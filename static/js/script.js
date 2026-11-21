
// =========================================
// SWEET BAKERY
// FULL STACK JAVASCRIPT
// =========================================

const DELIVERY_CHARGE = 55;

let cart = [];
let currentProduct = 0;
let orderHistory = [];
let contactMessages = [];


// =========================================
// API REQUEST HELPER
// =========================================

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}


// =========================================
// COMMON HELPERS
// =========================================

function formatPrice(amount) {
    return "₹" + Number(amount || 0).toFixed(2);
}


function getProductImage(image) {
    if (!image) {
        return "";
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("/static/")
    ) {
        return image;
    }

    return "/static/" + image.replace(/^\/+/, "");
}


function showError(error) {
    alert(error.message || "Something went wrong. Please try again.");
}


// =========================================
// ADD PRODUCT TO CART
// =========================================

const cartButtons = document.querySelectorAll(".cart-btn");

cartButtons.forEach(function(button) {

    button.addEventListener("click", async function() {

        const productCode = button.dataset.id;

        if (!productCode) {
            return;
        }

        button.disabled = true;

        try {
            const result = await apiRequest("/api/cart", {
                method: "POST",
                body: JSON.stringify({
                    product_code: productCode
                })
            });

            alert(result.message || "Product added to cart!");

        } catch (error) {
            showError(error);

        } finally {
            button.disabled = false;
        }

    });

});


// =========================================
// CART PRODUCT SLIDER
// =========================================

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

                <p>
                    Add some delicious treats from our menu!
                </p>

                <a href="/menu" class="cart-btn">
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

            <img
                class="cart-product-image"
                alt="Product"
            >

            <h3 class="cart-product-name"></h3>

            <p class="cart-product-price"></p>

            <div class="cart-quantity-controls">

                <button
                    type="button"
                    id="decreaseQuantityBtn"
                    ${quantity <= 1 ? "disabled" : ""}
                >
                    −
                </button>

                <span class="cart-product-quantity"></span>

                <button
                    type="button"
                    id="increaseQuantityBtn"
                >
                    +
                </button>

            </div>

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

    const imageElement = productCard.querySelector(
        ".cart-product-image"
    );

    const imageUrl = getProductImage(item.image);

    if (imageUrl) {
        imageElement.src = imageUrl;
    } else {
        imageElement.remove();
    }

    productCard.querySelector(".cart-product-name").textContent =
        item.name;

    productCard.querySelector(".cart-product-price").textContent =
        "Price: " + formatPrice(price);

    productCard.querySelector(".cart-product-quantity").textContent =
        "Quantity: " + quantity;

    productCard.querySelector(".cart-product-total").textContent =
        "Item Total: " + formatPrice(itemTotal);


    // Remove product

    document
        .querySelector("#removeCartItemBtn")
        .addEventListener("click", function() {
            removeCartItem(currentProduct);
        });


    // Previous product

    document
        .querySelector("#previousProductBtn")
        .addEventListener("click", previousProduct);


    // Next product

    document
        .querySelector("#nextProductBtn")
        .addEventListener("click", nextProduct);


    // Increase quantity

    document
        .querySelector("#increaseQuantityBtn")
        .addEventListener("click", function() {
            updateCartQuantity(item.product_code, quantity + 1);
        });


    // Decrease quantity

    document
        .querySelector("#decreaseQuantityBtn")
        .addEventListener("click", function() {
            if (quantity > 1) {
                updateCartQuantity(item.product_code, quantity - 1);
            }
        });

    calculateCartTotal();

}


// =========================================
// NEXT PRODUCT
// =========================================

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


// =========================================
// PREVIOUS PRODUCT
// =========================================

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


// =========================================
// LOAD CART FROM DATABASE
// =========================================

async function loadCart() {

    const cartItems = document.querySelector(".cart-items");

    if (!cartItems) {
        return;
    }

    try {
        const result = await apiRequest("/api/cart");

        cart = result.items || [];

        displayCart();

    } catch (error) {
        cartItems.innerHTML = `
            <h2>Your Items</h2>
            <p>Unable to load your cart. Please refresh the page.</p>
        `;

        calculateCartTotal();
        console.error(error);
    }
}


// =========================================
// UPDATE CART QUANTITY
// =========================================

async function updateCartQuantity(productCode, quantity) {

    try {
        await apiRequest(
            "/api/cart/" + encodeURIComponent(productCode),
            {
                method: "PATCH",
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        await loadCart();

    } catch (error) {
        showError(error);
    }
}


// =========================================
// REMOVE CART PRODUCT
// =========================================

async function removeCartItem(index) {

    if (index < 0 || index >= cart.length) {
        return;
    }

    const product = cart[index];

    try {
        const result = await apiRequest(
            "/api/cart/" + encodeURIComponent(product.product_code),
            {
                method: "DELETE"
            }
        );

        currentProduct = Math.min(
            currentProduct,
            Math.max(0, cart.length - 2)
        );

        await loadCart();

        alert(result.message || "Product removed from cart.");

    } catch (error) {
        showError(error);
    }
}


// =========================================
// AUTOMATIC SUBTOTAL AND TOTAL
// =========================================

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
        subtotalElement.textContent = formatPrice(subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent = formatPrice(delivery);
    }

    if (totalElement) {
        totalElement.textContent = formatPrice(total);
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

    placeOrderButton.addEventListener("click", async function() {

        if (cart.length === 0) {
            alert("Your cart is empty. Please add some treats first!");
            return;
        }

        let subtotal = 0;

        cart.forEach(function(item) {
            subtotal +=
                Number(item.price) * Number(item.quantity);
        });

        const total = subtotal + DELIVERY_CHARGE;

        const confirmed = confirm(
            "Place your Sweet Bakery order?\n\n" +
            "Subtotal: " + formatPrice(subtotal) + "\n" +
            "Delivery: " + formatPrice(DELIVERY_CHARGE) + "\n" +
            "Total: " + formatPrice(total) +
            "\n\nClick OK to confirm your order."
        );

        if (!confirmed) {
            return;
        }

        placeOrderButton.disabled = true;

        try {
            const result = await apiRequest("/api/orders", {
                method: "POST",
                body: JSON.stringify({})
            });

            currentProduct = 0;

            await loadCart();

            let confirmationMessage =
                "Your order #" + result.order_id +
                " has been placed successfully! ❤️\n\n" +
                "Total: " + formatPrice(result.total);

            if (result.email_sent) {
                confirmationMessage +=
                    "\n\nYour confirmation email has been sent!";
            } else {
                confirmationMessage +=
                    "\n\nYour order is saved, but the confirmation email " +
                    "could not be sent.";
            }

            alert(confirmationMessage);

            // Refresh order history if it is currently visible.

            if (
                orderHistoryContainer &&
                orderHistoryContainer.dataset.visible === "true"
            ) {
                await loadOrderHistory();
            }

        } catch (error) {
            showError(error);

        } finally {
            placeOrderButton.disabled = cart.length === 0;
        }

    });

}


// =========================================
// ORDER HISTORY
// =========================================

const viewOrderHistoryBtn =
    document.querySelector("#viewOrderHistoryBtn");

const orderHistoryContainer =
    document.querySelector("#orderHistory");


async function loadOrderHistory() {

    if (!orderHistoryContainer) {
        return;
    }

    try {
        const result = await apiRequest("/api/orders");

        orderHistory = result.orders || [];

        displayOrderHistory();

    } catch (error) {
        orderHistoryContainer.textContent =
            "Unable to load order history.";

        console.error(error);
    }
}


function displayOrderHistory() {

    if (!orderHistoryContainer) {
        return;
    }

    orderHistoryContainer.innerHTML = "";

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

        return;
    }

    orderHistory.forEach(function(order) {

        const orderCard = document.createElement("div");
        orderCard.className = "order-history-card";

        const heading = document.createElement("h3");
        heading.textContent = "Order #" + order.id;

        const dateText = document.createElement("p");
        dateText.textContent = "Date: " + order.created_at;

        const statusText = document.createElement("p");
        statusText.textContent = "Status: " + order.status;

        const itemsHeading = document.createElement("h4");
        itemsHeading.textContent = "Items";

        orderCard.appendChild(heading);
        orderCard.appendChild(dateText);
        orderCard.appendChild(statusText);
        orderCard.appendChild(itemsHeading);

        (order.items || []).forEach(function(item) {

            const itemText = document.createElement("p");

            const itemTotal =
                Number(item.price) * Number(item.quantity);

            itemText.textContent =
                item.name +
                " × " + item.quantity +
                " — " + formatPrice(itemTotal);

            orderCard.appendChild(itemText);

        });

        const subtotalText = document.createElement("p");
        subtotalText.textContent =
            "Subtotal: " + formatPrice(order.subtotal);

        const deliveryText = document.createElement("p");
        deliveryText.textContent =
            "Delivery: " + formatPrice(order.delivery_charge);

        const totalText = document.createElement("p");
        totalText.textContent =
            "Order Total: " + formatPrice(order.total_amount);

        orderCard.appendChild(subtotalText);
        orderCard.appendChild(deliveryText);
        orderCard.appendChild(totalText);

        orderHistoryContainer.appendChild(orderCard);

    });
}


if (viewOrderHistoryBtn && orderHistoryContainer) {

    viewOrderHistoryBtn.addEventListener("click", async function() {

        if (orderHistoryContainer.dataset.visible === "true") {

            orderHistoryContainer.innerHTML = "";
            orderHistoryContainer.dataset.visible = "false";

            viewOrderHistoryBtn.textContent =
                "View Order History";

            return;
        }

        orderHistoryContainer.dataset.visible = "true";

        viewOrderHistoryBtn.textContent =
            "Hide Order History";

        await loadOrderHistory();

    });

}


// =========================================
// CONTACT FORM
// =========================================

const contactForm =
    document.querySelector("#contactForm");


if (contactForm) {

    contactForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.querySelector("#name").value.trim();

        const email =
            document.querySelector("#email").value.trim();

        const message =
            document.querySelector("#message").value.trim();

        if (!name || !email || !message) {
            alert("Please fill in all fields.");
            return;
        }

        const submitButton = contactForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const result = await apiRequest(
                "/api/contact-messages",
                {
                    method: "POST",
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        message: message
                    })
                }
            );

            alert(result.message || "Your message has been sent successfully! ❤️");

            contactForm.reset();

            if (
                savedMessages &&
                savedMessages.dataset.visible === "true"
            ) {
                await loadContactMessages();
            }

        } catch (error) {
            showError(error);

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }

    });

}


// =========================================
// VIEW SAVED MESSAGES
// =========================================

const viewMessagesBtn =
    document.querySelector("#viewMessagesBtn");

const savedMessages =
    document.querySelector("#savedMessages");


async function loadContactMessages() {

    if (!savedMessages) {
        return;
    }

    try {
        const result = await apiRequest("/api/contact-messages");

        contactMessages = result.messages || [];

        displayContactMessages();

    } catch (error) {
        savedMessages.textContent =
            "Unable to load saved messages.";

        console.error(error);
    }
}


function displayContactMessages() {

    if (!savedMessages) {
        return;
    }

    savedMessages.innerHTML = "";

    if (contactMessages.length === 0) {

        const emptyMessage = document.createElement("div");
        emptyMessage.className = "saved-message-empty";

        const message = document.createElement("p");
        message.textContent = "No saved messages yet.";

        emptyMessage.appendChild(message);
        savedMessages.appendChild(emptyMessage);

        return;
    }

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
}


if (viewMessagesBtn && savedMessages) {

    viewMessagesBtn.addEventListener("click", async function() {

        if (savedMessages.dataset.visible === "true") {

            savedMessages.innerHTML = "";
            savedMessages.dataset.visible = "false";

            viewMessagesBtn.textContent =
                "View Saved Messages";

            return;
        }

        savedMessages.dataset.visible = "true";

        viewMessagesBtn.textContent =
            "Hide Saved Messages";

        await loadContactMessages();

    });

}


// =========================================
// INITIALIZE PAGE
// =========================================

loadCart();
