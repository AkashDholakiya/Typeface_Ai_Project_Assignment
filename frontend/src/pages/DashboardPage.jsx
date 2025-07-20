import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchTransactions, fetchTransactionStats } from '../store/slices/transactionSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Header from '../components/Header';
import { formatCurrency } from '../utils/helpers';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Receipt,
    Calendar,
    PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { transactions, stats, loading } = useSelector(state => state.transactions);

    useEffect(() => {
        // Fetch fresh data whenever dashboard is accessed
        dispatch(fetchTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' }));
        dispatch(fetchTransactionStats({}));
        dispatch(fetchCategories());
    }, [dispatch, location.pathname]); 

    // More robust data extraction
    const totalIncome = (stats && stats.totalStats) ?
        (stats.totalStats.find(s => s._id === 'income')?.total || 0) : 0;
    const totalExpenses = (stats && stats.totalStats) ?
        (stats.totalStats.find(s => s._id === 'expense')?.total || 0) : 0;
    const netBalance = totalIncome - totalExpenses;

    const recentTransactions = transactions.slice(0, 5);
    const hasData = transactions.length > 0 || totalIncome > 0 || totalExpenses > 0;    
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }
    
    // Error boundary protection
    try {
        return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard
                            </h1>
                            <p className="text-gray-600">
                                Here's your financial overview
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Link to="/transactions/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Transaction
                                </Button>
                            </Link>
                            <Link to="/upload">
                                <Button variant="outline">
                                    <Receipt className="h-4 w-4 mr-2" />
                                    Upload Receipt
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalIncome)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(totalExpenses)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netBalance)}
                            </div>
                        </CardContent>
                    </Card>        
                </div>

                {!hasData && (
                    <Card className="mb-8">
                        <CardContent className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <DollarSign className="h-16 w-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Your Personal Finance Assistant!</h3>
                            <p className="text-gray-600 mb-6">
                                Get started by adding your first transaction or uploading a receipt to track your finances.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <Link to="/transactions/new">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Your First Transaction
                                    </Button>
                                </Link>
                                <Link to="/upload">
                                    <Button variant="outline">
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Upload Receipt
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {hasData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <Link to="/transactions">
                                        <Button variant="outline" size="sm">
                                            View All
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {recentTransactions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No transactions yet</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Add your first transaction to get started
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recentTransactions.map((transaction) => (
                                            <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-2 rounded-full ${transaction.type === 'income'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-red-100 text-red-600'
                                                        }`}>
                                                        {transaction.type === 'income' ? (
                                                            <TrendingUp className="h-4 w-4" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{transaction.category}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {transaction.description || 'No description'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-medium ${transaction.type === 'income'
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                        }`}>
                                                        {transaction.type === 'income' ? '+' : '-'}
                                                        {formatCurrency(transaction.amount)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(transaction.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/transactions/new">
                                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                                            <Plus className="h-6 w-6 mb-2" />
                                            <span>Add Transaction</span>
                                        </Button>
                                    </Link>

                                    <Link to="/upload">
                                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                                            <Receipt className="h-6 w-6 mb-2" />
                                            <span>Upload Receipt</span>
                                        </Button>
                                    </Link>

                                    <Link to="/analytics">
                                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                                            <PieChart className="h-6 w-6 mb-2" />
                                            <span>View Analytics</span>
                                        </Button>
                                    </Link>

                                    <Link to="/transactions">
                                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                                            <Calendar className="h-6 w-6 mb-2" />
                                            <span>All Transactions</span>
                                        </Button>
                                    </Link>              
                                </div>
                            </CardContent>                        
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
    } catch (renderError) {
        console.error('DashboardPage render error:', renderError);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                    <p className="text-gray-600 mb-4">There was an error loading the dashboard.</p>
                    <Button onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                </div>
            </div>
        );
    }
};

export default DashboardPage;
