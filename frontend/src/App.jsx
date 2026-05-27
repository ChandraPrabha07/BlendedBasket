import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, User as UserIcon, LogOut, Package, ShieldCheck, CreditCard, MapPin, CheckCircle, Edit, Trash2, Plus } from 'lucide-react';
import { productsData } from './data/products';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get/set local storage products seamlessly
const getLocalProducts = () => {
  const local = localStorage.getItem('blendedProducts');
  return local ? JSON.parse(local) : productsData;
};
const setLocalProducts = (data) => localStorage.setItem('blendedProducts', JSON.stringify(data));

// Helper for orders
const getLocalOrders = () => {
  const local = localStorage.getItem('blendedOrders');
  return local ? JSON.parse(local) : [];
};
const setLocalOrders = (data) => localStorage.setItem('blendedOrders', JSON.stringify(data));

const Home = ({ addToCart }) => {
  const [products, setProducts] = useState(getLocalProducts());
  const [category, setCategory] = useState('');
  
  useEffect(() => {
    const allProducts = getLocalProducts();
    if (category) {
      setProducts(allProducts.filter(p => p.category === category));
    } else {
      setProducts(allProducts);
    }
  }, [category]);

  return (
    <div className="container">
      <div className="hero slide-up">
        <h1>Handcrafted elegance meets <span className="logo-highlight">home-baked comfort.</span></h1>
        <p>Discover a unique storefront where artisanal fashion and freshly baked delights come together.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button className={`category-btn ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>
          <button className={`category-btn ${category === 'Clothing' ? 'active' : ''}`} onClick={() => setCategory('Clothing')}>Clothing</button>
          <button className={`category-btn ${category === 'Bakery' ? 'active' : ''}`} onClick={() => setCategory('Bakery')}>Bakery</button>
        </div>
      </div>
      <div className="grid">
        {products.map((p, index) => (
          <div key={p._id} className="card fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="card-img-wrapper">
              <img src={p.image || '/images/placeholder.jpg'} alt={p.name} className="card-img" />
            </div>
            <h3>{p.name}</h3>
            <div className="price">₹{p.price}</div>
            <p>{p.description}</p>
            <button className="btn-primary" onClick={() => addToCart(p)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Cart = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateQ = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i._id === id) return { ...i, quantity: Math.max(1, i.quantity + delta) };
      return i;
    }));
  };

  const remove = (id) => setCart(prev => prev.filter(i => i._id !== id));

  if (cart.length === 0) return (
    <div className="container" style={{textAlign:'center', paddingTop:'8rem'}}>
      <ShoppingCart size={64} style={{color: 'var(--border-color)', marginBottom: '1rem'}} />
      <h2>Your cart is beautifully empty</h2>
      <p style={{color: 'var(--text-secondary)', marginTop: '1rem'}}>Add some handcrafted or home-baked goods!</p>
      <Link to="/" className="btn-primary" style={{marginTop: '2rem'}}>Start Shopping</Link>
    </div>
  );

  return (
    <div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>
      <h2 style={{fontSize: '2rem', marginBottom: '2rem'}}>Your Shopping Bag</h2>
      <div className="cart-list">
        {cart.map(item => (
          <div key={item._id} className="cart-item slide-up">
            <div className="cart-item-info">
              <img src={item.image || '/images/placeholder.jpg'} alt={item.name} className="cart-item-img" />
              <div>
                <h4>{item.name}</h4>
                <div style={{color: 'var(--text-secondary)'}}>₹{item.price} each</div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <div className="quantity-control">
                <button onClick={() => updateQ(item._id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQ(item._id, 1)}>+</button>
              </div>
              <button className="btn-text-danger" onClick={() => remove(item._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary slide-up">
        <div className="cart-total">Total: ₹{total}</div>
        <button className="btn-primary btn-large" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
      </div>
    </div>
  );
};

const Checkout = ({ cart, setCart, user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [address, setAddress] = useState({ name: '', phone: '', street: '', city: '', pincode: '' });

  useEffect(() => {
    if (cart.length === 0 && step === 1) navigate('/cart');
  }, [cart, navigate, step]);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    
    // Save to localStorage for seamless Orders display
    const newOrder = {
      _id: 'ord_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      items: cart,
      totalAmount: total,
      status: 'Pending',
      address
    };
    
    const existingOrders = getLocalOrders();
    setLocalOrders([newOrder, ...existingOrders]);
    
    setLoading(false);
    setCart([]);
    setStep(3);
  };

  return (
    <div className="container" style={{maxWidth: '600px', margin: '0 auto'}}>
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}><MapPin size={20}/> Address</div>
        <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}><CreditCard size={20}/> Payment</div>
        <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}><CheckCircle size={20}/> Done</div>
      </div>

      {step === 1 && (
        <div className="checkout-card slide-up">
          <h3>Shipping Address</h3>
          <form onSubmit={handleAddressSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required value={address.name} onChange={e => setAddress({...address, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" required value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input type="text" required value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex: 1}}>
                <label>City</label>
                <input type="text" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>Pincode</label>
                <input type="text" required value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-large" style={{marginTop: '1rem'}}>Continue to Payment</button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="checkout-card slide-up">
          <h3>Payment Gateway</h3>
          <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Amount to pay: <strong>₹{total}</strong></p>
          
          <div className="payment-methods">
            <div className="payment-method active">
              <CreditCard size={24} />
              <span>Credit / Debit Card</span>
            </div>
            <div className="payment-method">
              <span>UPI / QR</span>
            </div>
          </div>
          
          <div className="form-group">
            <label>Card Number</label>
            <input type="text" placeholder="XXXX XXXX XXXX XXXX" defaultValue="4111 1111 1111 1111" />
          </div>
          <div className="form-row">
            <div className="form-group" style={{flex: 1}}>
              <label>Expiry</label>
              <input type="text" placeholder="MM/YY" defaultValue="12/26" />
            </div>
            <div className="form-group" style={{flex: 1}}>
              <label>CVV</label>
              <input type="password" placeholder="XXX" defaultValue="123" />
            </div>
          </div>

          <button className={`btn-primary btn-large ${loading ? 'loading' : ''}`} onClick={handlePayment} disabled={loading} style={{marginTop: '1rem'}}>
            {loading ? 'Processing...' : `Pay ₹${total}`}
          </button>
          <button className="btn-secondary" style={{width: '100%', marginTop: '1rem'}} onClick={() => setStep(1)} disabled={loading}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="checkout-card slide-up" style={{textAlign: 'center', padding: '4rem 2rem'}}>
          <CheckCircle size={80} style={{color: '#10b981', margin: '0 auto 1.5rem'}} />
          <h2 style={{marginBottom: '1rem'}}>Order Placed Successfully!</h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>
            Thank you, {address.name}! Your beautifully crafted items will be delivered to {address.city} soon.
          </p>
          <Link to="/orders" className="btn-primary">View My Orders</Link>
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Seamlessly fetch from localStorage
    setOrders(getLocalOrders());
  }, []);

  return (
    <div className="container">
      <h2>My Orders</h2>
      <div className="table-container slide-up">
        <table className="table">
          <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td style={{fontWeight: 'bold'}}>#{o._id.substring(4, 10).toUpperCase()}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                <td>₹{o.totalAmount}</td>
                <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding: '3rem', color: 'var(--text-secondary)'}}>You haven't placed any orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Admin = () => {
  const [products, setProducts] = useState(getLocalProducts());
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: '', price: '', category: 'Clothing', description: '', image: '' });

  const handleSave = (e) => {
    e.preventDefault();
    let updatedProducts;
    if (currentProduct._id) {
      updatedProducts = products.map(p => p._id === currentProduct._id ? currentProduct : p);
    } else {
      updatedProducts = [{...currentProduct, _id: 'p' + Date.now()}, ...products];
    }
    setProducts(updatedProducts);
    setLocalProducts(updatedProducts);
    setIsEditing(false);
    setCurrentProduct({ name: '', price: '', category: 'Clothing', description: '', image: '' });
  };

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      const updated = products.filter(p => p._id !== id);
      setProducts(updated);
      setLocalProducts(updated);
    }
  };

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h2>Admin Dashboard</h2>
        {!isEditing && (
          <button className="btn-primary" onClick={() => { setIsEditing(true); setCurrentProduct({ name: '', price: '', category: 'Clothing', description: '', image: '' }); }}>
            <Plus size={18} style={{marginRight: '8px'}}/> Add New Product
          </button>
        )}
      </div>

      {isEditing && (
        <div className="checkout-card slide-up" style={{marginBottom: '3rem'}}>
          <h3>{currentProduct._id ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group" style={{flex: 2}}>
                <label>Product Name</label>
                <input type="text" required value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>Price (₹)</label>
                <input type="number" required value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex: 1}}>
                <label>Category</label>
                <select value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}>
                  <option value="Clothing">Clothing</option>
                  <option value="Bakery">Bakery</option>
                </select>
              </div>
              <div className="form-group" style={{flex: 2}}>
                <label>Image URL / Path</label>
                <input type="text" placeholder="/images/filename.jpg" value={currentProduct.image} onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" required value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
            </div>
            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
              <button type="submit" className="btn-primary">Save Product</button>
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container slide-up">
        <table className="table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>
                  <img src={p.image || '/images/placeholder.jpg'} alt={p.name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px'}} />
                </td>
                <td style={{fontWeight: '500'}}>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{p.price}</td>
                <td>
                  <button className="nav-icon" style={{display: 'inline-block', marginRight: '10px'}} onClick={() => { setCurrentProduct(p); setIsEditing(true); }}>
                    <Edit size={18} color="var(--accent-color)" />
                  </button>
                  <button className="nav-icon" style={{display: 'inline-block'}} onClick={() => handleDelete(p._id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Auth = ({ setUser, isLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Seamless Mock Login
    const mockUser = { name: formData.email.split('@')[0], email: formData.email, role: formData.email === 'admin@blendedbasket.com' ? 'admin' : 'user' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
    navigate('/');
  };

  return (
    <div className="container">
      <div className="form-container slide-up">
        <h2 style={{textAlign:'center', marginBottom:'1.5rem', fontSize: '2rem'}}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{width:'100%', marginTop:'1.5rem'}}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p style={{textAlign:'center', marginTop:'1.5rem', color: 'var(--text-secondary)'}}>
          <small>Note: Use <b>admin@blendedbasket.com</b> to login as Admin.</small>
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="logo">
          Blended<span className="logo-highlight">Basket</span>
        </Link>
        
        <div className="nav-actions">
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-icon" title="Admin Dashboard"><ShieldCheck size={22}/></Link>
          )}
          
          <Link to="/cart" className="nav-cart">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          
          {user ? (
            <div className="user-menu">
              <Link to="/orders" className="nav-icon" title="My Orders"><Package size={22} /></Link>
              <button onClick={logout} className="nav-icon" title="Logout"><LogOut size={22}/></button>
            </div>
          ) : (
            <Link to="/login" className="btn-secondary" style={{padding: '8px 20px'}}>Sign In</Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home addToCart={(p) => {
          setCart(prev => {
            const ext = prev.find(i => i._id === p._id);
            if(ext) return prev.map(i => i._id === p._id ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, {...p, quantity: 1}];
          });
        }}/>} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} user={user} />} />
        <Route path="/login" element={<Auth setUser={setUser} isLogin={true} />} />
        <Route path="/register" element={<Auth setUser={setUser} isLogin={false} />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}
