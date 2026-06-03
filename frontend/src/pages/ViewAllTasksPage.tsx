import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Step 1: Import MarkerType from @xyflow/react
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface BackendNode {
  id: string;
  name: string;
  details: string | null;
}

interface BackendEdge {
  id: string;
  source: string;
  target: string;
}

interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  style?: React.CSSProperties;
}

// Step 2: Update the FlowEdge interface to include marker and style properties
interface FlowEdge {
  id: string;
  source: string;
  target: string;
  markerEnd?: {
    type: MarkerType;
    color?: string; // Optional: specify a color for the arrow
  };
  style?: React.CSSProperties; // Optional: style the line itself
}

export function ViewAllTasksPage() {
  const navigate = useNavigate(); // Hook to programmatically push new browser paths
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/tasks')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load graph data');
        return res.json();
      })
      .then((data: { nodes: BackendNode[]; edges: BackendEdge[] }) => {
        const mappedNodes = data.nodes.map((node, index) => ({
          id: node.id,
          // Adjusted layout spacing for clearer visualization
          position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
          data: { label: node.name },
          style: { 
            background: '#f0f4f8', 
            border: '1px solid #0066cc', 
            borderRadius: '4px', 
            padding: '10px',
            cursor: 'pointer' // Changes mouse to a hand pointer to indicate it is clickable
          }
        }));

        // Step 3: Modify the mapping logic to add arrowheads (markerEnd)
        const mappedEdges = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          // This creates the arrow at the 'target' end of the line
          markerEnd: {
            type: MarkerType.ArrowClosed, // A solid, closed arrowhead
            color: '#999', // Color of the arrowhead
          },
          style: {
            stroke: '#999',
            strokeWidth: 2,
          }
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges); 
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleNodeClick = (_event: React.MouseEvent, node: FlowNode) => {
    navigate(`/tasks/view/${encodeURIComponent(node.id)}`);
  };

  if (error) return <div className="task-view-error">Error: {error}</div>;
  if (loading) return <div className="task-view-loading">Loading task graph...</div>;

  return (
    <div className="task-view-container" style={{ width: '100%', height: '80vh' }}>
      <h1>All Tasks</h1>
      <div style={{ width: '100%', height: '100%', border: '1px solid #ccc', borderRadius: '8px' }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodeClick={handleNodeClick}
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}