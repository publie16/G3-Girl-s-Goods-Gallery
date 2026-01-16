
// --- State Management ---
let currentFilters = {
    category: 'all',
    search: ''
};

let allProducts = []; // Local cache of products fetched from DB

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
    } catch (err) {
        console.error("Failed to fetch products", err);
    }
}

async function saveProduct(product) {
    try {
        await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
    } catch (err) {
        console.error("Failed to save product", err);
    }
}

async function markAsSold(productId) {
    try {
        await fetch(`/api/products/${productId}/sold`, { method: 'PATCH' });
        await fetchProducts(); // Refresh data
        renderMarket();
    } catch (err) {
        console.error("Failed to mark as sold", err);
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
    }); // No need to reverse here if backend sorts or if we want to keep backend order
}

// --- Render Logic ---
async function renderMarket() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    // Reload matches the latest state
    if (allProducts.length === 0) {
        await fetchProducts();
    }

    let products = filterProducts(allProducts);

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
            // Using product._id for MongoDB documents
            const id = product._id;
            actionButtons = `
                <button onclick="addToCart('${id}')" class="btn btn-cart">
                    Add
                </button>
                <div class="action-row">
                    <button onclick="openRentModal('${id}')" class="btn-rent">Rent</button>
                    <button onclick="openBuyModal('${id}')" class="btn btn-buy">Buy</button>
                </div>
             `;
        }

        return `
        <article class="product-card ${product.sold ? 'sold-item' : ''}">
            <div class="image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="card-image">
                <div class="wishlist-icon" onclick="toggleWishlist(this, '${product._id}')">
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
    // Session is handled by server redirects mostly now, but keeping this for robustness if needed
    // or we can remove if we trust server-side redirects fully.
    // For now, let's trust the server-side redirects on /market and page loads.
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
    // IMPORTANT: id is passed as string now (MongoDB _id)
    const product = allProducts.find(p => p._id === id || p.id === id); // Handle legacy ID if needed
    if (!product) return;

    // Check duplication
    if (!cart.find(p => p._id === product._id)) {
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
window.confirmBuy = async function () {
    if (currentBuyId) {
        await markAsSold(currentBuyId);
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

    // Store base64 image string
    let currentImageBase64 = "";

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                currentImageBase64 = event.target.result;
                preview.style.backgroundImage = `url(${event.target.result})`;
                preview.classList.remove('hidden');
                uploadText.textContent = "Change";
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Simple form data gathering
        const name = document.getElementById('product-name').value;
        const price = document.getElementById('product-price').value;
        const category = document.getElementById('product-category').value;
        const description = document.getElementById('product-desc').value;

        // Construct product object
        const product = {
            name,
            price,
            category,
            description,
            image: currentImageBase64 || './images/fast-fashion.jpeg', // Default or uploaded
            sold: false
        };

        if (!name || !price) {
            alert("Please fill required fields (Name, Price)");
            return;
        }

        await saveProduct(product);
        alert("Posted!");
        window.location.href = 'market.html'; // Assuming market.html is served at /market route in browser usually, but with EJS it's just /market
        // If SPA navigation isn't set up, full reload to /market:
        window.location.href = '/market';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch real data from API
    await fetchProducts();

    renderMarket();
    initFilters();
    initSellPage();
});
