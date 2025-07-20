import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import Header from '../components/Header';
import { fetchTransactionStats } from '../store/slices/transactionSlice';
import { formatCurrency } from '../utils/helpers';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    PieChart as PieChartIcon,
    BarChart3,
    Activity
} from 'lucide-react';

const AnalyticsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { stats, loading } = useSelector(state => state.transactions);

    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [viewType, setViewType] = useState('overview');    
    
    useEffect(() => {
        
        const now = new Date();
        let startDate, endDate;        
        switch (selectedPeriod) {        
            case 'week': {
                // This week (Monday to Sunday)
                const startOfWeek = new Date(now);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
                
                startOfWeek.setDate(diff);
                startOfWeek.setHours(0, 0, 0, 0);
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6); // 6 days later
                endOfWeek.setHours(23, 59, 59, 999);
                
                startDate = startOfWeek.toISOString();
                endDate = endOfWeek.toISOString();
                
                break;
            }
                
            case 'month': {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
                break;
            }
                
            case 'quarter': {
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999).toISOString();
                break;
            }
                
            case 'year': {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString();
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
                break;
            }
            case 'all': {
                startDate = null;
                endDate = null;
                break;
            }
                
            default: {
                startDate = null;
                endDate = null;
            }
        }
        console.log('Date range:', { startDate, endDate, period: selectedPeriod });
        
        // Fetch stats with date range (only include dates if they're not null)
        const params = { period: selectedPeriod };
        if (startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }
        
        dispatch(fetchTransactionStats(params));
    }, [dispatch, selectedPeriod]);

    const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316'];

    // Prepare data for charts - with better fallbacks
    const categoryData = (stats && stats.categoryStats) ? stats.categoryStats : [];
    const monthlyData = (stats && stats.monthlyStats) ? stats.monthlyStats : [];
    const totalIncome = (stats && stats.totalStats) ?
        (stats.totalStats.find(s => s._id === 'income')?.total || 0) : 0;

    const totalExpenses = (stats && stats.totalStats) ?
        (stats.totalStats.find(s => s._id === 'expense')?.total || 0) : 0;

    // Check if we have any data
    const hasData = categoryData.length > 0 || monthlyData.length > 0 || totalIncome > 0 || totalExpenses > 0;

    // Prepare pie chart data
    const pieData = categoryData.map(item => ({
        name: item._id,
        value: item.total,
        type: item.type || 'expense'
    }));    // Prepare bar chart data with better period-specific formatting
    const barData = monthlyData.map(item => {
        let label;
        
        // Format label based on the selected period
        if (selectedPeriod === 'all') {
            // For all time view, show month names like normal monthly view
            if (item._id.includes('-')) {
                const date = new Date(item._id + '-01T00:00:00');
                label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else {
                label = item._id;
            }        
        } else if (selectedPeriod === 'week') {
            // For weekly view, show day names
            try {
                const dateParts = item._id.split('-');
                if (dateParts.length === 3) {
                    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1])-1, parseInt(dateParts[2]));
                    label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                } else {
                    label = item._id;
                }
            } catch (error) {
                console.error('Error formatting week date:', error);
                label = item._id;
            }
        } else if (selectedPeriod === 'month') {
            if (item._id.includes('-')) {
                const date = new Date(item._id + '-01T00:00:00');
                label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else {
                label = item._id;
            }        
        } else if (selectedPeriod === 'quarter') {
            // For quarterly view, make it more user-friendly
            if (item._id.includes('-Q')) {
                const parts = item._id.split('-Q');
                const year = parts[0];
                const quarter = parts[1];
                
                // Convert quarter number to a more readable format
                const quarterNames = {
                    '1': 'Jan-Mar',
                    '2': 'Apr-Jun',
                    '3': 'Jul-Sep',
                    '4': 'Oct-Dec'
                };
                
                label = `${quarterNames[quarter]} ${year}`;
            } else {
                label = item._id;
            }
        } else if (selectedPeriod === 'year') {
            // For yearly view, show year
            label = item._id;
        } else {
            label = item._id;
        }
        
        return {
            period: label,
            income: item.income || 0,
            expenses: item.expenses || 0,
            net: (item.income || 0) - (item.expenses || 0)
        };
    });

    const expenseCategories = [...categoryData].filter(c => c.type === 'expense');

    // Calculate insights
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
    const topExpenseCategory = expenseCategories.sort((a, b) => b.total - a.total)[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }
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
                                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                                <p className="text-gray-600">
                                    Insights into your financial patterns and trends
                                </p>
                            </div>
                        </div>            
                        <div className="flex space-x-3">                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-32">
                                    <SelectValue>
                                        {selectedPeriod === 'week' ? 'This Week' :
                                            selectedPeriod === 'month' ? 'This Month' :
                                                selectedPeriod === 'quarter' ? 'This Quarter' :
                                                    selectedPeriod === 'year' ? 'This Year' :
                                                        selectedPeriod === 'all' ? 'All Time' : 'This Month'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="quarter">This Quarter</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={viewType} onValueChange={setViewType}>
                                <SelectTrigger className="w-32">
                                    <SelectValue>
                                        {viewType === 'overview' ? 'Overview' :
                                            viewType === 'categories' ? 'Categories' :
                                                viewType === 'trends' ? 'Trends' : 'Overview'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="overview">Overview</SelectItem>
                                    <SelectItem value="categories">Categories</SelectItem>
                                    <SelectItem value="trends">Trends</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                            <Activity className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {savingsRate}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* No Data State */}
                {!hasData && (
                    <Card className="mb-8">
                        <CardContent className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <BarChart3 className="h-16 w-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Available</h3>
                            <p className="text-gray-600 mb-6">
                                Start by adding some transactions to see your financial analytics and insights.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <Button onClick={() => navigate('/transactions/new')}>
                                    Add Transaction
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/upload')}>
                                    Upload Receipt
                                </Button>
                            </div>
                        </CardContent>
                    </Card>                )}

                {/* Charts based on view type */}
                {hasData && viewType === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChartIcon className="h-5 w-5 mr-2" />
                                    Expense Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData.filter(d => d.type === 'expense')}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>                        {/* Period Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    {selectedPeriod === 'week' ? 'Weekly Trend' :
                                     selectedPeriod === 'month' ? 'Monthly Trend' :
                                     selectedPeriod === 'quarter' ? 'Quarterly Trend' :
                                     selectedPeriod === 'year' ? 'Yearly Trend' :
                                     selectedPeriod === 'all' ? 'Total Overview' : 'Trend'}
                                </CardTitle>
                            </CardHeader>                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="income" fill="#10B981" name="Income" />
                                        <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {hasData && viewType === 'categories' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Category Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Breakdown</CardTitle>
                            </CardHeader>                            <CardContent>
                                <div className="space-y-4">
                                    {[...categoryData]
                                        .sort((a, b) => b.total - a.total)
                                        .map((category, index) => (
                                            <div key={category._id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <span className="font-medium">{category._id}</span>
                                                    <span className={`text-sm px-2 py-1 rounded ${category.type === 'income'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {category.type}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(category.total)}</p>
                                                    <p className="text-sm text-gray-500">{category.count} transactions</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Categories */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Spending Categories</CardTitle>                            </CardHeader>                            <CardContent>                                {expenseCategories.length > 0 ? (
                                    <div>
                                        <ResponsiveContainer width="100%" height={300}>
                                            {(() => {
                                                const chartData = [...categoryData]
                                                    .filter(c => c.type === 'expense')
                                                    .sort((a, b) => b.total - a.total)
                                                    .slice(0, 5);

                                                return (
                                                    <BarChart
                                                        data={chartData}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="_id"
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={80}
                                                        />
                                                        <YAxis />
                                                        <Tooltip
                                                            formatter={(value) => formatCurrency(value)}
                                                            labelFormatter={(label) => `Category: ${label}`}
                                                        />
                                                        <Bar dataKey="total" fill="#EF4444" />
                                                    </BarChart>
                                                );
                                            })()}
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                                        <div className="text-center">
                                            <p className="text-lg font-medium">No expense categories found</p>
                                            <p className="text-sm">Add some expense transactions to see spending categories</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}                
                
                {hasData && viewType === 'trends' && (
                    <div className="grid grid-cols-1 gap-6 mb-8">
                        {/* Period Trends Line Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Activity className="h-5 w-5 mr-2" />
                                    Income vs Expenses Trend - {selectedPeriod === 'week' ? 'Weekly' :
                                                               selectedPeriod === 'month' ? 'Monthly' :
                                                               selectedPeriod === 'quarter' ? 'Quarterly' :
                                                               selectedPeriod === 'year' ? 'Yearly' :
                                                               selectedPeriod === 'all' ? 'All Time' : 'Trend'}
                                </CardTitle>
                            </CardHeader>                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                                        <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                                        <Line type="monotone" dataKey="net" stroke="#8B5CF6" strokeWidth={2} name="Net" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {hasData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2" />
                                Financial Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">Savings Rate</h4>
                                    <p className="text-sm text-blue-700">
                                        You're saving {savingsRate}% of your income.
                                        {savingsRate >= 20 ? ' Great job!' : ' Consider increasing your savings rate.'}
                                    </p>
                                </div>

                                {topExpenseCategory && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-red-900 mb-2">Top Expense Category</h4>
                                        <p className="text-sm text-red-700">
                                            {topExpenseCategory._id} accounts for {formatCurrency(topExpenseCategory.total)}&nbsp;of your expenses this period.
                                        </p>
                                    </div>
                                )}

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-green-900 mb-2">Monthly Average</h4>
                                    <p className="text-sm text-green-700">
                                        Your average monthly net is {formatCurrency(netBalance / Math.max(monthlyData.length, 1))}.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
