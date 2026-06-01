import { useState, useEffect } from 'react';
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
  const [highlightedAvailable, setHighlightedAvailable] = useState<string>(''); 
  const [highlightedSelected, setHighlightedSelected] = useState<string>(''); 

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

  const unselectedTasks = dbTasks.filter(task => !selectedParents.includes(task.name));

  const handleSelectParent = () => {
    if (!highlightedAvailable) return;
    setSelectedParents(prev => [...prev, highlightedAvailable]);
    setHighlightedAvailable(''); 
  };

  const handleDeselectParent = () => {
    if (!highlightedSelected) return;
    setSelectedParents(prev => prev.filter(name => name !== highlightedSelected));
    setHighlightedSelected(''); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const response = await axios.post('http://localhost:8000/api/tasks', {
        name: taskName,
        details: taskDetails || null,
        deadline: taskDeadline || null,
        parents: selectedParents
      });

      setMessage(`Success! Database ID: ${response.data.id}`);
      setTaskName('');
      setTaskDetails('');
      setTaskDeadline('');
      setSelectedParents([]);
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
              value={highlightedAvailable || undefined}
              onChange={(e) => setHighlightedAvailable(e.target.value)}
            >
              {unselectedTasks.map(task => (
                <option key={task.name} value={task.name}>{task.name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button 
              type="button" 
              onClick={handleSelectParent} 
              disabled={!highlightedAvailable}
              className="action-btn"
            >
              Add ➔
            </button>
            <button 
              type="button" 
              onClick={handleDeselectParent} 
              disabled={!highlightedSelected}
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
              value={highlightedSelected || undefined}
              onChange={(e) => setHighlightedSelected(e.target.value)}
            >
              {selectedParents.map(name => (
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