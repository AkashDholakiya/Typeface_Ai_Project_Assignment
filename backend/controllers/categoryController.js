import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during categories retrieval'
    });
  }
};

// Initialize default categories
export const initializeDefaultCategories = async () => {
  try {
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories > 0) {
      console.log('Categories already exist, skipping initialization');
      return;
    }

    const defaultCategories = [
      // Income categories
      {
        name: 'Salary',
        type: 'income',
        icon: '💼',
        color: '#10B981',
        isDefault: true
      },
      {
        name: 'Freelance',
        type: 'income',
        icon: '💻',
        color: '#059669',
        isDefault: true
      },
      {
        name: 'Investment',
        type: 'income',
        icon: '📈',
        color: '#047857',
        isDefault: true
      },
      {
        name: 'Other Income',
        type: 'income',
        icon: '💰',
        color: '#065F46',
        isDefault: true
      },
      
      // Expense categories
      {
        name: 'Food & Dining',
        type: 'expense',
        icon: '🍕',
        color: '#EF4444',
        subcategories: [
          { name: 'Restaurant', icon: '🍽️' },
          { name: 'Groceries', icon: '🛒' },
          { name: 'Fast Food', icon: '🍟' },
          { name: 'Coffee', icon: '☕' }
        ],
        isDefault: true
      },
      {
        name: 'Transportation',
        type: 'expense',
        icon: '🚗',
        color: '#F59E0B',
        subcategories: [
          { name: 'Gas', icon: '⛽' },
          { name: 'Public Transit', icon: '🚌' },
          { name: 'Taxi/Rideshare', icon: '🚕' },
          { name: 'Parking', icon: '🅿️' }
        ],
        isDefault: true
      },
      {
        name: 'Shopping',
        type: 'expense',
        icon: '🛍️',
        color: '#8B5CF6',
        subcategories: [
          { name: 'Clothing', icon: '👕' },
          { name: 'Electronics', icon: '📱' },
          { name: 'Home & Garden', icon: '🏠' },
          { name: 'Books', icon: '📚' }
        ],
        isDefault: true
      },
      {
        name: 'Entertainment',
        type: 'expense',
        icon: '🎬',
        color: '#EC4899',
        subcategories: [
          { name: 'Movies', icon: '🎥' },
          { name: 'Games', icon: '🎮' },
          { name: 'Sports', icon: '⚽' },
          { name: 'Music', icon: '🎵' }
        ],
        isDefault: true
      },
      {
        name: 'Bills & Utilities',
        type: 'expense',
        icon: '🧾',
        color: '#6B7280',
        subcategories: [
          { name: 'Electricity', icon: '💡' },
          { name: 'Internet', icon: '🌐' },
          { name: 'Phone', icon: '📞' },
          { name: 'Water', icon: '💧' }
        ],
        isDefault: true
      },
      {
        name: 'Healthcare',
        type: 'expense',
        icon: '🏥',
        color: '#DC2626',
        subcategories: [
          { name: 'Doctor', icon: '👨‍⚕️' },
          { name: 'Pharmacy', icon: '💊' },
          { name: 'Dental', icon: '🦷' },
          { name: 'Insurance', icon: '🛡️' }
        ],
        isDefault: true
      },
      {
        name: 'Education',
        type: 'expense',
        icon: '📚',
        color: '#7C3AED',
        subcategories: [
          { name: 'Books', icon: '📖' },
          { name: 'Courses', icon: '🎓' },
          { name: 'Supplies', icon: '✏️' }
        ],
        isDefault: true
      },
      {
        name: 'Travel',
        type: 'expense',
        icon: '✈️',
        color: '#0EA5E9',
        subcategories: [
          { name: 'Flights', icon: '🛫' },
          { name: 'Hotels', icon: '🏨' },
          { name: 'Vacation', icon: '🏝️' }
        ],
        isDefault: true
      },
      {
        name: 'General',
        type: 'expense',
        icon: '📊',
        color: '#6B7280',
        isDefault: true
      }
    ];

    await Category.insertMany(defaultCategories);
    console.log('Default categories initialized successfully');
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};
