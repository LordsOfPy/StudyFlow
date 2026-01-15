import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pen, Undo, Trash2, Download } from 'lucide-react';

interface CanvasNoteProps {
    initialData?: string; // Data URL
    onChange?: (dataUrl: string) => void;
    width?: number;
    height?: number;
}

export function CanvasNote({ initialData, onChange, width = 800, height = 400 }: CanvasNoteProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [mode, setMode] = useState<'draw' | 'erase'>('draw');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set initial properties
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';

        // Load initial data if present
        if (initialData) {
            const img = new Image();
            img.src = initialData;
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
        } else {
            // Fill white background for correct export
            ctx.fillRect(0, 0, width, height);
        }
    }, [initialData, width, height]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = mode === 'erase' ? '#ffffff' : color;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && onChange) {
            onChange(canvas.toDataURL());
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        if (onChange) onChange(canvas.toDataURL());
    };

    return (
        <div className="flex flex-col gap-2 border rounded-lg p-2 bg-background shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b">
                <Button
                    variant={mode === 'draw' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('draw')}
                >
                    <Pen className="h-4 w-4 mr-2" />
                    Draw
                </Button>
                <Button
                    variant={mode === 'erase' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('erase')}
                >
                    <Eraser className="h-4 w-4 mr-2" />
                    Erase
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    title="Color"
                />
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(parseInt(e.target.value))}
                    className="w-24 ml-2"
                    title="Brush Size"
                />
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={clearCanvas}>
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    Clear
                </Button>
            </div>
            <div className="overflow-hidden rounded border bg-white cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="touch-none w-full h-full"
                />
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Basic Handwriting Canvas (Mouse/Touch supported)
            </div>
        </div>
    );
}
