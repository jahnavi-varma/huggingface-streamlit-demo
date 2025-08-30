import React, { useState, useEffect } from 'react';
import { Meme } from '@/entities/Meme';
import { User } from '@/entities/User';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Download, MessageSquare, Share2, Sparkles, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MemeCard = ({ meme, onUpvote, currentUser }) => {
    const hasUpvoted = meme.upvoters?.includes(currentUser?.id);

    const handleShare = async () => {
        // Check if sharing is supported
        if (!navigator.share) {
            // Fallback for browsers without share API
            try {
                await navigator.clipboard.writeText(meme.generatedImageUrl);
                alert('Meme URL copied to clipboard!');
            } catch (copyErr) {
                alert('Unable to copy link. Please copy manually: ' + meme.generatedImageUrl);
            }
            return;
        }

        // Try to share
        try {
            await navigator.share({
                title: 'Check out this Telugu meme!',
                text: 'Hilarious meme from Telugu Meme Remix App',
                url: meme.generatedImageUrl,
            });
        } catch (err) {
            // Don't show errors for user-initiated cancellations or common permission issues
            if (err.name !== 'AbortError') {
                // Silently fallback to clipboard without showing error messages
                try {
                    await navigator.clipboard.writeText(meme.generatedImageUrl);
                    alert('Meme URL copied to clipboard!');
                } catch (copyErr) {
                    // Only alert if both share and clipboard fail
                    alert('Unable to share. You can manually copy this link: ' + meme.generatedImageUrl);
                }
            }
            // For AbortError (user cancelled), do nothing - this is expected behavior
        }
    };

    const handleDownload = () => {
        fetch(meme.generatedImageUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `meme_${meme.id}.png`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => alert('Failed to download image.'));
    };

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Avatar>
                    <AvatarImage src={meme.creatorProfilePicture} alt={meme.creatorName} />
                    <AvatarFallback>{meme.creatorName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{meme.creatorName}</p>
                    <p className="text-xs text-gray-500">{meme.dialect} Dialect</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <img src={meme.generatedImageUrl} alt="A telugu meme" className="w-full h-auto object-contain bg-gray-200" />
            </CardContent>
            <CardFooter className="p-2 grid grid-cols-3 gap-1">
                <Button variant="ghost" onClick={() => onUpvote(meme.id, hasUpvoted)} className={`flex items-center gap-2 ${hasUpvoted ? 'text-orange-500' : ''}`}>
                    <ThumbsUp className="w-5 h-5" /> 
                    <span>{meme.upvotes}</span>
                </Button>
                <Button variant="ghost" onClick={handleDownload} className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>Save</span>
                </Button>
                <Button variant="ghost" onClick={handleShare} className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function HomePage() {
    const [memes, setMemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [dialectFilter, setDialectFilter] = useState('all');

    useEffect(() => {
        const fetchUserAndMemes = async () => {
            setIsLoading(true);
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (e) {
                // Not logged in
            }
            let fetchedMemes;
            if (dialectFilter === 'all') {
                fetchedMemes = await Meme.list('-created_date', 50);
            } else {
                fetchedMemes = await Meme.filter({ dialect: dialectFilter }, '-created_date', 50);
            }
            setMemes(fetchedMemes);
            setIsLoading(false);
        };
        fetchUserAndMemes();
    }, [dialectFilter]);

    const handleUpvote = async (memeId, hasUpvoted) => {
        if (!currentUser) {
            alert("Please login to upvote!");
            return;
        }

        const meme = memes.find(m => m.id === memeId);
        if (!meme) return;

        const newUpvoters = hasUpvoted
            ? meme.upvoters.filter(id => id !== currentUser.id)
            : [...(meme.upvoters || []), currentUser.id];
        
        const newUpvotes = newUpvoters.length;

        // Optimistic UI update
        setMemes(memes.map(m => 
            m.id === memeId ? { ...m, upvotes: newUpvotes, upvoters: newUpvoters } : m
        ));

        // Update the meme with new upvote data
        await Meme.update(memeId, { upvotes: newUpvotes, upvoters: newUpvoters });

        // Note: Removed creator points update to fix API error
        // The points system can be implemented later with a different approach
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl p-6 md:p-8 text-white text-center shadow-2xl">
                <div className="flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 mr-2" />
                    <h2 className="text-2xl md:text-3xl font-bold">తెలుగు మీమ్ రీమిక్స్</h2>
                    <Sparkles className="w-8 h-8 ml-2" />
                </div>
                <p className="text-lg md:text-xl mb-6 opacity-95 leading-relaxed">
                    Unleash your creativity with Telugu Meme Remix – the ultimate platform for regional meme lovers. 
                    Upload or pick templates, add Telugu captions, tag your dialect, and generate hilarious memes in seconds.
                </p>
                <Link to={createPageUrl('CreateMeme')}>
                    <Button className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-8 py-3 text-lg shadow-lg">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Start Creating Memes!
                    </Button>
                </Link>
            </div>

            {/* Filter Section */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Trending Memes</h3>
                <Select onValueChange={setDialectFilter} defaultValue="all">
                    <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="Filter by Dialect" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Dialects</SelectItem>
                        <SelectItem value="Vizag">Vizag</SelectItem>
                        <SelectItem value="Nellore">Nellore</SelectItem>
                        <SelectItem value="Karimnagar">Karimnagar</SelectItem>
                        <SelectItem value="Rayalaseema">Rayalaseema</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                        <SelectItem value="Godavari">Godavari</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {/* Memes Feed */}
            {isLoading ? (
                <div className="space-y-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="w-full max-w-md mx-auto">
                            <CardHeader className="flex flex-row items-center gap-3 p-4">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </CardHeader>
                            <Skeleton className="h-80 w-full" />
                            <CardFooter className="p-2 grid grid-cols-3 gap-1">
                               <Skeleton className="h-10 w-full" />
                               <Skeleton className="h-10 w-full" />
                               <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : memes.length === 0 ? (
                 <div className="text-center py-16 text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">No memes found!</h2>
                    <p>Be the first one to create a meme.</p>
                    <Link to={createPageUrl('CreateMeme')}>
                        <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                            Create Your First Meme
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {memes.map(meme => (
                        <MemeCard key={meme.id} meme={meme} onUpvote={handleUpvote} currentUser={currentUser} />
                    ))}
                </div>
            )}
        </div>
    );
}
