🎬 IPTV Streaming Platform
A full-stack web application for streaming IPTV content with secure authentication, real-time media delivery, and comprehensive content management.
Show Image
Show Image
Show Image
Show Image
📋 Table of Contents

✨ Features
Core Functionality

🔐 Secure Authentication - JWT-based authentication system
📺 Live TV Streaming - Real-time streaming with HLS.js support
🎬 Movies & Series - VOD content with category browsing
🎯 Smart Stream Resolution - Automatic format detection and fallback
📱 Responsive Design - Mobile-first UI with Tailwind CSS
🔄 Real-time Transcoding - FFmpeg integration for browser compatibility

Technical Features

🛡️ MongoDB Transactions - ACID compliance for data integrity
🎨 Component-based Architecture - Modular and reusable React components
🚀 RESTful API - Clean and documented API endpoints
🔒 Middleware Security - Arcjet integration for rate limiting
📊 Error Handling - Centralized error management
🎛️ Xtream Codes Integration - Full API support

🛠️ Tech Stack
Frontend

React 18 - UI framework
Vite - Build tool and dev server
Tailwind CSS - Utility-first CSS framework
Axios - HTTP client
HLS.js - HTTP Live Streaming player
JWT-decode - Token management
React Icons - Icon library

Backend

Node.js - Runtime environment
Express.js - Web framework
MongoDB - Database
Mongoose - ODM for MongoDB
JWT - Authentication
Bcrypt - Password hashing
Axios - HTTP client
Arcjet - Security middleware

🏗️ Architecture
┌─────────────────────────────────────────────────────────────┐
│                         Client (React)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │    Live    │  │   Movies   │  │   Series   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (JWT)
┌───────────────────────────▼─────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │   xTream     │  │  Connection  │     │
│  │  Controller  │  │  Controller  │  │  Controller  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
┌───────────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
│    MongoDB       │ │   Xtream    │ │    FFmpeg      │
│   (Mongoose)     │ │  Codes API  │ │  (Transcoding) │
└──────────────────┘ └─────────────┘ └────────────────┘
