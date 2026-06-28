import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  type: string;
}

interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  className?: string;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  className?: string; // Replaced raw inline styles with a dynamic class name assignment
  markerEnd?: {
    type: MarkerType;
  };
}

export function ViewAllTasksPage() {
  const navigate = useNavigate();
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
          position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
          data: { label: node.name },
          className: 'task-graph-node'
        }));

        const mappedEdges = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          // Applies semantic CSS classes directly to the edge elements instead of JS style injection
          className: edge.type === 'blocking' ? 'task-edge-blocking' : 'task-edge-depends',
          markerEnd: {
            type: MarkerType.ArrowClosed
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
    navigate(`/tasks/${encodeURIComponent(node.id)}`);
  };

  if (error) return <div className="task-view-error">Error: {error}</div>;
  if (loading) return <div className="task-view-loading">Loading task graph...</div>;

  return (
    <div className="task-view-container graph-container-viewport">
      <h1>All Tasks</h1>
      <div className="graph-canvas-frame">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
          nodesConnectable={false}
          nodesDraggable={false}
          autoPanOnConnect={false}
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}