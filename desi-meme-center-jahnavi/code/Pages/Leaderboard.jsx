import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, Medal, Award } from 'lucide-react';

const LeaderboardItem = ({ user, rank }) => {
    const getRankIcon = () => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
        if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
        return <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
    };
    
    return (
        <div className={`p-4 rounded-lg flex items-center gap-4 ${rank === 1 ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'}`}>
            <div className="flex-shrink-0">{getRankIcon()}</div>
            <Avatar>
                <AvatarImage src={user.profilePicture} alt={user.full_name} />
                <AvatarFallback>{user.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <p className="font-semibold">{user.full_name}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-orange-500">{user.points || 0}</p>
                <p className="text-xs text-gray-500">points</p>
            </div>
        </div>
    );
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const allUsers = await User.list('-points', 100);
            setUsers(allUsers);
            setIsLoading(false);
        };
        fetchUsers();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">Top Meme Creators</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                             <div key={i} className="p-4 rounded-lg flex items-center gap-4 bg-white">
                                <Skeleton className="w-6 h-6" />
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="flex-grow">
                                    <Skeleton className="h-5 w-32" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            </div>
                        ))
                    ) : (
                        users.map((user, index) => (
                            <LeaderboardItem key={user.id} user={user} rank={index + 1} />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}