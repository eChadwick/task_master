import { useState, useEffect, useMemo } from 'react';
import { taskApi, type Task } from '../services/api';
import { DualListBox } from '../components/DualListBox';

export function CreateTaskPage() {
  // Core Form Fields
  const [taskName, setTaskName] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [message, setMessage] = useState('');
  
  // Loaded state
  const [dbTasks, setDbTasks] = useState<Task[]>([]);

  // Relationship Tracking Arrays
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  // Active UI Selection Highlights
  const [highlightParentAvail, setHighlightParentAvail] = useState('');
  const [highlightParentSel, setHighlightParentSel] = useState('');
  const [highlightChildAvail, setHighlightChildAvail] = useState('');
  const [highlightChildSel, setHighlightChildSel] = useState('');

  // Fetch Logic
  const loadTasks = async () => {
    try {
      const data = await taskApi.getAll();
      setDbTasks(data);
    } catch (error) {
      console.error("Failed to fetch live tasks:", error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Use Memoized selectors to prevent calculation churn on every typing stroke
  const unselectedParents = useMemo(() => {
    return dbTasks.filter(t => !selectedParents.includes(t.name) && !selectedChildren.includes(t.name));
  }, [dbTasks, selectedParents, selectedChildren]);

  const unselectedChildren = useMemo(() => {
    return dbTasks.filter(t => !selectedChildren.includes(t.name) && !selectedParents.includes(t.name));
  }, [dbTasks, selectedParents, selectedChildren]);

  // Submit Operations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const res = await taskApi.create({
        name: taskName,
        details: taskDetails || null,
        deadline: taskDeadline || null,
        parents: selectedParents,
        children: selectedChildren
      });

      setMessage(`Success! Database ID: ${res.id}`);
      await loadTasks();
      
      // Clear all state forms cleanly
      setTaskName('');
      setTaskDetails('');
      setTaskDeadline('');
      setSelectedParents([]);
      setSelectedChildren([]);
    } catch (error: any) {
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

        {/* Parent Relationship List Block */}
        <DualListBox
          title="Task is part of:"
          availableLabel="Available Tasks"
          selectedLabel="Selected Parents"
          availableItems={unselectedParents.map(t => t.name)}
          selectedItems={selectedParents}
          highlightedAvailable={highlightParentAvail}
          highlightedSelected={highlightParentSel}
          onHighlightAvailable={setHighlightParentAvail}
          onHighlightSelected={setHighlightParentSel}
          onAdd={() => {
            if (!highlightParentAvail) return;
            setSelectedParents(prev => [...prev, highlightParentAvail]);
            setHighlightParentAvail('');
          }}
          onRemove={() => {
            if (!highlightParentSel) return;
            setSelectedParents(prev => prev.filter(n => n !== highlightParentSel));
            setHighlightParentSel('');
          }}
        />

        {/* Children Relationship List Block */}
        <DualListBox
          title="Task depends on:"
          availableLabel="Available Tasks"
          selectedLabel="Selected Children"
          availableItems={unselectedChildren.map(t => t.name)}
          selectedItems={selectedChildren}
          highlightedAvailable={highlightChildAvail}
          highlightedSelected={highlightChildSel}
          onHighlightAvailable={setHighlightChildAvail}
          onHighlightSelected={setHighlightChildSel}
          onAdd={() => {
            if (!highlightChildAvail) return;
            setSelectedChildren(prev => [...prev, highlightChildAvail]);
            setHighlightChildAvail('');
          }}
          onRemove={() => {
            if (!highlightChildSel) return;
            setSelectedChildren(prev => prev.filter(n => n !== highlightChildSel));
            setHighlightChildSel('');
          }}
        />

        <button type="submit" className="submit-btn">Save to Graph</button>
      </form>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}
