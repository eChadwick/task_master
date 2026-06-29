import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedBlockedBy, setSelectedBlockedBy] = useState<string[]>([]);

  // Active UI Selection Highlights
  const [highlightParentAvail, setHighlightParentAvail] = useState('');
  const [highlightParentSel, setHighlightParentSel] = useState('');
  const [highlightChildAvail, setHighlightChildAvail] = useState('');
  const [highlightChildSel, setHighlightChildSel] = useState('');
  const [highlightBlocksAvail, setHighlightBlocksAvail] = useState('');
  const [highlightBlocksSel, setHighlightBlocksSel] = useState('');
  const [highlightBlockedByAvail, setHighlightBlockedByAvail] = useState('');
  const [highlightBlockedBySel, setHighlightBlockedBySel] = useState('');

  // Fetch Logic
  const loadTasks = async () => {
    try {
      const data = await taskApi.getAll();
      setDbTasks(data.nodes);
    } catch (error) {
      console.error("Failed to fetch live tasks:", error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Collect all currently assigned task names to prevent cyclic assignments across boxes
  const allSelected = useMemo(() => {
    return [
      ...selectedParents,
      ...selectedChildren,
      ...selectedBlocks,
      ...selectedBlockedBy
    ];
  }, [selectedParents, selectedChildren, selectedBlocks, selectedBlockedBy]);

  // Memoized selectors filtering out tasks that are already assigned anywhere
  const unselectedParents = useMemo(() => {
    return dbTasks.filter(t => !allSelected.includes(t.name) && !selectedParents.includes(t.name));
  }, [dbTasks, allSelected, selectedParents]);

  const unselectedChildren = useMemo(() => {
    return dbTasks.filter(t => !allSelected.includes(t.name) && !selectedChildren.includes(t.name));
  }, [dbTasks, allSelected, selectedChildren]);

  const unselectedBlocks = useMemo(() => {
    return dbTasks.filter(t => !allSelected.includes(t.name) && !selectedBlocks.includes(t.name));
  }, [dbTasks, allSelected, selectedBlocks]);

  const unselectedBlockedBy = useMemo(() => {
    return dbTasks.filter(t => !allSelected.includes(t.name) && !selectedBlockedBy.includes(t.name));
  }, [dbTasks, allSelected, selectedBlockedBy]);

  // Submit Operations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const res = await taskApi.create({
        name: taskName,
        details: taskDetails || null,
        deadline: taskDeadline || null,
        is_part_of: selectedParents,
        depends_on: selectedChildren,
        blocks: selectedBlocks,
        is_blocked_by: selectedBlockedBy
      });

      setMessage(`Success! Database ID: ${res.id}`);
      await loadTasks();

      // Clear all state forms cleanly
      setTaskName('');
      setTaskDetails('');
      setTaskDeadline('');
      setSelectedParents([]);
      setSelectedChildren([]);
      setSelectedBlocks([]);
      setSelectedBlockedBy([]);
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.detail || 'Something went wrong'}`);
      console.error(error);
    }
  };

  return (
    <div className="app-container">
      <h2>Create Task</h2>

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
        <details className="relationship-disclosure">
          <summary className="disclosure-summary">Task is part of:</summary>
          <div className="disclosure-content">
            <DualListBox
              availableLabel="Available Tasks"
              selectedLabel="Selected Tasks"
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
          </div>
        </details>

        {/* Children Relationship List Block */}
        <details className="relationship-disclosure">
          <summary className="disclosure-summary">Task depends on:</summary>
          <div className="disclosure-content">
            <DualListBox
              availableLabel="Available Tasks"
              selectedLabel="Selected Tasks"
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
          </div>
        </details>

        {/* Blocks Relationship List Block */}
        <details className="relationship-disclosure">
          <summary className="disclosure-summary">Task blocks:</summary>
          <div className="disclosure-content">
            <DualListBox
              availableLabel="Available Tasks"
              selectedLabel="Selected Tasks"
              availableItems={unselectedBlocks.map(t => t.name)}
              selectedItems={selectedBlocks}
              highlightedAvailable={highlightBlocksAvail}
              highlightedSelected={highlightBlocksSel}
              onHighlightAvailable={setHighlightBlocksAvail}
              onHighlightSelected={setHighlightBlocksSel}
              onAdd={() => {
                if (!highlightBlocksAvail) return;
                setSelectedBlocks(prev => [...prev, highlightBlocksAvail]);
                setHighlightBlocksAvail('');
              }}
              onRemove={() => {
                if (!highlightBlocksSel) return;
                setSelectedBlocks(prev => prev.filter(n => n !== highlightBlocksSel));
                setHighlightBlocksSel('');
              }}
            />
          </div>
        </details>

        {/* Is Blocked By Relationship List Block */}
        <details className="relationship-disclosure">
          <summary className="disclosure-summary">Task is blocked by:</summary>
          <div className="disclosure-content">
            <DualListBox
              availableLabel="Available Tasks"
              selectedLabel="Selected Tasks"
              availableItems={unselectedBlockedBy.map(t => t.name)}
              selectedItems={selectedBlockedBy}
              highlightedAvailable={highlightBlockedByAvail}
              highlightedSelected={highlightBlockedBySel}
              onHighlightAvailable={setHighlightBlockedByAvail}
              onHighlightSelected={setHighlightBlockedBySel}
              onAdd={() => {
                if (!highlightBlockedByAvail) return;
                setSelectedBlockedBy(prev => [...prev, highlightBlockedByAvail]);
                setHighlightBlockedByAvail('');
              }}
              onRemove={() => {
                if (!highlightBlockedBySel) return;
                setSelectedBlockedBy(prev => prev.filter(n => n !== highlightBlockedBySel));
                setHighlightBlockedBySel('');
              }}
            />
          </div>
        </details>

        <button type="submit" className="submit-btn">Save to Graph</button>
      </form>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}