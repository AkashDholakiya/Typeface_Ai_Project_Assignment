import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { logoutUser } from '../store/slices/authSlice';
import {
    User,
    LogOut,
    Settings,
    Menu,
    X
} from 'lucide-react';

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    <div className="flex items-center select-none cursor-pointer" onClick={() => navigate('/')}>
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-900">
                                Personal Finance Assistant
                            </h1>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-gray-700">
                            <User className="h-5 w-5" />
                            <span className="text-sm font-medium">
                                Welcome, {user?.username || 'User'}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/settings')}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <Settings className="h-4 w-4 mr-1" />
                                Settings
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <LogOut className="h-4 w-4 mr-1" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </Button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                            <div className="flex items-center space-x-2 text-gray-700 px-3 py-2">
                                <User className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                    Welcome, {user?.username || 'User'}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    navigate('/settings');
                                    setIsMenuOpen(false);
                                }}
                                className="w-full justify-start text-gray-600 hover:text-gray-900"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full justify-start text-gray-600 hover:text-gray-900"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
