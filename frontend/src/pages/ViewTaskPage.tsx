import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

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
        if (!res.ok) throw new Error('Task not found in database');
        return res.json();
      })
      .then((data: TaskData) => setTask(data))
      .catch((err) => setError(err.message));
  }, [task_name]);

  if (error) return <div className="task-view-error">Error: {error}</div>;
  if (!task) return <div className="task-view-loading">Loading task data...</div>;

  return (
    <div className="task-view-container">
      <h1>{task.name}</h1>
      <p><strong>Details:</strong> {task.details || 'No details provided'}</p>
      <p><strong>Deadline:</strong> {task.deadline || 'No deadline set'}</p>

      <h3>Is Part Of:</h3>
      {task.is_part_of.length === 0 ? <p className="no-tasks">None</p> : (
        <ul className="task-link-list">
          {task.is_part_of.map((p) => (
            <li key={p}>
              <Link to={`/tasks/${encodeURIComponent(p)}`}>{p}</Link>
            </li>
          ))}
        </ul>
      )}

      <h3>Depends On:</h3>
      {task.depends_on.length === 0 ? <p className="no-tasks">None</p> : (
        <ul className="task-link-list">
          {task.depends_on.map((c) => (
            <li key={c}>
              <Link to={`/tasks/${encodeURIComponent(c)}`}>{c}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}