import React, { useEffect, useState } from 'react';
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
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export function ViewAllTasksPage() {
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
        // Map raw database nodes to visual React Flow nodes with grid positions
        const mappedNodes = data.nodes.map((node, index) => ({
          id: node.id,
          // Stagger them basic grid layout for now so they aren't stacked on top of each other
          position: { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
          data: { label: node.name },
          style: { background: '#f0f4f8', border: '1px solid #0066cc', borderRadius: '4px', padding: '10px' }
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

  if (error) return <div className="task-view-error">Error: {error}</div>;
  if (loading) return <div className="task-view-loading">Loading task graph...</div>;

  return (
    <div className="task-view-container" style={{ width: '100%', height: '80vh' }}>
      <h1>All Tasks</h1>
      <div style={{ width: '100%', height: '100%', border: '1px solid #ccc', borderRadius: '8px' }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}