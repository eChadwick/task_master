import React from 'react';
import { useParams } from 'react-router-dom';

export function ViewTaskPage() {
  // Pulls the "task_name" parameter directly out of the browser's URL bar
  const { task_name } = useParams<{ task_name: string }>();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>View Task Page</h1>
      <p>Target Task Name from URL: <strong>{task_name}</strong></p>
    </div>
  );
}