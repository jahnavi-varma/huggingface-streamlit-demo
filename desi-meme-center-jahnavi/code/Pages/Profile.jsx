import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Meme } from '@/entities/Meme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Image as ImageIcon } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [myMemes, setMyMemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                // Fix: Filter by user email (created_by is automatically set to user's email)
                const userMemes = await Meme.filter({ created_by: currentUser.email }, '-created_date');
                setMyMemes(userMemes);
            } catch (error) {
                // Not logged in, redirect or show message
                await User.login(); // Force login
            }
            setIsLoading(false);
        };
        loadUserData();
    }, []);

    const handleLogout = async () => {
        await User.logout();
        window.location.reload(); // Reload to clear state
    };
    
    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const { file_url } = await UploadFile({ file });
            await User.updateMyUserData({ profilePicture: file_url });
            setUser(prev => ({ ...prev, profilePicture: file_url }));
        } catch (error) {
            console.error("Failed to upload profile picture:", error);
            alert("Failed to update profile picture. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="items-center text-center">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <Skeleton className="h-6 w-40 mt-4" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!user) {
        return <div className="text-center p-8">Please log in to see your profile.</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="items-center text-center">
                    <div className="relative">
                        <Avatar className="w-24 h-24 text-4xl">
                            <AvatarImage src={user.profilePicture} alt={user.full_name} />
                            <AvatarFallback>{user.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <label htmlFor="profile-pic-upload" className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border shadow-sm cursor-pointer hover:bg-gray-100">
                             <ImageIcon className="w-4 h-4 text-gray-600" />
                             <Input id="profile-pic-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange}/>
                        </label>
                    </div>
                    <CardTitle className="mt-4">{user.full_name}</CardTitle>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="mt-2 text-2xl font-bold text-orange-500">{user.points || 0} points</div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <Button onClick={handleLogout} variant="outline" className="w-full max-w-xs">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Memes</CardTitle>
                </CardHeader>
                <CardContent>
                    {myMemes.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {myMemes.map(meme => (
                                <div key={meme.id} className="aspect-square overflow-hidden rounded-lg">
                                    <img src={meme.generatedImageUrl} alt="My meme" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">You haven't created any memes yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
