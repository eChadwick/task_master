import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [taskName, setTaskName] = useState('');
  const [taskDetails, setTaskDetails] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [message, setMessage] = useState('');
  const [dbTasks, setDbTasks] = useState<Task[]>([]);
  const [selectedParents, setSelectedParents] = useState<string[]>([]); // Right side list
  const [highlightedAvailable, setHighlightedAvailable] = useState<string>(''); // Currently clicked on left
  const [highlightedSelected, setHighlightedSelected] = useState<string>(''); // Currently clicked on right

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

  // Move item from left side to right side
  const handleSelectParent = () => {
    if (!highlightedAvailable) return;
    setSelectedParents(prev => [...prev, highlightedAvailable]);
    setHighlightedAvailable(''); // Clear selection highlight
  };

  // Move item from right side back to left side
  const handleDeselectParent = () => {
    if (!highlightedSelected) return;
    setSelectedParents(prev => prev.filter(name => name !== highlightedSelected));
    setHighlightedSelected(''); // Clear selection highlight
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      // Sends the text straight to our running FastAPI backend
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
      setMessage(`Error: ${error.response.data.detail}`);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Graph Database Task Slice</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Enter task name..."
          style={{ padding: '8px', width: '250px', marginRight: '10px' }}
        />
        <br />
        <input
          type="text"
          value={taskDetails}
          onChange={(e) => setTaskDetails(e.target.value)}
          placeholder="Enter task details (optional)..."
          style={{ padding: '8px', width: '250px', marginRight: '10px' }}
        />
        <br />
        <input
          type="date" 
          value={taskDeadline}
          onChange={(e) => setTaskDeadline(e.target.value)}
          style={{ padding: '8px', width: '250px', marginRight: '10px' }}
        />
        <br />
        <h3>Task is part of:</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          
          {/* Left Side: Unselected Tasks */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Available Tasks</label>
            <select
              size={6}
              style={{ width: '200px', height: '120px', padding: '5px' }}
              value={highlightedAvailable || undefined}
              onChange={(e) => setHighlightedAvailable(e.target.value)}
            >
              {unselectedTasks.map(task => (
                <option key={task.name} value={task.name}>{task.name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="button" 
              onClick={handleSelectParent} 
              disabled={!highlightedAvailable}
              style={{ padding: '5px 10px', cursor: 'pointer' }}
            >
              Add ➔
            </button>
            <button 
              type="button" 
              onClick={handleDeselectParent} 
              disabled={!highlightedSelected}
              style={{ padding: '5px 10px', cursor: 'pointer' }}
            >
              ⬅ Remove
            </button>
          </div>

          {/* Right Side: Selected Parent Tasks */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Selected Parents</label>
            <select
              size={6}
              style={{ width: '200px', height: '120px', padding: '5px' }}
              value={highlightedSelected || undefined}
              onChange={(e) => setHighlightedSelected(e.target.value)}
            >
              {selectedParents.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <br />
        <button type="submit" style={{ padding: '8px 16px' }}>Save to Graph</button>
      </form>

      {message && <p style={{ marginTop: '20px', color: 'green' }}>{message}</p>}
    </div>
  );
}

export default App;