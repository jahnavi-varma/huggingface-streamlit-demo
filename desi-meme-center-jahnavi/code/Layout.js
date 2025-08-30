import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Trophy, User as UserIcon, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';

const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Create', icon: PlusSquare, page: 'CreateMeme' },
    { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
    { name: 'Profile', icon: UserIcon, page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            <header className="bg-white shadow-md sticky top-0 z-10 w-full">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                        తెలుగు మీమ్ రీమిక్స్
                    </h1>
                </div>
            </header>

            <main className="flex-grow w-full max-w-4xl mx-auto p-4 mb-20">
                {children}
            </main>

            {/* App Footer */}
            <div className="bg-gray-800 text-white py-4 mb-16 text-center">
                <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2">
                    <span className="text-sm">© 2025 Telugu Meme Remix | Made for Meme Lovers</span>
                    <Heart className="w-4 h-4 text-purple-400 fill-current" />
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-md z-10">
                <nav className="max-w-4xl mx-auto flex justify-around">
                    {navItems.map((item) => {
                        const url = createPageUrl(item.page);
                        const isActive = location.pathname === url;
                        return (
                            <Link
                                key={item.name}
                                to={url}
                                className={`flex-1 flex flex-col items-center justify-center p-2 text-sm transition-colors duration-200 ${
                                    isActive
                                        ? 'text-orange-500'
                                        : 'text-gray-500 hover:text-orange-400'
                                }`}
                            >
                                <item.icon className="w-6 h-6 mb-1" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </footer>
        </div>
    );
}