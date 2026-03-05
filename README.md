# Nobelian-admin

Nobelian admin is the internal backoffice/administration tool used to manage the Nobelian website and product catalog.

The system allows administrators to manage products, collections, images and website content without modifying the frontend source code.

This project is part of the **Nobelian luxury brand web platform**.

---

# Overview

The Backoffice provides an internal dashboard where administrators can:

* Create and edit products
* Manage product collections
* Upload and manage product images
* Control website content
* Manage inventory (future)
* Manage orders (future)

The tool communicates with the Nobelian backend API which stores data in a database and handles media storage.

---

# System Architecture

The Nobelian platform consists of the following components:

Frontend Website
Displays the public Nobelian website.

Backoffice Admin Panel
Internal admin interface used to manage data.

Backend API
Handles business logic and data processing.

Database
Stores products, collections and user data.

Cloud Storage
Stores product images and media assets.

---

# Technology Stack

Frontend Admin

* React

Backend

* Node.js
* Express.js

Database

* MongoDB Atlas

File Storage

* Cloudflare R2

Version Control

* Git
* GitHub

---

# Project Structure

backend/
API server and business logic

frontend-admin/
Admin user interface

config/
Configuration files

---

# Core Features (MVP)

Product Management

* Create product
* Update product
* Delete product
* Assign product images

Collection Management

* Create collections
* Assign products to collections

Image Management

* Upload images to Cloudflare R2
* Attach images to products

Authentication

* Admin login
* Role-based access (future)

---

# Example API Endpoints

Products

GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

Collections

GET /api/collections
POST /api/collections

Images

POST /api/upload

---

# Development Setup

Clone the repository

git clone https://github.com/your-repo/nobelian-backoffice.git

Install dependencies

npm install

Run the development server

npm run dev

---

# Future Features

* Order management
* Customer database
* Analytics dashboard
* Inventory tracking
* Role based permissions
* Content management system

---

# Project Goal

The goal of the Nobelian Backoffice is to provide a scalable internal platform that allows the Nobelian brand to manage products and website content efficiently while keeping the public website fast and lightweight.
