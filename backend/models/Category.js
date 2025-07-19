import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: ['income', 'expense'],
    lowercase: true
  },
  icon: {
    type: String,
    default: '📊'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  subcategories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      default: '📝'
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
