import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Note } from '@/types/notes';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
}

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

export function GraphView({ notes, selectedNoteId, onSelectNote }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [search, setSearch] = useState('');
  const animationRef = useRef<number>();

  const isMatch = (node: GraphNode) => {
    if (!search) return true;
    return node.title.toLowerCase().includes(search.toLowerCase());
  };

  // Build edges from backlinks
  const edges = useMemo<GraphEdge[]>(() => {
    const edgeList: GraphEdge[] = [];
    notes.forEach(note => {
      note.backlinks.forEach(targetId => {
        if (notes.some(n => n.id === targetId)) {
          edgeList.push({ source: note.id, target: targetId });
        }
      });
    });
    return edgeList;
  }, [notes]);

  // Initialize nodes
  useEffect(() => {
    const initialNodes: GraphNode[] = notes.map((note, i) => {
      const angle = (2 * Math.PI * i) / notes.length;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
      const connections = edges.filter(e => e.source === note.id || e.target === note.id).length;

      return {
        id: note.id,
        title: note.title.slice(0, 20) + (note.title.length > 20 ? '...' : ''),
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        connections,
      };
    });
    setNodes(initialNodes);
  }, [notes, dimensions, edges]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Simple force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));
        let totalKineticEnergy = 0;

        // Apply forces
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i];

          // Center gravity
          node.vx += (dimensions.width / 2 - node.x) * 0.005;
          node.vy += (dimensions.height / 2 - node.y) * 0.005;

          // Repulsion from other nodes
          for (let j = 0; j < newNodes.length; j++) {
            if (i === j) continue;
            const other = newNodes[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 3000 / (dist * dist);
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }

          // Attraction for connected nodes
          edges.forEach(edge => {
            if (edge.source !== node.id && edge.target !== node.id) return;
            const otherId = edge.source === node.id ? edge.target : edge.source;
            const other = newNodes.find(n => n.id === otherId);
            if (!other) return;

            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            node.vx += dx * 0.02; // Stiffer spring
            node.vy += dy * 0.02;
          });

          // Apply velocity with damping
          node.vx *= 0.85; // Higher friction
          node.vy *= 0.85;
          node.x += node.vx;
          node.y += node.vy;

          // Keep in bounds
          node.x = Math.max(40, Math.min(dimensions.width - 40, node.x));
          node.y = Math.max(40, Math.min(dimensions.height - 40, node.y));

          totalKineticEnergy += node.vx * node.vx + node.vy * node.vy;
        }

        // Stop simulation if energy is low
        if (totalKineticEnergy < 0.1) {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          return newNodes;
        }

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [edges, dimensions]); // Removed nodes.length dependency to avoid rapid resets, rely on edges change

  const getNode = (id: string) => nodes.find(n => n.id === id);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Create some notes with [[backlinks]] to see the graph</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-muted/30 rounded-lg relative overflow-hidden">
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 z-20 w-48">
        <input
          type="text"
          placeholder="Filter nodes..."
          className="w-full px-3 py-1.5 text-xs border rounded shadow-sm bg-background/80 backdrop-blur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0">
        {/* Edges */}
        {edges.map((edge, i) => {
          const source = getNode(edge.source);
          const target = getNode(edge.target);
          if (!source || !target) return null;

          const dim = search && (!isMatch(source) && !isMatch(target));

          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="hsl(var(--primary))"
              strokeOpacity={dim ? 0.05 : 0.3}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const note = notes.find(n => n.id === node.id)!;
        const size = Math.max(8, Math.min(20, 8 + node.connections * 4));
        const match = isMatch(node);

        return (
          <button
            key={node.id}
            onClick={() => onSelectNote(note)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500",
              selectedNoteId === node.id && "z-10"
            )}
            style={{
              left: node.x,
              top: node.y,
              opacity: search && !match ? 0.1 : 1,
              transform: `translate(-50%, -50%) scale(${search && match ? 1.2 : 1})`
            }}
          >
            <div
              className={cn(
                "rounded-full transition-all",
                selectedNoteId === node.id
                  ? "bg-primary shadow-lg"
                  : "bg-primary/60 hover:bg-primary"
              )}
              style={{ width: size, height: size }}
            />
            <span className={cn(
              "absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs whitespace-nowrap",
              (search && match) || selectedNoteId === node.id ? "opacity-100 font-bold bg-background/90 px-1 rounded shadow-sm" : "opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-1 rounded"
            )}>
              {node.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
