
const initialProducts = [
    // 1. Jewelry (Accessories)
    { id: 1, name: "Rose Quartz Necklace", price: 450, description: "Delicate handmade necklace.", image: "./images/jewelry.png", category: "Accessories", sold: false },

    // 2. Jacket (Clothes)
    { id: 2, name: "Vintage Floral Jacket", price: 1200, description: "Custom embroidered denim.", image: "./images/jacket.png", category: "Clothes", sold: false },

    // 3. Art (Electronics/Decor - mapped to Books/Decor in UI maybe, or just keep category)
    { id: 3, name: "Pastel Abstract Art", price: 300, description: "Framed print for dorm walls.", image: "./images/art.png", category: "Books", sold: false },

    // 4. Books (Rented Demo)
    {
        id: 4,
        name: "Psychology Textbook",
        price: 400,
        description: "Introduction to Psychology, 1st Year.",
        image: "./images/books.png",
        category: "Books",
        sold: false,
        rented: true,
        rentedTill: "18 Jan"
    },

    // 5. Electronics (New Image)
    { id: 5, name: "Pastel Headphones", price: 1500, description: "Wireless, noise cancelling, pink.", image: "./images/headphones.png", category: "Electronics", sold: false },

    // 6. Reuse Jewelry (Different Item)
    { id: 6, name: "Silver Hoops", price: 200, description: "Classic sterling silver hoops.", image: "./images/jewelry.png", category: "Accessories", sold: false }
];

// --- State Management ---
let currentFilters = {
    category: 'all',
    search: ''
};

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
        renderMarket();
    }
}

// --- Filter Logic ---
function filterProducts(products) {
    return products.filter(product => {
        // Category Filter
        if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
            return false;
        }
        // Search Filter
        if (currentFilters.search && !product.name.toLowerCase().includes(currentFilters.search.toLowerCase())) {
            return false;
        }
        return true;
    }).reverse(); // Show newest first by default
}

// --- Render Logic ---
// --- Render Logic ---
function renderMarket() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    let products = getProducts();
    products = filterProducts(products);

    if (products.length === 0) {
        grid.innerHTML = '<div class="no-results">No products found.</div>';
        return;
    }

    grid.innerHTML = products.map(product => {
        // Rented Logic
        let actionButtons = '';
        if (product.rented) {
            actionButtons = `
                <div class="rent-timer-badge">
                    <span>⏳ Rented till: ${product.rentedTill}</span>
                </div>
            `;
        } else if (product.sold) {
            actionButtons = `<div class="sold-badge">Item Sold</div>`;
        } else {
            actionButtons = `
                <button onclick="addToCart(${product.id})" class="btn btn-cart">
                    Add
                </button>
                <div class="action-row">
                    <button onclick="openRentModal(${product.id})" class="btn-rent">Rent</button>
                    <button onclick="openBuyModal(${product.id})" class="btn btn-buy">Buy</button>
                </div>
             `;
        }

        return `
        <article class="product-card ${product.sold ? 'sold-item' : ''}">
            <div class="image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="card-image">
                <div class="wishlist-icon" onclick="toggleWishlist(this, ${product.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.281 9.6 2.011L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                    </svg>
                </div>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="category-tag">${product.category || 'General'}</span>
                </div>
                <h3 class="card-title">${product.name}</h3>
                <div class="card-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
                
                <!-- Enquiry Button -->
                <button onclick="openEnquiry('${product.name}')" class="btn-enquiry">
                    💬 Is this available?
                </button>

                <div class="card-actions-container">
                    ${actionButtons}
                </div>
            </div>
        </article>
    `}).join('');
}

// --- Event Listeners for Filters ---
function initFilters() {
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const categoryBtns = document.querySelectorAll('.cat-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            renderMarket();
        });
    }

    // Support both select and button based categories if we switch UI
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            renderMarket();
        });
    }

    if (categoryBtns) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilters.category = btn.dataset.category;
                renderMarket();
            });
        });
    }
}

// --- Auth Check ---
function checkAuth() {
    const path = window.location.pathname;
    // Simple bypass for development comfort if needed, but keeping strict for now
    if (path.includes('market.html') || path.includes('sell.html')) {
        const user = localStorage.getItem('g3_user');
        if (!user) {
            window.location.href = 'login.html';
        }
    }
}


// --- Actions & Modals (Existing Code) ---

// Cart
// --- Actions ---

// WhatsApp Enquiry
window.openEnquiry = function (productName) {
    const message = `Hi, is this product (${productName}) still available?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

// Cart Logic
let cart = [];

window.addToCart = function (id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    // Check duplication
    if (!cart.find(p => p.id === id)) {
        cart.push(product);
        updateCartModal();

        // Show notification
        const message = document.createElement('div');
        message.className = 'toast-message';
        message.innerText = `✨ Added to Cart!`;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);

        // Open Cart Modal automatically to show details
        document.getElementById('cart-modal').classList.remove('hidden');
    }
}

function updateCartModal() {
    const container = document.getElementById('cart-items-container');
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item" style="display:flex; gap:10px; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
            <div>
                <h4 style="margin:0;">${item.name}</h4>
                <p style="margin:0; color:#d63384;">₹${item.price}</p>
            </div>
        </div>
    `).join('');
}

// Global Cart Toggle
window.toggleCart = function () {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
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
    alert(`Request sent for ${days} days!`);
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
    if (currentBuyId) {
        markAsSold(currentBuyId);
        closeBuyModal();
    }
}

// Wishlist
window.toggleWishlist = function (element, id) {
    element.classList.toggle('active');
}

// Sell Page
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
                uploadText.textContent = "Change";
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // ... simplified submission for brevity ... 
        alert("Posted!");
        window.location.href = 'market.html';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Clear old data to show new seeded data
    const existing = JSON.parse(localStorage.getItem('products') || '[]');
    if (existing.length < 5) {
        localStorage.removeItem('products');
    }

    renderMarket();
    initFilters();
    initSellPage();
});
