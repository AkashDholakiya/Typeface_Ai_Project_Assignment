# Personal Finance Assistant

A comprehensive personal finance management application that helps users track expenses, manage budgets, analyze spending patterns, and upload receipts through OCR technology.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Demo](#-demo)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)

## ✨ Features

- **User Authentication**: Secure sign-up, login, and password reset functionality
- **Transaction Management**: Add, edit, and delete income and expense transactions
- **Receipt Processing**: Upload and automatically extract transaction data from receipts using OCR technology
- **Dashboard**: Visual overview of financial status with key metrics and recent transactions
- **Advanced Analytics**: Detailed financial analysis with customizable time periods (weekly, monthly, quarterly, yearly)
- **Category Management**: Organize transactions with customizable categories
- **Search & Filter**: Find transactions quickly with powerful search and filtering options
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠 Tech Stack

### Frontend
- React with Vite
- Redux Toolkit for state management
- React Router for navigation
- React Hook Form for form validation
- Recharts for data visualization
- Styled with tailwindcss and ShadCN components

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Tesseract.js for OCR (Optical Character Recognition)
- pdfjs-dist for PDF processing
- RESTful API design

## 🎥 Demo

[Watch the demo video](https://drive.google.com/file/d/1rT-z7h3fjKHi3ZORNPv-CLhNgRUZkMIm/view?usp=sharing)

## 🚀 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/AkashDholakiya/Typeface_Ai_Project_Assignment.git
   cd personal-finance-assistant
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/personal-finance-assistant
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ```

4. Start the backend server
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory
   ```bash
   cd ../frontend
   ```

2. Install frontend dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 📝 Usage

### Creating an Account
1. Navigate to the registration page
2. Enter your details and create a password

### Adding Transactions
1. Click on the "Add Transaction" button from the dashboard or transactions page
2. Fill in transaction details (amount, type, category, date, description)
3. Click "Save" to add the transaction

### Uploading Receipts
1. Click on "Upload Receipt" from the dashboard or transactions page
2. Upload an image of your receipt (supported formats: JPG, PNG, PDF)
3. The system will automatically extract transaction details
4. Review and confirm the extracted information
5. Click "Create Transaction" to save

### Viewing Analytics
1. Navigate to the "Analytics" page
2. Select your desired time period (weekly, monthly, quarterly, yearly, all-time)
3. Explore spending trends, category breakdowns, and financial insights

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login an existing user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Login an existing user
- `POST /api/auth/check-password` - Login an existing user
- `DELETE /api/auth/delete-account` - Login an existing user

### Transaction Endpoints
- `GET /api/transactions` - Get user transactions with filtering/pagination
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get a specific transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction
- `GET /api/transactions/stats` - Get transaction statistics

### Category Endpoints
- `GET /api/categories` - Get user categories

### Receipt Upload Endpoint
- `POST /api/transactions/upload-receipt` - Upload and process receipt

## 🗂 Project Structure

```
personal-finance-assistant/
├── backend/
│   ├── controllers/      
│   ├── middleware/       
│   ├── models/           
│   ├── routes/           
│   ├── utils/            
│   ├── uploads/          
│   ├── .env             
│   └── index.js          
│
├── frontend/
│   ├── public/           
│   ├── src/
│   │   ├── assets/
│   │   ├── components/   
│   │   ├── pages/        
│   │   ├── services/     
│   │   ├── store/        
│   │   ├── utils/               
│   │   ├── App.jsx       
│   │   └── main.jsx      
│   └── index.html        
│
└── README.md             
```
