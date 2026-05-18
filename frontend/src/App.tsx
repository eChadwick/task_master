import { useState } from 'react';
import axios from 'axios';

function App() {
  const [taskName, setTaskName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      // Sends the text straight to our running FastAPI backend
      const response = await axios.post('http://localhost:8000/api/tasks', {
        name: taskName
      });
      
      setMessage(`Success! Database ID: ${response.data.id}`);
      setTaskName(''); 
    } catch (error) {
      setMessage(`Error: ${error.response.data.detail}`);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h2>Graph Database Task Slice</h2>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={taskName} 
          onChange={(e) => setTaskName(e.target.value)} 
          placeholder="Enter task name..."
          style={{ padding: '8px', width: '250px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Save to Graph</button>
      </form>

      {message && <p style={{ marginTop: '20px', color: 'green' }}>{message}</p>}
    </div>
  );
}

export default App;