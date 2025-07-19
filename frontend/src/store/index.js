import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import transactionSlice from './slices/transactionSlice';
import categorySlice from './slices/categorySlice';

const store = configureStore({
  reducer: {
    auth: authSlice,
    transactions: transactionSlice,
    categories: categorySlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});

export default store;
