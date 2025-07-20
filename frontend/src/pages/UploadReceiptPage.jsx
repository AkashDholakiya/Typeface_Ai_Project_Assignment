import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Header from '../components/Header';
import { uploadReceipt } from '../store/slices/transactionSlice';
import {
    ArrowLeft,
    Upload,
    FileText,
    Image,
    X,
    AlertCircle,
    CheckCircle,
    Loader
} from 'lucide-react';

const UploadReceiptPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState('');

    // Add cleanup on component unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear any ongoing operations when component unmounts
            setUploading(false);
            setError('');
        };
    }, []);

    const onDrop = (acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setError('Please select a valid image (PNG, JPG, JPEG) or PDF file under 10MB');
            return;
        }

        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
            setError('');
            setUploadResult(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024 // 10MB
    });

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('receipt', selectedFile);

            const result = await dispatch(uploadReceipt(formData)).unwrap();
            setUploadResult(result);
        } catch (err) {
            setError(err.message || 'Failed to upload receipt');
        } finally {
            setUploading(false);
        }
    };      
    
    const handleCreateTransaction = () => {
        console.log('Creating transaction with data:', uploadResult);
        if (uploadResult && uploadResult.parsedData) {
            // Format date properly to avoid timezone issues
            let formattedDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
            
            if (uploadResult.parsedData.date) {
                try {
                    const dateObj = new Date(uploadResult.parsedData.date);
                    if (!isNaN(dateObj.getTime())) {
                        // Use local date string to avoid UTC conversion issues
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        formattedDate = `${year}-${month}-${day}`;
                        
                        console.log('Original date:', uploadResult.parsedData.date);
                        console.log('Parsed date object:', dateObj);
                        console.log('Formatted date (local):', formattedDate);
                    }
                } catch (error) {
                    console.error('Error formatting date:', error);
                }
            }
            
            // Navigate to transaction form with pre-filled data
            navigate('/transactions/new', {
                state: {
                    preFilledData: {
                        amount: uploadResult.parsedData.amount,
                        date: formattedDate,
                        merchant: uploadResult.parsedData.merchantName,
                        items: uploadResult.parsedData.items || [],
                        filename: uploadResult.filename,
                        rawText: uploadResult.parsedData.rawText
                    }
                }
            });
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setError('');
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) {
            return <Image className="h-8 w-8 text-blue-500" />;
        } else if (file.type === 'application/pdf') {
            return <FileText className="h-8 w-8 text-red-500" />;
        }
        return <FileText className="h-8 w-8 text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];    
    };
    

    // Error boundary protection
    try {
        return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            {/* Page Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-6">                        
                        <Button
                            variant="ghost"                            
                            onClick={() => {
                                try {
                                    // Clear any ongoing operations
                                    setUploading(false);
                                    setError('');
                                    setUploadResult(null);
                                    setSelectedFile(null);
                                    
                                    navigate('/dashboard', { replace: true });
                                } catch (error) {
                                    console.error('Navigation error:', error);
                                    window.location.href = '/dashboard';
                                }
                            }}
                            className="mr-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
                            <p className="text-gray-600">
                                Upload a receipt image or PDF to extract transaction details
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Upload className="h-5 w-5 mr-2" />
                                Upload Receipt
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedFile ? (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">
                                        {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                                    </p>
                                    <p className="text-gray-600 mb-4">or click to select a file</p>
                                    <p className="text-sm text-gray-500">
                                        Supported formats: PNG, JPG, JPEG, PDF (max 10MB)
                                    </p>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            {getFileIcon(selectedFile)}
                                            <div>
                                                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeFile}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {selectedFile.type.startsWith('image/') && (
                                        <div className="mb-4">
                                            <img
                                                src={URL.createObjectURL(selectedFile)}
                                                alt="Receipt preview"
                                                className="max-w-full h-48 object-contain rounded-lg border"
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3">
                                        <Button variant="outline" onClick={removeFile}>
                                            Remove
                                        </Button>
                                        <Button onClick={handleUpload} disabled={uploading}>
                                            {uploading ? (
                                                <div className="flex items-center">
                                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload & Extract
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Error Message */}
                    {error && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="font-medium">Error</p>
                                </div>
                                <p className="text-sm text-red-600 mt-2">{error}</p>
                            </CardContent>
                        </Card>
                    )}                    
                    
                    {/* Upload Result */}
                    {uploadResult && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-green-600">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Receipt Processed Successfully
                                    </CardTitle>
                                </CardHeader>
                            </Card>

                            {uploadResult.parsedData && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Extracted Transaction Data</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Amount</label>
                                                <p className="text-lg font-semibold text-green-600">
                                                    ${uploadResult.parsedData.amount || 'Not detected'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Merchant</label>
                                                <p className="text-lg">
                                                    {uploadResult.parsedData.merchantName || 'Not detected'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Date</label>
                                                <p className="text-lg">
                                                    {uploadResult.parsedData.date 
                                                        ? new Date(uploadResult.parsedData.date).toLocaleDateString()
                                                        : 'Not detected'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Items Count</label>
                                                <p className="text-lg">
                                                    {uploadResult.parsedData.items?.length || 0} items
                                                </p>
                                            </div>
                                        </div>

                                        {uploadResult.parsedData.items && uploadResult.parsedData.items.length > 0 && (
                                            <div className="mt-4">
                                                <label className="text-sm font-medium text-gray-700 mb-2 block">Detected Items</label>
                                                <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                                    {uploadResult.parsedData.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between py-1 text-sm">
                                                            <span>{item.name}</span>
                                                            <span className="font-medium">${item.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end space-x-3 mt-6">
                                            <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                                Done
                                            </Button>
                                            <Button onClick={handleCreateTransaction}>
                                                Create Transaction
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}                    
                    
                    {/* Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tips for Better OCR Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <p>PDFs often provide better text extraction results than images</p>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <p>The system tries multiple OCR configurations for best results</p>
                                </div>                                
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <p>Review extracted data carefully before creating the transaction</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
    } catch (renderError) {
        console.error('UploadReceiptPage render error:', renderError);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                    <p className="text-gray-600 mb-4">There was an error loading the upload page.</p>
                    <Button onClick={() => navigate('/dashboard', { replace: true })}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }
};

export default UploadReceiptPage;
