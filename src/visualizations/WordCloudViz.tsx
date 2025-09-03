import React, { useEffect, useRef } from 'react';

interface WordData {
  text: string;
  value: number;
  color?: string;
}

interface WordCloudProps {
  words: WordData[];
  width?: number;
  height?: number;
  className?: string;
}

export const WordCloudViz: React.FC<WordCloudProps> = ({ 
  words, 
  width = 600, 
  height = 400,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sort words by value (frequency)
    const sortedWords = [...words].sort((a, b) => b.value - a.value);
    
    // Calculate font sizes
    const maxValue = sortedWords[0]?.value || 1;
    const minValue = sortedWords[sortedWords.length - 1]?.value || 1;
    
    const maxFontSize = 48;
    const minFontSize = 12;
    
    // Color palette
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173'
    ];

    // Position words in a spiral pattern
    const centerX = width / 2;
    const centerY = height / 2;
    const placedWords: Array<{x: number, y: number, width: number, height: number}> = [];

    sortedWords.slice(0, 50).forEach((word, index) => {
      const normalizedValue = (word.value - minValue) / (maxValue - minValue);
      const fontSize = minFontSize + (maxFontSize - minFontSize) * normalizedValue;
      
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = word.color || colors[index % colors.length];
      
      const metrics = ctx.measureText(word.text);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      // Try to place word without overlap
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!placed && attempts < maxAttempts) {
        const angle = attempts * 0.5;
        const radius = attempts * 3;
        
        const x = centerX + Math.cos(angle) * radius - textWidth / 2;
        const y = centerY + Math.sin(angle) * radius + textHeight / 2;
        
        // Check bounds
        if (x < 0 || x + textWidth > width || y - textHeight < 0 || y > height) {
          attempts++;
          continue;
        }
        
        // Check collision with placed words
        const rect = { x: x - 5, y: y - textHeight - 5, width: textWidth + 10, height: textHeight + 10 };
        const hasCollision = placedWords.some(placed => 
          rect.x < placed.x + placed.width &&
          rect.x + rect.width > placed.x &&
          rect.y < placed.y + placed.height &&
          rect.y + rect.height > placed.y
        );
        
        if (!hasCollision) {
          ctx.fillText(word.text, x, y);
          placedWords.push(rect);
          placed = true;
        }
        
        attempts++;
      }
      
      // If couldn't place without collision, place anyway
      if (!placed) {
        const fallbackX = (index % 10) * (width / 10);
        const fallbackY = Math.floor(index / 10) * 30 + 30;
        ctx.fillText(word.text, fallbackX, fallbackY);
      }
    });
  }, [words, width, height]);

  return (
    <div className={`word-cloud-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="word-cloud-canvas"
        style={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: 'white'
        }}
      />
    </div>
  );
};