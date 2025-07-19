import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import Header from '../components/Header';
import { createTransaction, updateTransaction, fetchTransactionById } from '../store/slices/transactionSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';

const TransactionFormPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const isEditing = !!id;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { categories } = useSelector(state => state.categories);
    const { selectedTransaction, loading } = useSelector(state => state.transactions);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Get pre-filled data from receipt upload
    const preFilledData = location.state?.preFilledData;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            type: 'expense',
            amount: '',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        }
    });

    const watchedType = watch('type');   
    
    useEffect(() => {
        dispatch(fetchCategories());
        if (isEditing) {
            dispatch(fetchTransactionById(id));
        }
    }, [dispatch, id, isEditing]);

    // Separate effect for handling prefilled data after categories are loaded
    useEffect(() => {
        if (preFilledData && !isEditing && categories.length > 0) {
            console.log('Setting up form with receipt data and loaded categories...');
            
            // Pre-fill merchant as description and try to auto-categorize
            if (preFilledData.merchant) {
                setValue('description', `Receipt from: ${preFilledData.merchant}`);
                
                // Try to find matching category based on merchant name
                const merchantLower = preFilledData.merchant.toLowerCase();
                const matchingCategory = categories.find(cat => 
                    cat.type === 'expense' && (
                        cat.name.toLowerCase().includes(merchantLower) ||
                        merchantLower.includes(cat.name.toLowerCase())
                    )
                );
                
                if (matchingCategory) {
                    console.log('Found matching category:', matchingCategory.name);
                    setValue('category', matchingCategory.name);
                } else {
                    // Try to categorize based on common merchant types
                    const merchantCategories = {
                        'food': ['restaurant', 'cafe', 'food', 'dining', 'kitchen', 'pizza', 'burger', 'coffee'],
                        'groceries': ['market', 'grocery', 'store', 'supermarket', 'walmart', 'target'],
                        'gas': ['gas', 'fuel', 'petrol', 'station', 'shell', 'exxon', 'bp'],
                        'shopping': ['mall', 'retail', 'shop', 'amazon', 'ebay'],
                        'entertainment': ['cinema', 'movie', 'theater', 'entertainment', 'netflix']
                    };
                    
                    for (const [categoryType, keywords] of Object.entries(merchantCategories)) {
                        if (keywords.some(keyword => merchantLower.includes(keyword))) {
                            const foundCategory = categories.find(cat => 
                                cat.type === 'expense' && cat.name.toLowerCase().includes(categoryType)
                            );
                            if (foundCategory) {
                                console.log('Auto-categorized to:', foundCategory.name);
                                setValue('category', foundCategory.name);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }, [preFilledData, categories, isEditing, setValue]);    
    
    useEffect(() => {
        if (isEditing && selectedTransaction) {
            setValue('type', selectedTransaction.type);
            setValue('amount', selectedTransaction.amount);
            setValue('category', selectedTransaction.category);
            setValue('description', selectedTransaction.description || '');
            
            // Format date properly to avoid timezone issues
            const transactionDate = new Date(selectedTransaction.date);
            const year = transactionDate.getFullYear();
            const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
            const day = String(transactionDate.getDate()).padStart(2, '0');
            setValue('date', `${year}-${month}-${day}`);

        } else if (preFilledData && !isEditing) {
            console.log('Pre-filling basic form data from receipt:', preFilledData);
            
            if (preFilledData.amount) {
                setValue('amount', preFilledData.amount.toString());
            }
            
            if (preFilledData.date) {
                console.log('Setting prefilled date:', preFilledData.date);
                setValue('date', preFilledData.date);
            }
            
            if (preFilledData.merchant) {
                setValue('description', `Receipt from: ${preFilledData.merchant}`);
            }
        }
    }, [selectedTransaction, setValue, isEditing, preFilledData]);

    const filteredCategories = categories.filter(cat => cat.type === watchedType);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setError('');        
        try {
            const transactionData = {
                ...data,
                amount: parseFloat(data.amount)
            };

            // Include receipt data if available from receipt upload
            if (preFilledData && preFilledData.filename) {
                transactionData.receiptFilename = preFilledData.filename;
                transactionData.extractedFromReceipt = true;
            }

            if (isEditing) {
                await dispatch(updateTransaction({ id, data: transactionData })).unwrap();
            } else {
                await dispatch(createTransaction(transactionData)).unwrap();
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && isEditing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading transaction...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="bg-white shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/dashboard')}
                            className="mr-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                            </h1>
                            <p className="text-gray-600">
                                {isEditing ? 'Update your transaction details' : 'Record a new income or expense'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2" />
                            Transaction Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">                            

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
          
                            <div className="space-y-2">
                                <Label htmlFor="type">Transaction Type</Label>
                                <Select
                                    value={watchedType}
                                    onValueChange={(value) => setValue('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transaction type">
                                            {watchedType === 'income' ? 'Income' : watchedType === 'expense' ? 'Expense' : ''}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Income</SelectItem>
                                        <SelectItem value="expense">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register('amount', {
                                        required: 'Amount is required',
                                        min: { value: 0.01, message: 'Amount must be greater than 0' }
                                    })}
                                />
                                {errors.amount && (
                                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                                )}
                            </div>                            

                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={watch('category')}
                                    onValueChange={(value) => setValue('category', value)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category">
                                            {watch('category') || ''}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCategories.map(category => (
                                            <SelectItem key={category._id} value={category.name}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input
                                    type="hidden"
                                    {...register('category', {
                                        required: 'Please select a category'
                                    })}
                                />
                                {errors.category && (
                                    <p className="text-sm text-red-600">{errors.category.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    {...register('date', {
                                        required: 'Date is required'
                                    })}
                                />
                                {errors.date && (
                                    <p className="text-sm text-red-600">{errors.date.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Add a description for this transaction..."
                                    rows={3}
                                    {...register('description')}
                                />
                            </div>

                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="min-w-[120px]"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <Save className="h-4 w-4 mr-2" />
                                            {isEditing ? 'Update' : 'Save'} Transaction
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TransactionFormPage;
