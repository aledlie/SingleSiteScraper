import React, { useEffect, useRef, useState } from 'react';
import { Download, Database, Key, Link2, Table } from 'lucide-react';

export interface DatabaseTable {
  name: string;
  schema: Record<string, string>;
  indexes: string[];
  constraints: string[];
  position?: { x: number; y: number };
}

interface DatabaseSchemaVizProps {
  tables: DatabaseTable[];
  width?: number;
  height?: number;
  className?: string;
  onExport?: () => void;
}

export const DatabaseSchemaViz: React.FC<DatabaseSchemaVizProps> = ({
  tables,
  width = 1200,
  height = 800,
  className = "",
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Define relationships based on foreign key constraints
  const getRelationships = () => {
    const relationships: Array<{ from: string; to: string; type: string }> = [];
    
    tables.forEach(table => {
      table.constraints.forEach(constraint => {
        const fkMatch = constraint.match(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/);
        if (fkMatch) {
          relationships.push({
            from: table.name,
            to: fkMatch[2],
            type: 'foreign_key'
          });
        }
      });
    });
    
    return relationships;
  };

  // Calculate optimal table positions
  const calculateTablePositions = (): DatabaseTable[] => {
    const positionedTables = [...tables];
    const centerX = width / 2;
    const centerY = height / 2;
    const tableWidth = 280;
    const tableHeight = 200;
    const padding = 50;

    // Position tables in a circular layout
    const radius = Math.min(width, height) / 3;
    positionedTables.forEach((table, index) => {
      const angle = (index * 2 * Math.PI) / tables.length;
      table.position = {
        x: centerX + Math.cos(angle) * radius - tableWidth / 2,
        y: centerY + Math.sin(angle) * radius - tableHeight / 2
      };
    });

    return positionedTables;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(zoom, zoom);

    const positionedTables = calculateTablePositions();
    const relationships = getRelationships();

    // Draw relationships first (behind tables)
    relationships.forEach(rel => {
      const fromTable = positionedTables.find(t => t.name === rel.from);
      const toTable = positionedTables.find(t => t.name === rel.to);
      
      if (fromTable?.position && toTable?.position) {
        const fromX = fromTable.position.x + 140; // Center of table
        const fromY = fromTable.position.y + 100;
        const toX = toTable.position.x + 140;
        const toY = toTable.position.y + 100;

        // Draw arrow line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 15;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - arrowLength * Math.cos(angle - Math.PI / 6),
          toY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - arrowLength * Math.cos(angle + Math.PI / 6),
          toY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });

    // Draw tables
    positionedTables.forEach(table => {
      if (!table.position) return;

      const isSelected = selectedTable === table.name;
      const tableWidth = 280;
      const tableHeight = Math.max(200, Object.keys(table.schema).length * 25 + 60);

      // Table background
      ctx.fillStyle = isSelected ? '#eff6ff' : '#ffffff';
      ctx.fillRect(table.position.x, table.position.y, tableWidth, tableHeight);

      // Table border
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#e5e7eb';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(table.position.x, table.position.y, tableWidth, tableHeight);

      // Table header
      ctx.fillStyle = isSelected ? '#3b82f6' : '#1f2937';
      ctx.fillRect(table.position.x, table.position.y, tableWidth, 40);

      // Table name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(table.name, table.position.x + tableWidth / 2, table.position.y + 26);

      // Column details
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      
      let yOffset = 60;
      Object.entries(table.schema).forEach(([column, type]) => {
        const isPrimaryKey = type.includes('PRIMARY KEY');
        const isForeignKey = table.constraints.some(c => 
          c.includes(`FOREIGN KEY (${column})`)
        );

        // Key indicator
        if (isPrimaryKey || isForeignKey) {
          ctx.fillStyle = isPrimaryKey ? '#f59e0b' : '#10b981';
          ctx.font = 'bold 10px Arial';
          ctx.fillText(isPrimaryKey ? 'PK' : 'FK', table.position.x + 8, table.position.y + yOffset);
        }

        // Column name
        ctx.fillStyle = '#1f2937';
        ctx.font = isPrimaryKey ? 'bold 12px Arial' : '12px Arial';
        ctx.fillText(column, table.position.x + 30, table.position.y + yOffset);

        // Column type
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px Arial';
        const typeText = type.replace('PRIMARY KEY', '').replace('NOT NULL', '').trim();
        ctx.fillText(typeText, table.position.x + 30, table.position.y + yOffset + 13);

        yOffset += 25;
      });

      // Indexes indicator
      if (table.indexes.length > 0) {
        ctx.fillStyle = '#8b5cf6';
        ctx.font = '10px Arial';
        ctx.fillText(
          `Indexes: ${table.indexes.length}`, 
          table.position.x + 8, 
          table.position.y + tableHeight - 10
        );
      }
    });

    ctx.restore();
  }, [tables, width, height, selectedTable, zoom]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    const positionedTables = calculateTablePositions();
    const clickedTable = positionedTables.find(table => {
      if (!table.position) return false;
      const tableHeight = Math.max(200, Object.keys(table.schema).length * 25 + 60);
      return (
        x >= table.position.x &&
        x <= table.position.x + 280 &&
        y >= table.position.y &&
        y <= table.position.y + tableHeight
      );
    });

    setSelectedTable(clickedTable ? clickedTable.name : null);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'database-schema.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const exportDDL = () => {
    const ddlStatements: string[] = [];
    
    tables.forEach(table => {
      const columns = Object.entries(table.schema)
        .map(([name, type]) => `  ${name} ${type}`)
        .join(',\n');
      
      const constraints = table.constraints.length > 0 
        ? ',\n  ' + table.constraints.join(',\n  ')
        : '';

      ddlStatements.push(
        `CREATE TABLE ${table.name} (\n${columns}${constraints}\n);`
      );

      // Add indexes
      table.indexes.forEach(index => {
        ddlStatements.push(
          `CREATE INDEX idx_${table.name}_${index} ON ${table.name} (${index});`
        );
      });

      ddlStatements.push(''); // Empty line between tables
    });

    const blob = new Blob([ddlStatements.join('\n')], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database-schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`database-schema-viz ${className}`} ref={containerRef}>
      {/* Controls */}
      <div className="schema-controls" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="control-button"
          style={{
            padding: '6px 12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Zoom Out
        </button>
        <span style={{
          padding: '6px 12px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="control-button"
          style={{
            padding: '6px 12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Zoom In
        </button>
        <button
          onClick={handleExport}
          className="export-button"
          style={{
            padding: '6px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Download className="w-4 h-4" />
          PNG
        </button>
        <button
          onClick={exportDDL}
          className="export-button"
          style={{
            padding: '6px 12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Database className="w-4 h-4" />
          SQL
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f8fafc',
          cursor: 'pointer'
        }}
      />

      {/* Legend */}
      <div className="schema-legend" style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '12px',
        minWidth: '200px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Legend</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
          <span>Primary Key (PK)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
          <span>Foreign Key (FK)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Link2 className="w-3 h-3 text-slate-600" />
          <span>Relationship</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '2px' }}></div>
          <span>Indexed Column</span>
        </div>
      </div>

      {/* Table Details Panel */}
      {selectedTable && (
        <div className="table-details" style={{
          position: 'absolute',
          top: '60px',
          right: '10px',
          width: '300px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Table className="w-5 h-5 text-blue-600" />
            <h3 style={{ margin: 0, fontWeight: '600' }}>{selectedTable}</h3>
            <button
              onClick={() => setSelectedTable(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {(() => {
            const table = tables.find(t => t.name === selectedTable);
            if (!table) return null;

            return (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0' }}>
                    Columns ({Object.keys(table.schema).length})
                  </h4>
                  <div style={{ fontSize: '12px', color: '#6b7280', maxHeight: '150px', overflow: 'auto' }}>
                    {Object.entries(table.schema).map(([column, type]) => (
                      <div key={column} style={{ marginBottom: '4px', padding: '4px', background: '#f8fafc', borderRadius: '3px' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{column}</div>
                        <div>{type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {table.indexes.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0' }}>
                      Indexes ({table.indexes.length})
                    </h4>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {table.indexes.map((index, i) => (
                        <div key={i} style={{ padding: '2px 0' }}>{index}</div>
                      ))}
                    </div>
                  </div>
                )}

                {table.constraints.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0' }}>
                      Constraints ({table.constraints.length})
                    </h4>
                    <div style={{ fontSize: '11px', color: '#6b7280', maxHeight: '100px', overflow: 'auto' }}>
                      {table.constraints.map((constraint, i) => (
                        <div key={i} style={{ padding: '2px 0', wordBreak: 'break-word' }}>{constraint}</div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Statistics */}
      <div className="schema-stats" style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '12px',
        textAlign: 'right'
      }}>
        <div>Tables: {tables.length}</div>
        <div>Relationships: {getRelationships().length}</div>
        <div>Total Columns: {tables.reduce((sum, t) => sum + Object.keys(t.schema).length, 0)}</div>
      </div>
    </div>
  );
};