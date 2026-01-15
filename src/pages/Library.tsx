import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Link, Video, Plus, Search, Tag, ExternalLink } from 'lucide-react';
import { getDocuments, saveDocument, generateId } from '@/lib/storage';
import { LibraryDocument } from '@/types/study';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai';

export default function Library() {
    const [documents, setDocuments] = useState<LibraryDocument[]>([]);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const [newItem, setNewItem] = useState<{
        type: 'pdf' | 'video' | 'link';
        title: string;
        url: string;
        file?: File | null;
    }>({
        type: 'link',
        title: '',
        url: '',
        file: null
    });

    useEffect(() => {
        setDocuments(getDocuments());
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewItem({
                ...newItem,
                title: file.name,
                type: 'pdf',
                file
            });
        }
    };

    const handleSubmit = async () => {
        if (!newItem.title) return;

        let url = newItem.url;

        if (newItem.type === 'pdf' && newItem.file) {
            // Simulate upload by creating object URL
            url = URL.createObjectURL(newItem.file);
            // In real app, upload to storage
        }

        const doc: LibraryDocument = {
            id: generateId(),
            title: newItem.title,
            type: newItem.type,
            url: url,
            summary: "AI Summary pending...",
            tags: [],
            createdAt: new Date()
        };

        // Simulate AI Processing
        setTimeout(async () => {
            // Mock AI summary
            doc.summary = "This document appears to cover advanced concepts in..." + doc.title;
            // Update doc in storage? (Need updateDocument function, or just save new one, but simulating async update is tricky without state refresh. For now just save with placeholder).
        }, 1000);

        saveDocument(doc);
        setDocuments(getDocuments());
        setIsDialogOpen(false);
        setNewItem({ type: 'link', title: '', url: '', file: null });

        toast({
            title: "Item Added",
            description: "Added to library successfully."
        });
    };

    const filteredDocs = documents.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Library</h1>
                        <p className="text-muted-foreground">Manage your study materials, PDFs, and links.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Resource</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={newItem.type === 'pdf' ? 'default' : 'outline'}
                                        onClick={() => setNewItem({ ...newItem, type: 'pdf' })}
                                        className="gap-2"
                                    >
                                        <FileText className="h-4 w-4" /> PDF
                                    </Button>
                                    <Button
                                        variant={newItem.type === 'video' ? 'default' : 'outline'}
                                        onClick={() => setNewItem({ ...newItem, type: 'video' })}
                                        className="gap-2"
                                    >
                                        <Video className="h-4 w-4" /> Video
                                    </Button>
                                    <Button
                                        variant={newItem.type === 'link' ? 'default' : 'outline'}
                                        onClick={() => setNewItem({ ...newItem, type: 'link' })}
                                        className="gap-2"
                                    >
                                        <Link className="h-4 w-4" /> Link
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="Resource Title"
                                    />
                                </div>

                                {newItem.type === 'pdf' ? (
                                    <div className="space-y-2">
                                        <Label>Upload File</Label>
                                        <Input type="file" accept=".pdf" onChange={handleFileUpload} />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>URL</Label>
                                        <Input
                                            value={newItem.url}
                                            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                                <Button onClick={handleSubmit} className="w-full">Save Resource</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search resources..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDocs.map(doc => (
                        <div key={doc.id} className="card-interactive p-4 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="p-2 rounded-lg bg-secondary text-primary">
                                    {doc.type === 'pdf' && <FileText className="h-6 w-6" />}
                                    {doc.type === 'video' && <Video className="h-6 w-6" />}
                                    {doc.type === 'link' && <Link className="h-6 w-6" />}
                                </div>
                                <a href={doc.url} target="_blank" rel="noreferrer">
                                    <Button variant="ghost" size="icon">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </a>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg line-clamp-1">{doc.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {doc.summary || "No description provided."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                <Badge variant="secondary" className="text-xs">
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                </Badge>
                            </div>
                        </div>
                    ))}

                    {filteredDocs.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No resources found. Add some to get started!
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
// Helper for Badge
function Badge({ variant, className, children }: any) {
    return <span className={cn("px-2 py-0.5 rounded text-xs", className, variant === 'secondary' ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground")}>{children}</span>
}
