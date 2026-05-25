const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey-blendedbasket';

// Middleware
app.use(express.json());
app.use(cors());

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});

// Serve frontend if not separated (just a fallback for old structure)
app.use(express.static(path.join(__dirname)));

// --- MongoDB Connection Setup ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bbdata';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        seedDatabase(); 
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
        // Do not crash the serverless function, just log it.
        // process.exit(1); 
    });

// --- Mongoose Schemas & Models ---

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: [true, 'Product price is required'], min: [0, 'Price cannot be negative'] },
    category: {
        type: String, required: [true, 'Product category is required'],
        enum: { values: ['Clothing', 'Bakery'], message: '{VALUE} is not a valid category.' }
    },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] }
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered'], default: 'Pending' }
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = user;
        next();
    });
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Admin access required.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Seeding Database ---
const initialProducts = [
    { name: "Handloom Cotton Saree", description: "Elegant handloom pure cotton saree.", price: 2500, category: "Clothing", stock: 10 },
    { name: "Kalamkari Silk Dupatta", description: "Beautiful Kalamkari print on silk.", price: 1200, category: "Clothing", stock: 15 },
    { name: "Block Print Kurti", description: "Traditional Jaipur block print.", price: 899, category: "Clothing", stock: 20 },
    { name: "Khadi Men's Kurta", description: "Comfortable organic khadi kurta.", price: 1100, category: "Clothing", stock: 20 },
    { name: "Banarasi Silk Saree", description: "Rich Banarasi silk for occasions.", price: 5500, category: "Clothing", stock: 5 },
    { name: "Bandhani Lehenga", description: "Vibrant Bandhani print lehenga set.", price: 4200, category: "Clothing", stock: 8 },
    { name: "Chikankari Suit Set", description: "Intricate Chikankari work on georgette.", price: 3400, category: "Clothing", stock: 12 },
    { name: "Phulkari Embroidered Jacket", description: "Bright Phulkari hand embroidery.", price: 2100, category: "Clothing", stock: 10 },
    { name: "Ikat Weave Trousers", description: "Modern trousers with traditional Ikat weave.", price: 1500, category: "Clothing", stock: 18 },
    { name: "Mysore Silk Stole", description: "Soft, lightweight pure Mysore silk.", price: 950, category: "Clothing", stock: 25 },
    { name: "Gulab Jamun Cake", description: "Fusion cake with real Gulab Jamun.", price: 650, category: "Bakery", stock: 10 },
    { name: "Rasmalai Cupcakes", description: "Sponge infused with saffron milk.", price: 120, category: "Bakery", stock: 30 },
    { name: "Motichoor Ladoo Box", description: "Freshly made premium Motichoor.", price: 400, category: "Bakery", stock: 15 },
    { name: "Kaju Katli Box", description: "Rich cashew sweet.", price: 500, category: "Bakery", stock: 15 },
    { name: "Nankhatai Biscuits", description: "Indian shortbread cookies.", price: 200, category: "Bakery", stock: 25 },
    { name: "Jeera Khari", description: "Flaky baked puff pastry with cumin.", price: 150, category: "Bakery", stock: 30 },
    { name: "Atta Halwa Brownies", description: "Healthy fusion brownies.", price: 180, category: "Bakery", stock: 20 },
    { name: "Pista Almond Cookies", description: "Loaded with premium nuts.", price: 250, category: "Bakery", stock: 25 },
    { name: "Mawa Cake", description: "Classic Parsi style mawa cake.", price: 300, category: "Bakery", stock: 15 },
    { name: "Coconut Barfi", description: "Fresh coconut and condensed milk sweet.", price: 350, category: "Bakery", stock: 20 },
];

async function seedDatabase() {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(initialProducts);
            console.log("Database seeded successfully.");
        }
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await User.create({ name: 'Admin User', email: 'admin@blendedbasket.com', password: hashedPassword, role: 'admin' });
            console.log('Admin user created (admin@blendedbasket.com / admin123)');
        }
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

// --- Auth Endpoints ---
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        
        const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ message: 'User created successfully', token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to sign up', details: error.message });
    }
});

app.post('/api/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ message: 'Signed in successfully', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to sign in', details: error.message });
    }
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// --- Product Endpoints ---
app.get('/api/products', async (req, res) => {
    try {
        const category = req.query.category;
        const query = category ? { category } : {};
        const products = await Product.find(query);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
});

// Admin Product Routes
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add product', details: error.message });
    }
});

app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Product updated', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
});

// --- Order Endpoints ---
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, totalAmount } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ error: 'Order items are required' });
        
        const newOrder = new Order({
            userId: req.user.userId,
            items,
            totalAmount
        });
        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ error: 'Failed to place order', details: error.message });
    }
});

// Get user orders or all orders if admin
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        let orders;
        const user = await User.findById(req.user.userId);
        if (user.role === 'admin') {
            orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
        } else {
            orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        }
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
});

app.put('/api/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json({ message: 'Order status updated', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status', details: error.message });
    }
});

// Start the server (Only if not running in a serverless environment like Vercel)
if (!process.env.VERCEL) {
    const port = process.env.PORT || PORT;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

// Export for Vercel Serverless Functions
module.exports = app;
