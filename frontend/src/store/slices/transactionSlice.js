import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch transactions';
      return rejectWithValue(message);
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchTransactionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data.data.transaction;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch transaction';
      return rejectWithValue(message);
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data.data.transaction;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create transaction';
      return rejectWithValue(message);
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data.data.transaction;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update transaction';
      return rejectWithValue(message);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/${id}`);
      return id;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete transaction';
      return rejectWithValue(message);
    }
  }
);

export const uploadReceipt = createAsyncThunk(
  'transactions/uploadReceipt',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/upload-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload receipt';
      return rejectWithValue(message);
    }
  }
);

export const fetchTransactionStats = createAsyncThunk(
  'transactions/fetchStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/stats', { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch stats';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  transactions: [],
  selectedTransaction: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  },  stats: {
    totalStats: [],
    categoryStats: [],
    monthlyStats: []
  },
  filters: {
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  },
  uploadProgress: 0
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },    clearSelectedTransaction: (state) => {
      state.selectedTransaction = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch transaction by ID
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })      
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update transaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        state.selectedTransaction = action.payload;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(t => t._id !== action.payload);
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload receipt
      .addCase(uploadReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload.transaction);
      })
      .addCase(uploadReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch stats
      .addCase(fetchTransactionStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTransactionStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  clearSelectedTransaction,
  setUploadProgress 
} = transactionSlice.actions;

export default transactionSlice.reducer;
