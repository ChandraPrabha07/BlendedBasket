Project Overview
BlendedBasket is a full-stack e-commerce web application built using the MERN stack
(MongoDB, Express.js, React, Node.js) that serves as a unified online storefront for a
small business combining two verticals — handcrafted clothing and home-baked
goods.
The platform addresses a real-world need for small, home-based entrepreneurs who
operate across multiple product categories but lack a single, professional digital
presence to reach customers. Instead of managing two separate channels or relying
on social media alone, BlendedBasket gives the business owner a centralized,
manageable, and scalable web application.
Purpose & Real-World Impact
This project solves the following real-world challenges:
• Eliminates the need for two separate storefronts for different product
categories.
• Provides a professional digital presence for home-based small business
owners.
• Enables customers to browse, filter, and order products from one seamless
platform.
• Gives the business owner an admin panel to manage inventory and track
orders easily.
• Delivers order status updates in near real-time through periodic polling.
Frontend Development
On the frontend, customers can browse products filtered by category (Clothing or
Baking), view product details, add items to a dynamic cart, and place orders — all
through a clean, responsive React interface built with Vite. State management is
handled using React hooks (useState and useEffect), and all backend communication
is done via Axios.
Key frontend features include:
• Category-based product browsing (Clothing / Baking)
• Dynamic cart with real-time quantity updates
• Order placement and confirmation flow
• Responsive and mobile-friendly UI using React + Vite
• Form validation for login, registration, and order forms

Backend Development
On the backend, a Node.js and Express server exposes a structured REST API
handling products, orders, and users. All data — including product listings, customer
profiles, and order records — is persisted in MongoDB through Mongoose schemas
and models with full CRUD support.
Backend components include:
• Node.js + Express server with modular route structure
• REST API endpoints for Products, Users, and Orders
• Middleware for request validation and error handling
• CRUD operations for all resources
• Mongoose schemas: Product, User, Order
Authentication & Security
The application includes a complete authentication system using JWT (JSON Web
Tokens), allowing customers to register and log in securely, while admin-protected
routes enable the business owner to manage inventory and track incoming orders
without exposing sensitive operations to regular users.
Technology Stack
Frontend: React.js (Vite), Axios, React Hooks (useState, useEffect)
Backend: Node.js, Express.js, REST API
Database: MongoDB, Mongoose ODM
Authentication: JWT (JSON Web Tokens), Protected Routes
Deployment: Vercel (Frontend), Render (Backend)
Order Tracking: Polling-based near real-time status updates
Deployment
The final application is deployed with the React frontend hosted on Vercel and the
Express backend on Render, making it publicly accessible and production-ready. The
deployment demonstrates the ability to configure environment variables, connect a live
MongoDB Atlas database, and manage cross-origin resource sharing (CORS)
between frontend and backend services.
Summary
BlendedBasket demonstrates end-to-end full-stack development competency — from
UI design and component architecture to API development, database integration,
authentication, and cloud deployment — while solving a genuine, practical business
problem. It covers every topic taught in the MERN Stack Internship curriculum and is
designed to achieve the highest evaluation standard across all rubric criteria.
