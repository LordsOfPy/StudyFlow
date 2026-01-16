import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Youtube,
    Twitch,
    Users,
    Maximize2,
    Minimize2,
    BookOpen,
    X,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { NoteEditor } from '@/components/notes/NoteEditor';

// --- MOCK DATA (Using Real YouTube IDs) ---
interface Stream {
    id: string;
    videoId: string; // YouTube Video ID
    title: string;
    creator: string;
    platform: 'youtube' | 'twitch';
    viewers: number;
    tags: string[];
    thumbnail: string;
    type: 'lofi' | 'gongbang' | 'ambient' | 'pomodoro';
}

const MOCK_STREAMS: Stream[] = [
    {
        id: '1',
        videoId: 'jfKfPfyJRdk',
        title: 'lofi hip hop radio - beats to relax/study to',
        creator: 'Lofi Girl',
        platform: 'youtube',
        viewers: 45200,
        tags: ['Music', 'Animation', 'Relax'],
        thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
        type: 'lofi'
    },
    {
        id: '2',
        videoId: '4xDzrJKXOOY',
        title: 'synthwave radio - beats to chill/game to',
        creator: 'Lofi Girl',
        platform: 'youtube',
        viewers: 12500,
        tags: ['Synthwave', 'Sci-Fi'],
        thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/maxresdefault.jpg',
        type: 'lofi'
    },
    {
        id: '3',
        videoId: 'mPZkdNFkNps',
        title: 'Cozy Cabin Ambience with Heavy Rain',
        creator: 'Cozy Rain',
        platform: 'youtube',
        viewers: 890,
        tags: ['Nature', 'Rain', 'Ambient'],
        thumbnail: 'https://img.youtube.com/vi/mPZkdNFkNps/maxresdefault.jpg',
        type: 'ambient'
    },
    {
        id: '4',
        videoId: '9FvvbVI5rYA', // Pomodoro study
        title: 'Study With Me - 2.5 Hours - Pomodoro',
        creator: 'Merve',
        platform: 'youtube',
        viewers: 1200,
        tags: ['Pomodoro', 'Real-time', 'Study'],
        thumbnail: 'https://img.youtube.com/vi/9FvvbVI5rYA/maxresdefault.jpg',
        type: 'pomodoro'
    },
    {
        id: '5',
        videoId: '5qap5aO4i9A', // Lofi 
        title: 'lofi hip hop radio - beats to sleep/chill to',
        creator: 'Lofi Girl',
        platform: 'youtube',
        viewers: 30000,
        tags: ['Sleep', 'Chill'],
        thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg',
        type: 'lofi'
    }
];

export default function StudyLive() {
    const [activeStream, setActiveStream] = useState<Stream | null>(null);
    const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'lofi' | 'ambient' | 'pomodoro'>('all');

    // Player State
    const [showNotes, setShowNotes] = useState(false);
    const [dimMode, setDimMode] = useState(false);

    const filteredStreams = MOCK_STREAMS.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(filter.toLowerCase()) ||
            s.creator.toLowerCase().includes(filter.toLowerCase());
        const matchesTab = activeTab === 'all' || s.type === activeTab;
        return matchesSearch && matchesTab;
    });

    if (activeStream) {
        return (
            <div className={cn("fixed inset-0 z-50 bg-black flex flex-col", dimMode ? "opacity-90" : "opacity-100")}>
                {/* Top Bar (Overlay) */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4">
                        <Button variant="ghost" className="text-white hover:bg-white/10 gap-2" onClick={() => setActiveStream(null)}>
                            <X className="h-5 w-5" /> Leave Session
                        </Button>
                        <div className="text-white">
                            <h3 className="font-semibold text-lg drop-shadow-md">{activeStream.title}</h3>
                            <p className="text-xs text-white/70">{activeStream.creator} • {activeStream.viewers.toLocaleString()} watching</p>
                        </div>
                    </div>

                    <div className="pointer-events-auto flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10"
                            onClick={() => setDimMode(!dimMode)}
                            title="Dim Screen"
                        >
                            {dimMode ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant={activeStream.platform === 'youtube' ? 'destructive' : 'default'} // Style badge basically
                            size="sm"
                            className="pointer-events-none"
                        >
                            {activeStream.platform === 'youtube' ? <Youtube className="h-4 w-4 mr-2" /> : <Twitch className="h-4 w-4 mr-2" />}
                            LIVE
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Main Video Stream */}
                    <div className={`flex-1 relative bg-black transition-all ${showNotes ? 'w-2/3' : 'w-full'}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${activeStream.videoId}?autoplay=1&controls=1&modestbranding=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full object-cover"
                            ></iframe>
                        </div>

                        {/* Floating Controls / Timer Overlay */}
                        <div className="absolute bottom-8 left-8 z-10 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl w-80 text-white">
                            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                                <span className="font-display font-bold">Focus Timer</span>
                                <Badge variant="outline" className="border-white/20 text-white">Overlay</Badge>
                            </div>
                            {/* We might need a transparent/dark version of PomodoroTimer, 
                       or just a simplified view. Reusing component but styled via parent class? 
                       PomodoroTimer uses card styles. Let's mock a simple timer here for better aesthetics or reuse active timer state.
                       For now, let's just use the real component but wrapped.
                   */}
                            <div className="scale-90 origin-left">
                                <PomodoroTimer minimal={true} />
                            </div>
                        </div>

                        {/* Notes Toggle */}
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full shadow-lg h-12 w-12 bg-background/80 backdrop-blur"
                                onClick={() => setShowNotes(!showNotes)}
                            >
                                {showNotes ? <X className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Side Panel (Notes) */}
                    {showNotes && (
                        <div className="w-[400px] border-l bg-background border-border flex flex-col h-full animate-in slide-in-from-right duration-300">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-semibold">Quick Notes</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowNotes(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <NoteEditor
                                    note={null}
                                    folders={[]}
                                    allNotes={[]}
                                    onSave={() => { }}
                                    onBack={() => { }}
                                    isNew={true}
                                />
                                {/* Note: NoteEditor expects full props, simplified here for "Quick Note" usage. 
                            Ideally we'd have a simplified NoteTaker component.
                        */}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 pb-12">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </div>
                            Study Live
                        </h1>
                        <p className="text-muted-foreground mt-1">Join ambient study sessions with people around the world.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search streams..."
                                className="pl-9"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Tags / Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button
                        variant={activeTab === 'all' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('all')}
                        className="rounded-full"
                    >
                        All Streams
                    </Button>
                    <Button
                        variant={activeTab === 'lofi' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('lofi')}
                        className="rounded-full"
                    >
                        🎵 Lofi Beats
                    </Button>
                    <Button
                        variant={activeTab === 'pomodoro' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('pomodoro')}
                        className="rounded-full"
                    >
                        ⏱️ Pomodoro
                    </Button>
                    <Button
                        variant={activeTab === 'ambient' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('ambient')}
                        className="rounded-full"
                    >
                        🌧️ Ambient
                    </Button>
                </div>

                {/* Stream Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredStreams.map(stream => (
                        <div
                            key={stream.id}
                            className="group relative rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setActiveStream(stream)}
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video w-full bg-muted relative overflow-hidden">
                                <img
                                    src={stream.thumbnail}
                                    alt={stream.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />

                                {/* Live Badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    LIVE
                                </div>

                                {/* Viewers Badge */}
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {stream.viewers.toLocaleString()}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">{stream.title}</h3>
                                    <div className="shrink-0">
                                        {stream.platform === 'youtube' && <Youtube className="h-4 w-4 text-red-600" />}
                                        {stream.platform === 'twitch' && <Twitch className="h-4 w-4 text-purple-600" />}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{stream.creator}</span>
                                    <div className="flex gap-1">
                                        {stream.tags.slice(0, 2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] px-1 h-5">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Hover ACTION */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Button className="rounded-full px-8 font-semibold shadow-xl scale-95 group-hover:scale-100 transition-transform">
                                    Join Session
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredStreams.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>No streams found matching your criteria.</p>
                        <Button variant="link" onClick={() => { setFilter(''); setActiveTab('all'); }}>Clear Filters</Button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
