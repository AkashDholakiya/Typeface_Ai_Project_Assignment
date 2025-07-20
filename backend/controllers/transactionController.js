import { validationResult } from 'express-validator';
import fs from 'fs';
import Transaction from '../models/Transaction.js';
import { extractTextFromImage, extractTextFromPDF, parseReceiptText, deleteFile } from '../utils/fileProcessor.js';

// Create new transaction
export const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const transactionData = {
      ...req.body,
      userId: req.user.id
    };    // Handle file upload if present
    if (req.file) {
      transactionData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    } else if (req.body.receiptFilename) {
      // Handle receipt file that was previously uploaded
      const receiptPath = `uploads/${req.body.receiptFilename}`;
      if (fs.existsSync(receiptPath)) {
        const stats = fs.statSync(receiptPath);
        transactionData.receipt = {
          filename: req.body.receiptFilename,
          originalName: req.body.receiptFilename,
          path: receiptPath,
          size: stats.size,
          mimetype: req.body.receiptFilename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
        };
      }
    }

    const transaction = await Transaction.create(transactionData);
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transaction creation'
    });
  }
};

// Get all transactions with filtering and pagination
export const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user.id };

    // Add search functionality
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (category) query.category = { $regex: category, $options: 'i' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Get total count
    const totalCount = await Transaction.countDocuments(query);

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .select('-__v');

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
          hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
          hasPrevPage: pageNumber > 1
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transactions retrieval'
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transaction retrieval'
    });
  }
};

// Update transaction
export const updateTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transaction update'
    });
  }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Delete associated file if exists
    if (transaction.receipt && transaction.receipt.path) {
      deleteFile(transaction.receipt.path);
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transaction deletion'
    });
  }
};

// Upload and process receipt
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let extractedText = '';
    let parsedData = {};

    try {
      // Extract text based on file type
      if (req.file.mimetype === 'application/pdf') {
        extractedText = await extractTextFromPDF(req.file.path);
      } else if (req.file.mimetype.startsWith('image/')) {
        extractedText = await extractTextFromImage(req.file.path);
      }

      // Parse the extracted text
      if (extractedText) {
        parsedData = parseReceiptText(extractedText);
      }    
    } catch (error) {
      console.error('Receipt processing error:', error);
      // Continue with file upload even if processing fails
    }

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded and processed successfully',
      data: {
        extractedText,
        parsedData,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    
    if (req.file) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Server error during receipt upload'
    });
  }
};

// Get transaction statistics
export const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    // Use req.user._id which is the ObjectId from the user document
    const userId = req.user._id;
    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const totalStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Category stats (both income and expenses)
    const categoryStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          type: { $first: '$type' }
        }
      },
      { $sort: { total: -1 } }
    ]);        
    
    // Time-based trends
    let timeGrouping;
    let sortStage;
    let addFieldsStage;
    
    switch (period) {      
      case 'week':
        timeGrouping = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        sortStage = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
        addFieldsStage = {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d', 
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              }
            }
          },
          dayOfWeek: {
            $dayOfWeek: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            }
          }
        };
      break;
      case 'quarter':
        timeGrouping = {
          year: { $year: '$date' },
          quarter: { $ceil: { $divide: [{ $month: '$date' }, 3] } }
        };
        sortStage = { '_id.year': 1, '_id.quarter': 1 };
        addFieldsStage = {
          _id: { 
            $concat: [
              { $toString: '$_id.year' }, 
              '-Q', 
              { $toString: { $ifNull: ['$_id.quarter', 1] } }
            ] 
          }
        };
      break;
      case 'year':
        timeGrouping = {
          year: { $year: '$date' }
        };
        sortStage = { '_id.year': 1 };
        addFieldsStage = {
          _id: { $toString: '$_id.year' }
        };
        break;      
      case 'all':
        // For "all" period, group by months to show all historical data
        timeGrouping = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        sortStage = { '_id.year': 1, '_id.month': 1 };
        addFieldsStage = {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          }
        };
       break;
      default: 
        timeGrouping = {
          year: { $year: '$date'},
          month: { $month: '$date'}
        };
        sortStage = { '_id.year': 1, '_id.month': 1 };
        addFieldsStage = {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          }
        };
    }

    const timeStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: timeGrouping,
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          count: { $sum: 1 }
        }
      },
      ...(Object.keys(sortStage).length > 0 ? [{ $sort: sortStage }] : []),
      {
        $addFields: addFieldsStage
      }
    ]);    
    
    const result = {
      totalStats: totalStats || [],
      categoryStats: categoryStats || [],
      monthlyStats: timeStats || [] // Keep the same field name for compatibility
    };
 
    res.json({ 
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during statistics retrieval'
    });
  }
};
