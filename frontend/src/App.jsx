import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, User as UserIcon, LogOut, Package, ShieldCheck } from 'lucide-react';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Home = ({ addToCart }) => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  
  useEffect(() => {
    axios.get(`/products${category ? `?category=${category}` : ''}`)
      .then(res => setProducts(res.data))
      .catch(console.error);
  }, [category]);

  return (
    <div className="container">
      <div className="hero">
        <h1>Handcrafted elegance meets <span className="logo-highlight">home-baked comfort.</span></h1>
        <p>Discover a unique storefront where artisanal fashion and freshly baked delights come together.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className={`btn-${category === '' ? 'primary' : 'secondary'}`} onClick={() => setCategory('')}>All</button>
          <button className={`btn-${category === 'Clothing' ? 'primary' : 'secondary'}`} onClick={() => setCategory('Clothing')}>Clothing</button>
          <button className={`btn-${category === 'Bakery' ? 'primary' : 'secondary'}`} onClick={() => setCategory('Bakery')}>Bakery</button>
        </div>
      </div>
      <div className="grid">
        {products.map(p => (
          <div key={p._id} className="card">
            <h3>{p.name}</h3>
            <div className="price">₹{p.price}</div>
            <p>{p.description}</p>
            <button className="btn-secondary" onClick={() => addToCart(p)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Cart = ({ cart, setCart, user }) => {
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateQ = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i._id === id) return { ...i, quantity: Math.max(1, i.quantity + delta) };
      return i;
    }));
  };

  const remove = (id) => setCart(prev => prev.filter(i => i._id !== id));

  const handleCheckout = async () => {
    if (!user) return navigate('/login');
    try {
      const items = cart.map(i => ({ productId: i._id, name: i.name, quantity: i.quantity, price: i.price }));
      await axios.post('/orders', { items, totalAmount: total });
      setCart([]);
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert('Error placing order');
    }
  };

  if (cart.length === 0) return <div className="container" style={{textAlign:'center', paddingTop:'5rem'}}><h2>Your cart is empty</h2></div>;

  return (
    <div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>
      <h2>Your Cart</h2>
      <div style={{marginTop: '2rem'}}>
        {cart.map(item => (
          <div key={item._id} className="cart-item">
            <div>
              <h4>{item.name}</h4>
              <div style={{color: 'var(--text-secondary)'}}>₹{item.price} each</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <button className="btn-secondary" style={{padding:'5px 12px'}} onClick={() => updateQ(item._id, -1)}>-</button>
              <span>{item.quantity}</span>
              <button className="btn-secondary" style={{padding:'5px 12px'}} onClick={() => updateQ(item._id, 1)}>+</button>
              <button className="btn-danger" style={{padding:'5px 12px', marginLeft:'1rem'}} onClick={() => remove(item._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-total">Total: ₹{total}</div>
      <button className="btn-primary" style={{width: '100%', padding: '1rem', fontSize: '1.1rem'}} onClick={handleCheckout}>Place Order</button>
    </div>
  );
};

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = () => {
      axios.get('/orders').then(res => setOrders(res.data)).catch(console.error);
    };
    fetchOrders();
    // Periodic polling for order status
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h2>My Orders</h2>
      <table className="table">
        <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>{o._id.substring(o._id.length - 6)}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
              <td>₹{o.totalAmount}</td>
              <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No orders found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

const Admin = ({ user }) => {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    axios.get('/orders').then(res => setOrders(res.data)).catch(console.error);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (e) {
      alert('Error updating status');
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="container">
      <h2>Admin Dashboard - Order Management</h2>
      <table className="table">
        <thead><tr><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>{o.userId?.name} <br/><small>{o.userId?.email}</small></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
              <td>₹{o.totalAmount}</td>
              <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
              <td>
                <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} style={{padding:'5px'}}>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Auth = ({ setUser, isLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/signin' : '/signup';
      const res = await axios.post(endpoint, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 style={{textAlign:'center', marginBottom:'1.5rem'}}>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input type="text" required onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{width:'100%', marginTop:'1rem'}}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p style={{textAlign:'center', marginTop:'1rem'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"} style={{color: 'var(--accent-color)', fontWeight:'600'}}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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
            <Link to="/admin" className="btn-secondary" style={{padding:'8px 16px', fontSize:'0.9rem'}}><ShieldCheck size={18} style={{marginRight:'5px'}}/> Admin</Link>
          )}
          
          <Link to="/cart" style={{position:'relative', display:'flex', alignItems:'center'}}>
            <ShoppingCart size={24} />
            {cartCount > 0 && <span style={{position:'absolute', top:'-8px', right:'-8px', background:'var(--accent-color)', color:'#fff', borderRadius:'50%', padding:'2px 6px', fontSize:'0.75rem', fontWeight:'bold'}}>{cartCount}</span>}
          </Link>
          
          {user ? (
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <Link to="/orders"><Package size={24} /></Link>
              <button onClick={logout} className="btn-secondary" style={{padding:'8px 16px'}}><LogOut size={16} style={{marginRight:'5px'}}/> Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">Sign In</Link>
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
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} user={user} />} />
        <Route path="/login" element={<Auth setUser={setUser} isLogin={true} />} />
        <Route path="/register" element={<Auth setUser={setUser} isLogin={false} />} />
        <Route path="/orders" element={user ? <Orders user={user} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<Admin user={user} />} />
      </Routes>
    </div>
  );
}
