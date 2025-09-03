import React, { useEffect, useRef } from 'react';
import { HTMLGraph } from '../analytics/htmlObjectAnalyzer';

interface NetworkGraphProps {
  graph: HTMLGraph;
  width?: number;
  height?: number;
  className?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  type: string;
  semanticRole?: string;
}

interface Link {
  source: Node;
  target: Node;
  strength: number;
  type: string;
  color: string;
}

export const NetworkGraphViz: React.FC<NetworkGraphProps> = ({
  graph,
  width = 800,
  height = 600,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || !graph.objects.size) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Convert graph data to nodes and links
    const nodeMap = new Map<string, Node>();
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Color mapping for different node types
    const typeColors = {
      interactive: '#ff6b6b',
      media: '#4ecdc4', 
      structural: '#45b7d1',
      content: '#96ceb4',
      data: '#ffeaa7',
      form: '#dda0dd',
      other: '#95a5a6'
    };

    // Create nodes
    Array.from(graph.objects.values()).forEach(obj => {
      const node: Node = {
        id: obj.id,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        radius: Math.max(5, Math.min(20, obj.performance.size / 100)),
        color: typeColors[obj.type as keyof typeof typeColors] || typeColors.other,
        label: obj.tag,
        type: obj.type,
        semanticRole: obj.semanticRole
      };
      nodeMap.set(obj.id, node);
      nodes.push(node);
    });

    // Create links
    graph.relationships.forEach(rel => {
      const source = nodeMap.get(rel.source);
      const target = nodeMap.get(rel.target);
      
      if (source && target) {
        const linkColors = {
          'parent-child': '#34495e',
          'sibling': '#3498db',
          'reference': '#e74c3c',
          'semantic': '#9b59b6',
          'navigation': '#f39c12',
          'content': '#27ae60'
        };

        links.push({
          source,
          target,
          strength: rel.strength,
          type: rel.type,
          color: linkColors[rel.type as keyof typeof linkColors] || '#95a5a6'
        });
      }
    });

    // Physics simulation parameters
    const forceStrength = 0.02;
    const damping = 0.99;
    const repulsionStrength = 1000;
    const linkStrength = 0.1;
    const centerStrength = 0.001;

    let isRunning = true;

    // Animation loop
    const animate = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      // Apply forces
      nodes.forEach(node => {
        // Center force
        const centerX = width / 2;
        const centerY = height / 2;
        node.vx += (centerX - node.x) * centerStrength;
        node.vy += (centerY - node.y) * centerStrength;

        // Repulsion between nodes
        nodes.forEach(other => {
          if (node === other) return;
          
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (distance < 100) {
            const force = repulsionStrength / (distance * distance);
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        });
      });

      // Link forces
      links.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (distance - 50) * linkStrength * link.strength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        link.source.vx += fx;
        link.source.vy += fy;
        link.target.vx -= fx;
        link.target.vy -= fy;
      });

      // Update positions
      nodes.forEach(node => {
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary constraints
        if (node.x < node.radius) {
          node.x = node.radius;
          node.vx = 0;
        }
        if (node.x > width - node.radius) {
          node.x = width - node.radius;
          node.vx = 0;
        }
        if (node.y < node.radius) {
          node.y = node.radius;
          node.vy = 0;
        }
        if (node.y > height - node.radius) {
          node.y = height - node.radius;
          node.vy = 0;
        }
      });

      // Draw links
      links.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = link.color;
        ctx.lineWidth = Math.max(0.5, link.strength * 3);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // Node border
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node label (for larger nodes)
        if (node.radius > 8) {
          ctx.fillStyle = '#2c3e50';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + 3);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graph, width, height]);

  return (
    <div className={`network-graph-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="network-graph-canvas"
        style={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: 'white'
        }}
      />
      
      {/* Legend */}
      <div className="graph-legend" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Node Types:</div>
        {Object.entries({
          interactive: '#ff6b6b',
          media: '#4ecdc4',
          structural: '#45b7d1',
          content: '#96ceb4',
          data: '#ffeaa7',
          form: '#dda0dd'
        }).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: color,
              marginRight: '8px',
              borderRadius: '50%',
              border: '1px solid #ccc'
            }}></div>
            <span style={{ textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};