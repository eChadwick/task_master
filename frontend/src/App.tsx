import { useState, useEffect, Children } from 'react';
import axios from 'axios';
import './App.css'; // Make sure this path matches your file structure

interface Task {
  name: string;
  details?: string | null;
  deadline?: string | null;
}

function App() {
  const [taskName, setTaskName] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [message, setMessage] = useState('');
  const [dbTasks, setDbTasks] = useState<Task[]>([]);
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [highlightedAvailableParent, sethighlightedAvailableParent] = useState<string>('');
  const [highlightedSelectedParent, sethighlightedSelectedParent] = useState<string>('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [highlightedAvailableChild, setHighlightedAvailableChild] = useState<string>('');
  const [highlightedSelectedChild, setHighlightedSelectedChild] = useState<string>('');

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await axios.get('http://localhost:8000/api/tasks');
        setDbTasks(response.data);
      } catch (error) {
        console.error("Failed to fetch live tasks:", error);
      }
    }
    fetchTasks();
  }, []);

  const unselectedParents = dbTasks.filter(
    task => !selectedParents.includes(task.name) && !selectedChildren.includes(task.name)
  );

  const handleSelectParent = () => {
    if (!highlightedAvailableParent) return;
    setSelectedParents(prev => [...prev, highlightedAvailableParent]);
    sethighlightedAvailableParent('');
  };

  const handleDeselectParent = () => {
    if (!highlightedSelectedParent) return;
    setSelectedParents(prev => prev.filter(name => name !== highlightedSelectedParent));
    sethighlightedSelectedParent('');
  };

  const unselectedChildren = dbTasks.filter(
    task => !selectedChildren.includes(task.name) && !selectedParents.includes(task.name)
  );

  const handleSelectChild = () => {
    if (!highlightedAvailableChild) return;
    setSelectedChildren(prev => [...prev, highlightedAvailableChild]);
    setHighlightedAvailableChild('');
  };

  const handleDeselectChild = () => {
    if (!highlightedSelectedChild) return;
    setSelectedChildren(prev => prev.filter(name => name !== highlightedSelectedChild));
    setHighlightedSelectedChild('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const response = await axios.post('http://localhost:8000/api/tasks', {
        name: taskName,
        details: taskDetails || null,
        deadline: taskDeadline || null,
        parents: selectedParents,
        children: selectedChildren
      });

      setMessage(`Success! Database ID: ${response.data.id}`);
      setTaskName('');
      setTaskDetails('');
      setTaskDeadline('');
      setSelectedParents([]);
      setSelectedChildren([]);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || 'Something went wrong'}`);
      console.error(error);
    }
  };

  return (
    <div className="app-container">
      <h2>Graph Database Task Slice</h2>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Enter task name..."
          className="task-input"
        />
        <input
          type="text"
          value={taskDetails}
          onChange={(e) => setTaskDetails(e.target.value)}
          placeholder="Enter task details (optional)..."
          className="task-input"
        />
        <input
          type="date"
          value={taskDeadline}
          onChange={(e) => setTaskDeadline(e.target.value)}
          className="task-input"
        />

        <h3 className="form-title">Task is part of:</h3>

        <div className="picker-container">

          {/* Left Side: Available Tasks */}
          <div className="list-wrapper">
            <label className="list-label">Available Tasks</label>
            <select
              size={6}
              className="task-select"
              value={highlightedAvailableParent || undefined}
              onChange={(e) => sethighlightedAvailableParent(e.target.value)}
            >
              {unselectedParents.map(task => (
                <option key={task.name} value={task.name}>{task.name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button
              type="button"
              onClick={handleSelectParent}
              disabled={!highlightedAvailableParent}
              className="action-btn"
            >
              Add ➔
            </button>
            <button
              type="button"
              onClick={handleDeselectParent}
              disabled={!highlightedSelectedParent}
              className="action-btn"
            >
              ⬅ Remove
            </button>
          </div>

          {/* Right Side: Selected Parent Tasks */}
          <div className="list-wrapper">
            <label className="list-label">Selected Parents</label>
            <select
              size={6}
              className="task-select"
              value={highlightedSelectedParent || undefined}
              onChange={(e) => sethighlightedSelectedParent(e.target.value)}
            >
              {selectedParents.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="form-title">Task depends on:</h3>
        <div className="picker-container">
          <div className="list-wrapper">
            <label className="list-label">Available Tasks</label>
            <select
              size={6}
              className="task-select"
              value={highlightedAvailableChild || undefined}
              onChange={(e) => setHighlightedAvailableChild(e.target.value)}
            >
              {unselectedChildren.map(task => (
                <option key={task.name} value={task.name}>{task.name}</option>
              ))}
            </select>
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={handleSelectChild}
              disabled={!highlightedAvailableChild}
              className="action-btn"
            >
              Add ➔
            </button>
            <button
              type="button"
              onClick={handleDeselectChild}
              disabled={!highlightedSelectedChild}
              className="action-btn"
            >
              ⬅ Remove
            </button>
          </div>

          <div className="list-wrapper">
            <label className="list-label">Selected Children</label>
            <select
              size={6}
              className="task-select"
              value={highlightedSelectedChild || undefined}
              onChange={(e) => setHighlightedSelectedChild(e.target.value)}
            >
              {selectedChildren.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn">Save to Graph</button>
      </form>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}

export default App;