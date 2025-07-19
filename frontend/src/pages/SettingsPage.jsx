import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import Header from '../components/Header';
import { updateUserProfile, checkPassword, deleteAccount } from '../store/slices/authSlice';
import {
    ArrowLeft,
    Save,
    User,
    Mail,
    Shield,
    Bell,
    Trash2,
    AlertTriangle
} from 'lucide-react';

const SettingsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    useEffect(() => {
        if (user) {
            setFormData({
                username: user?.username || '',
                email: user?.email || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const updateData = {
                username: formData.username,
                email: formData.email
            };

            if(user.username === formData.username && user.email === formData.email && !(formData.newPassword || formData.currentPassword || formData.confirmPassword)) {
                setError('No changes detected. Please update at least one field.');
                return;
            }

            // Handle password change validation
            if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
                if (!formData.currentPassword) {
                    setError('Current password is required to change password');
                    return;
                }

                if (!formData.newPassword || !formData.confirmPassword) {
                    setError('New password and confirmation are required');
                    return;
                }

                if (formData.newPassword !== formData.confirmPassword) {
                    setError('New passwords do not match with confirm password');
                    return;
                }

                if (formData.newPassword.length < 6) {
                    setError('New password must be at least 6 characters');
                    return;
                }

                const passwordCheckResult = await dispatch(checkPassword(formData.currentPassword)).unwrap();
                console.log('Password check result:', passwordCheckResult);

                updateData.password = formData.newPassword;
            }

            await dispatch(updateUserProfile(updateData)).unwrap();
            setSuccess('Profile updated successfully!');

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (err) {
            setError(err || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletePassword) {
            setError('Password is required to delete account');
            return;
        }

        setIsDeletingAccount(true);
        setError('');

        try {
            await dispatch(deleteAccount(deletePassword)).unwrap();
            // Account deleted successfully, redirect to login
            navigate('/login');
        } catch (err) {
            setError(err || 'Failed to delete account');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeletePassword('');
        setError('');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                            <p className="text-gray-600">
                                Manage your account settings and preferences
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                        <p className="text-sm text-green-600">{success}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="Enter your username"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <Shield className="h-5 w-5 mr-2" />
                                        Change Password
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <Input
                                                id="currentPassword"
                                                name="currentPassword"
                                                type="password"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                placeholder="Enter current password"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                name="newPassword"
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                placeholder="Enter new password"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
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
                                                Save Changes
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-red-600">
                                <Trash2 className="h-5 w-5 mr-2" />
                                Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Delete Account</p>
                                        <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                title="Delete Account"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                confirmText="Delete Account"
                cancelText="Cancel"
                confirmVariant="destructive"
                isLoading={isDeletingAccount}
            >
                <div className="space-y-4">
                    <div className="flex items-center p-4 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-red-800">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deletePassword">
                            Enter your password to confirm deletion
                        </Label>
                        <Input
                            id="deletePassword"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default SettingsPage;
