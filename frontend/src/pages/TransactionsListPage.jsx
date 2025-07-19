import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import Header from '../components/Header';
import { fetchTransactions, deleteTransaction } from '../store/slices/transactionSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { formatCurrency } from '../utils/helpers';
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    TrendingUp,
    TrendingDown,
    Edit,
    Trash2,
    Calendar,
    DollarSign
} from 'lucide-react';

const TransactionsListPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { transactions, loading, pagination } = useSelector(state => state.transactions);
    const { categories } = useSelector(state => state.categories);    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        category: 'all',
        sortBy: 'date',
        sortOrder: 'desc'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Fetch categories on mount
    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);    // Debounce search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(filters.search);
            setCurrentPage(1); // Reset to first page when search changes
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters.search]);// Fetch transactions when filters change
    useEffect(() => {
        const query = {
            limit: 20,
            page: currentPage,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
        };

        if (debouncedSearch.trim()) {
            query.search = debouncedSearch.trim();
        }

        if (filters.type !== 'all') {
            query.type = filters.type;
        }

        if (filters.category !== 'all') {
            query.category = filters.category;
        }

        console.log('Fetching transactions with query:', query);
        dispatch(fetchTransactions(query));
    }, [dispatch, debouncedSearch, filters.type, filters.category, filters.sortBy, filters.sortOrder, currentPage]);    // Function to refresh transactions (for delete)
    const refreshTransactions = () => {
        const query = {
            limit: 20,
            page: currentPage,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
        };

        if (debouncedSearch.trim()) {
            query.search = debouncedSearch.trim();
        }

        if (filters.type !== 'all') {
            query.type = filters.type;
        }

        if (filters.category !== 'all') {
            query.category = filters.category;
        }        console.log('Refreshing transactions with query:', query);
        dispatch(fetchTransactions(query));
    };

    const handleDeleteTransaction = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await dispatch(deleteTransaction(id)).unwrap();
                refreshTransactions(); // Refresh the list
            } catch (error) {
                console.error('Failed to delete transaction:', error);
            }
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1); // Reset to first page when any filter changes
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            category: 'all',
            sortBy: 'date',
            sortOrder: 'desc'
        });
    };

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/dashboard')}
                                className="mr-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
                                <p className="text-gray-600">
                                    Manage and view all your financial transactions
                                </p>
                            </div>
                        </div>
                        <Link to="/transactions/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Transaction
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Income</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(totalIncome)}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Expenses</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(totalExpenses)}
                                    </p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Net Balance</p>
                                    <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(totalIncome - totalExpenses)}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Search & Filter</CardTitle>
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search transactions..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Type
                                    </label>                 
                                    <Select
                                        value={filters.type}
                                        onValueChange={(value) => handleFilterChange('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {filters.type === 'all' ? 'All Types' :
                                                    filters.type === 'income' ? 'Income' :
                                                        filters.type === 'expense' ? 'Expense' : 'All Types'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Category
                                    </label>                  <Select
                                        value={filters.category}
                                        onValueChange={(value) => handleFilterChange('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {filters.category === 'all' ? 'All Categories' : filters.category}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map(category => (
                                                <SelectItem key={category._id} value={category.name}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Sort By
                                    </label>                  <Select
                                        value={filters.sortBy}
                                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {filters.sortBy === 'date' ? 'Date' :
                                                    filters.sortBy === 'amount' ? 'Amount' :
                                                        filters.sortBy === 'category' ? 'Category' : 'Date'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="amount">Amount</SelectItem>
                                            <SelectItem value="category">Category</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Order
                                    </label>                  <Select
                                        value={filters.sortOrder}
                                        onValueChange={(value) => handleFilterChange('sortOrder', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {filters.sortOrder === 'desc' ? 'Newest First' :
                                                    filters.sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="desc">Newest First</SelectItem>
                                            <SelectItem value="asc">Oldest First</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {showFilters && (
                            <div className="mt-4 flex justify-end">
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transactions ({transactions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading transactions...</p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8">
                                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No transactions found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Try adjusting your filters or add a new transaction
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction._id}
                                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${transaction.type === 'income'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                                }`}>
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp className="h-5 w-5" />
                                                ) : (
                                                    <TrendingDown className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{transaction.category}</p>
                                                <p className="text-sm text-gray-500">
                                                    {transaction.description || 'No description'}
                                                </p>
                                                <p className="text-xs text-gray-400 flex items-center mt-1">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <p className={`font-bold ${transaction.type === 'income'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                            </div>

                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/transactions/${transaction._id}/edit`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteTransaction(transaction._id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}                        
                        
                        {transactions.length > 0 && pagination && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t">
                                <div className="text-sm text-gray-500">
                                    Page {pagination.currentPage} of {pagination.totalPages} 
                                    ({pagination.totalCount} total transactions)
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={!pagination.hasPrevPage}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={!pagination.hasNextPage}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TransactionsListPage;
