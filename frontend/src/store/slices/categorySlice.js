import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (type = '', { rejectWithValue }) => {
    try {
      const params = type ? { type } : {};
      const response = await api.get('/categories', { params });
      return response.data.data.categories;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch categories';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  categories: [],
  loading: false,
  error: null
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer;
