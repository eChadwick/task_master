import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls } from '@xyflow/react';
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

interface FlowEdge {
  id: string;
  source: string;
  target: string;
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
          position: { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
          data: { label: node.name },
          style: { 
            background: '#f0f4f8', 
            border: '1px solid #0066cc', 
            borderRadius: '4px', 
            padding: '10px',
            cursor: 'pointer' // Changes mouse to a hand pointer to indicate it is clickable
          }
        }));

        setNodes(mappedNodes);
        setEdges(data.edges);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // This fires whenever any node container inside the canvas is clicked
  const handleNodeClick = (_event: React.MouseEvent, node: FlowNode) => {
    // Navigates seamlessly to the single task route using the node's unique name id
    navigate(`/tasks/view/${encodeURIComponent(node.id)}`);
  };

  if (error) return <div className="task-view-error">Error: {error}</div>;
  if (loading) return <div className="task-view-loading">Loading task graph...</div>;

  return (
    <div className="task-view-container" style={{ width: '100%', height: '80vh' }}>
      <h1>All Tasks Graph</h1>
      <div style={{ width: '100%', height: '100%', border: '1px solid #ccc', borderRadius: '8px' }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodeClick={handleNodeClick} // Wire up the click listener
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}