
const initialProducts = [
    {
        id: 1,
        name: "Rose Quartz Necklace",
        price: 4500,
        description: "Handcrafted gold necklace featuring a delicate rose quartz stone drops.",
        image: "./images/jewelry.png",
        sold: false
    },
    {
        id: 2,
        name: "Vintage Floral Jacket",
        price: 8500,
        description: "One-of-a-kind denim jacket with custom hand-embroidered floral design.",
        image: "./images/jacket.png",
        sold: false
    },
    {
        id: 3,
        name: "Pastel Dream Print",
        price: 3000,
        description: "Original watercolor abstraction framed in light oak. Perfect for sunny rooms.",
        image: "./images/art.png",
        sold: false
    }
];

// --- State Management ---
function getProducts() {
    const stored = localStorage.getItem('products');
    if (stored) {
        return JSON.parse(stored);
    }
    localStorage.setItem('products', JSON.stringify(initialProducts));
    return initialProducts;
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

function saveProduct(product) {
    const products = getProducts();
    products.push(product);
    saveProducts(products);
}

function markAsSold(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
        product.sold = true;
        saveProducts(products);
        renderMarket(); // Re-render to update UI
    }
}

// --- Render Logic ---
function renderMarket() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const products = getProducts();
    grid.innerHTML = products.map(product => `
        <article class="product-card ${product.sold ? 'sold-item' : ''}">
            <div class="image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="card-image">
                ${product.sold ? '<div class="sold-overlay">SOLD</div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                <div class="card-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
                <p class="card-desc">${product.description}</p>
                
                <div class="rent-section">
                     <button onclick="openRentModal(${product.id})" class="btn-rent" ${product.sold ? 'disabled' : ''}>
                        Rent this Item
                     </button>
                </div>

                <div class="card-actions">
                    <button onclick="addToCart('${product.name}')" class="btn btn-cart" ${product.sold ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                    <button onclick="openBuyModal(${product.id})" class="btn btn-buy" ${product.sold ? 'disabled' : ''}>
                        Buy Now
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

// --- Actions ---

// Cart
window.addToCart = function (productName) {
    // Custom Toast / Alert
    const message = document.createElement('div');
    message.className = 'toast-message';
    message.innerText = `✨ "${productName}" added to checkout!`;
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Rent Modal
let currentRentId = null;

window.openRentModal = function (id) {
    currentRentId = id;
    document.getElementById('rent-modal').classList.remove('hidden');
}

window.closeRentModal = function () {
    document.getElementById('rent-modal').classList.add('hidden');
    currentRentId = null;
}

window.confirmRent = function () {
    const days = document.getElementById('rent-days').value;
    if (!days || days < 1) {
        alert("Please enter a valid number of days.");
        return;
    }

    // Simulate seller communication
    alert(`Request sent to Seller! \n\nAsking for: ${days} days.\nSeller will review your request.`);
    closeRentModal();
}

// Buy Modal
let currentBuyId = null;

window.openBuyModal = function (id) {
    currentBuyId = id;
    document.getElementById('buy-modal').classList.remove('hidden');
}

window.closeBuyModal = function () {
    document.getElementById('buy-modal').classList.add('hidden');
    currentBuyId = null;
}

window.confirmBuy = function () {
    const method = document.querySelector('input[name="payment"]:checked');
    if (!method) {
        alert("Please select a payment method.");
        return;
    }

    if (currentBuyId) {
        markAsSold(currentBuyId);

        // Success Message
        document.getElementById('buy-modal-content').innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #1c1437; margin-bottom: 20px;">Thank You! ✨</h2>
                <p>Your order has been placed via ${method.value}.</p>
                <p>Thanks for visiting Girls Goods Gallery!</p>
                <button onclick="closeBuyModal(); location.reload();" class="btn btn-buy" style="margin-top: 20px;">Close</button>
            </div>
        `;
    }
}


// --- Sell Page Logic ---
function initSellPage() {
    const form = document.getElementById('sell-form');
    if (!form) return;

    const fileInput = document.getElementById('product-image');
    const preview = document.getElementById('image-preview');
    const uploadText = document.getElementById('upload-text');

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                preview.style.backgroundImage = `url(${event.target.result})`;
                preview.classList.remove('hidden');
                uploadText.textContent = "Change Image";
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('product-name').value;
        const price = document.getElementById('product-price').value;
        const desc = document.getElementById('product-desc').value;
        const file = fileInput.files[0];

        if (!file) {
            alert("Please upload an image!");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const newProduct = {
                id: Date.now(),
                name: name,
                price: parseFloat(price),
                description: desc,
                image: event.target.result,
                sold: false
            };

            saveProduct(newProduct);
            alert("Product listed successfully!");
            window.location.href = 'market.html';
        };
        reader.readAsDataURL(file);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderMarket();
    initSellPage();
});
