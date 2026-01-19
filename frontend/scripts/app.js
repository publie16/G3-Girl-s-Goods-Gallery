
// --- State Management ---
let currentFilters = {
    category: 'all',
    search: ''
};

let allProducts = []; // Local cache of products fetched from DB

let wishlist = [];

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();

        const wishRes = await fetch('/api/user/wishlist');
        wishlist = await wishRes.json();

        // Fetch current user if not already set (e.g. on market.ejs it's injected, on sell.html we fetch)
        if (!window.currentUser) {
            const userRes = await fetch('/api/user/me');
            if (userRes.ok) {
                window.currentUser = await userRes.json();
            }
        }
    } catch (err) {
        console.error("Failed to fetch data", err);
    }
}

async function saveProduct(product) {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to save product");
        }
        return await response.json();
    } catch (err) {
        console.error("Failed to save product", err);
        throw err;
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
        const isWished = wishlist.includes(product._id);
        const sellerInfo = product.seller ? `
            <div class="seller-badge" style="font-size: 0.8rem; background: #f0f0f0; padding: 5px 10px; border-radius: 20px; margin-bottom: 10px; display: inline-block;">
                👤 ${product.seller.name} (${product.seller.hostel || 'Block ?'}, Room ${product.seller.room || '?'})
            </div>
        ` : '';

        // Check if current user is the seller
        const isOwner = window.currentUser && window.currentUser.name === product.seller?.name;

        // Action Buttons based on Mode
        let actionButtons = '';
        if (product.sold) {
            actionButtons = `<div class="sold-badge" style="color: red; font-weight: bold; text-align: center; padding: 10px;">ITEM SOLD</div>`;
        } else {
            const id = product._id;
            const mode = product.mode || 'buy';
            let mainBtnText = mode.charAt(0).toUpperCase() + mode.slice(1);
            let mainBtnClass = mode === 'buy' ? 'btn-buy' : (mode === 'rent' ? 'btn-rent' : 'btn-borrow');

            actionButtons = `
                ${isOwner ? `<button onclick="openEditModal('${id}', ${product.price}, '${product.description?.replace(/'/g, "\\'")}')" class="btn btn-cart" style="margin-bottom:8px; border-color:#d63384; color:#d63384;">Edit Price</button>` : ''}
                <div class="action-row" style="margin-bottom:8px;">
                     <button onclick="addToCart('${id}')" class="btn btn-cart" style="flex:1;">Add to Cart</button>
                     <button onclick="openMessageModal('${id}', '${product.seller?.name}')" class="btn-rent" style="flex:1; background:#e0f7fa; border:1px solid #00acc1; color:#006064;">Chat</button>
                </div>
                <button onclick="openConfirmModal('${id}', '${mode}')" class="btn ${mainBtnClass}" style="width:100%; border-radius:12px; font-weight:bold; height:45px;">${mainBtnText} Now</button>
            `;
        }

        return `
        <article class="product-card ${product.sold ? 'sold-item' : ''}">
            <div class="image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="card-image">
                <div class="wishlist-icon ${isWished ? 'active' : ''}" onclick="toggleWishlist(this, '${product._id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.281 9.6 2.011L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                    </svg>
                </div>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="category-tag">${product.category || 'General'}</span>
                    <span class="mode-tag" style="float: right; font-size: 0.7rem; background: #ffecf2; color: #d63384; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">${product.mode}</span>
                </div>
                <h3 class="card-title">${product.name}</h3>
                <div class="card-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
                <div class="card-desc" style="font-size: 0.85rem; color: #666; height: 40px; overflow: hidden; margin-bottom: 10px;">${product.description || ''}</div>
                ${sellerInfo}
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
let cart = JSON.parse(localStorage.getItem('g3-cart')) || [];

window.addToCart = function (id) {
    // IMPORTANT: id is passed as string now (MongoDB _id)
    const product = allProducts.find(p => p._id === id || p.id === id); // Handle legacy ID if needed
    if (!product) return;

    // Check duplication
    if (!cart.find(p => p._id === product._id)) {
        cart.push(product);
        localStorage.setItem('g3-cart', JSON.stringify(cart));
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
window.toggleWishlist = async function (element, id) {
    try {
        const res = await fetch('/api/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id })
        });
        const data = await res.json();
        element.classList.toggle('active', data.saved);

        // Update local wishlist state
        if (data.saved) wishlist.push(id);
        else wishlist = wishlist.filter(wid => wid !== id);
    } catch (err) {
        console.error("Failed to toggle wishlist", err);
    }
}

// Global Messaging
let currentMsgReceiver = null;
let currentMsgProductId = null;

window.openMessageModal = function (productId, sellerName) {
    if (!sellerName || sellerName === 'undefined') {
        alert("Seller information unavailable.");
        return;
    }
    currentMsgReceiver = sellerName;
    currentMsgProductId = productId;
    document.getElementById('msg-modal-title').innerText = `Chat with ${sellerName}`;
    document.getElementById('msg-content').value = "Hi, is this still available?";
    document.getElementById('message-modal').classList.remove('hidden');
}

window.closeMessageModal = function () {
    document.getElementById('message-modal').classList.add('hidden');
}

window.confirmSendMessage = async function () {
    const content = document.getElementById('msg-content').value;
    if (!content) return;

    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiver: currentMsgReceiver,
                content: content,
                productId: currentMsgProductId
            })
        });
        alert("Message sent! Thanks for visiting us. 🌸");
        closeMessageModal();
    } catch (err) {
        console.error("Failed to send message", err);
    }
}

// Updated Confirm Modal (Unified Buy/Rent/Borrow)
let actionItem = null;
window.openConfirmModal = function (id, mode) {
    actionItem = { id, mode };
    if (mode === 'buy') openBuyModal(id);
    else if (mode === 'rent') openRentModal(id);
    else {
        alert("Borrow request sent! Please coordinate in chat. Thanks for visiting us! 🌸");
    }
}

// Success message updates for confirm functions
const originalConfirmBuy = window.confirmBuy;
window.confirmBuy = async function () {
    await originalConfirmBuy();
    alert("Order placed! Thanks for visiting us. 🌸");
}

const originalConfirmRent = window.confirmRent;
window.confirmRent = function () {
    originalConfirmRent();
    alert("Rent request sent! Coordinate in chat. Thanks for visiting us. 🌸");
}

// Edit Modal Logic
let currentEditId = null;
window.openEditModal = function (id, price, desc) {
    currentEditId = id;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-desc').value = desc || '';
    document.getElementById('edit-modal').classList.remove('hidden');
}

window.closeEditModal = function () {
    document.getElementById('edit-modal').classList.add('hidden');
}

window.confirmEdit = async function () {
    const price = document.getElementById('edit-price').value;
    const description = document.getElementById('edit-desc').value;

    try {
        await fetch(`/api/products/${currentEditId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price, description })
        });
        alert("Product updated! Thanks for visiting us. 🌸");
        closeEditModal();
        await fetchProducts();
        renderMarket();
    } catch (err) {
        console.error("Failed to update product", err);
    }
}

// Sell Page Update to use currentUser info
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

    // Inject current user info if available
    if (window.currentUser) {
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = "background: #fdf2f8; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #be185d; border: 1px solid #fbcfe8;";
        infoDiv.innerHTML = `Posting as: <b>${window.currentUser.name}</b> (Block ${window.currentUser.block}, Room ${window.currentUser.room})`;
        form.insertBefore(infoDiv, form.firstChild);
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Simple form data gathering
        const name = document.getElementById('product-name').value;
        const price = document.getElementById('product-price').value;
        const category = document.getElementById('product-category').value;
        const mode = document.getElementById('product-mode').value;
        const description = document.getElementById('product-desc').value;

        // Construct product object
        const product = {
            name,
            price,
            category,
            mode,
            description,
            image: currentImageBase64 || './images/fast-fashion.jpeg', // Default or uploaded
            sold: false,
            seller: {
                name: window.currentUser?.name || 'Unknown',
                hostel: window.currentUser?.block || '?',
                room: window.currentUser?.room || '?'
            }
        };

        if (!name || !price) {
            alert("Please fill required fields (Name, Price)");
            return;
        }

        try {
            await saveProduct(product);
            alert("Posted successfully! Thanks for visiting us. 🌸");
            window.location.href = '/market';
        } catch (err) {
            alert("Error: " + err.message);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch real data from API
    await fetchProducts();

    renderMarket();
    updateCartModal(); // Init cart from storage
    initFilters();
    initSellPage();
});
