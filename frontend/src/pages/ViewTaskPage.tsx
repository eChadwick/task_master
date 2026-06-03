import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// A simple interface matching the JSON structure your backend returns
interface TaskData {
  name: string;
  details: string | null;
  deadline: string | null;
  parents: string[];
  children: string[];
}

export function ViewTaskPage() {
  const { task_name } = useParams<{ task_name: string }>();
  const [task, setTask] = useState<TaskData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!task_name) return;

    fetch(`http://localhost:8000/api/tasks/${encodeURIComponent(task_name)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Task not found in database');
        }
        return res.json();
      })
      .then((data: TaskData) => setTask(data))
      .catch((err) => setError(err.message));
  }, [task_name]);

  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  if (!task) return <div style={{ padding: '20px' }}>Loading task data...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{task.name}</h1>
      <p><strong>Details:</strong> {task.details || 'No details provided'}</p>
      <p><strong>Deadline:</strong> {task.deadline || 'No deadline set'}</p>

      <h3>Parents:</h3>
      {task.parents.length === 0 ? <p>None</p> : (
        <ul>
          {task.parents.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      <h3>Children:</h3>
      {task.children.length === 0 ? <p>None</p> : (
        <ul>
          {task.children.map((c) => <li key={c}>{c}</li>)}
        </ul>
      )}
    </div>
  );
}