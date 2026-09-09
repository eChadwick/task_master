import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi, type Task } from '../services/api';
import { DualListBox } from '../components/DualListBox';

export function EditTaskPage() {
    const { task_name } = useParams<{ task_name: string }>();
    const navigate = useNavigate();

    // Core Form Fields
    const [taskName, setTaskName] = useState('');
    const [taskDetails, setTaskDetails] = useState('');
    const [taskDeadline, setTaskDeadline] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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

    // Initial Load: Fetch target task details and overall task list
    useEffect(() => {
        if (!task_name) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [allTasksRes, taskData] = await Promise.all([
                    taskApi.getAll(),
                    taskApi.getByName(task_name)
                ]);

                // Extract nodes array from response (matching CreateTaskPage)
                setDbTasks(allTasksRes.nodes || allTasksRes || []);

                // Populate form fields with existing data
                setTaskName(taskData.name);
                setTaskDetails(taskData.details || '');
                setTaskDeadline(taskData.deadline || '');
                setIsComplete(taskData.complete);

                // Populate existing relationship arrays
                setSelectedParents(taskData.is_part_of || []);
                setSelectedChildren(taskData.depends_on || []);
                setSelectedBlocks(taskData.blocks || []);
                setSelectedBlockedBy(taskData.is_blocked_by || []);
            } catch (error: any) {
                setMessage(`Error loading task: ${error.response?.data?.detail || 'Task not found'}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [task_name]);

    // Collect all assigned task names AND the current task itself to prevent self-referential or duplicate links
    const excludedTasks = useMemo(() => {
        return [
            taskName,
            ...selectedParents,
            ...selectedChildren,
            ...selectedBlocks,
            ...selectedBlockedBy
        ];
    }, [taskName, selectedParents, selectedChildren, selectedBlocks, selectedBlockedBy]);

    // Memoized selectors filtering available tasks
    const unselectedParents = useMemo(() => {
        return dbTasks.filter(t => !excludedTasks.includes(t.name) || selectedParents.includes(t.name));
    }, [dbTasks, excludedTasks, selectedParents]);

    const unselectedChildren = useMemo(() => {
        return dbTasks.filter(t => !excludedTasks.includes(t.name) || selectedChildren.includes(t.name));
    }, [dbTasks, excludedTasks, selectedChildren]);

    const unselectedBlocks = useMemo(() => {
        return dbTasks.filter(t => !excludedTasks.includes(t.name) || selectedBlocks.includes(t.name));
    }, [dbTasks, excludedTasks, selectedBlocks]);

    const unselectedBlockedBy = useMemo(() => {
        return dbTasks.filter(t => !excludedTasks.includes(t.name) || selectedBlockedBy.includes(t.name));
    }, [dbTasks, excludedTasks, selectedBlockedBy]);

    // Submit Operations
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskName.trim() || !task_name) return;

        try {
            await taskApi.update(task_name, {
                name: taskName,
                details: taskDetails || null,
                deadline: taskDeadline || null,
                complete: isComplete,
                is_part_of: selectedParents,
                depends_on: selectedChildren,
                blocks: selectedBlocks,
                is_blocked_by: selectedBlockedBy
            });

            setMessage('Task updated successfully!');
            setTimeout(() => {
                navigate(`/tasks/${encodeURIComponent(taskName)}`);
            }, 800);
        } catch (error: any) {
            setMessage(`Error: ${error.response?.data?.detail || 'Something went wrong'}`);
            console.error(error);
        }
    };

    if (isLoading) return <div className="app-container"><p>Loading task for editing...</p></div>;

    return (
        <div className="app-container">
            <h2>Edit Task: {task_name}</h2>

            <form onSubmit={handleSubmit} className="task-form">
                <label>
                    Task Name:
                    <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        placeholder="Enter task name..."
                        className="task-input"
                    />
                </label>

                <label>
                    Details:
                    <input
                        type="text"
                        value={taskDetails}
                        onChange={(e) => setTaskDetails(e.target.value)}
                        placeholder="Enter task details (optional)..."
                        className="task-input"
                    />
                </label>

                <label>
                    Deadline:
                    <input
                        type="date"
                        value={taskDeadline}
                        onChange={(e) => setTaskDeadline(e.target.value)}
                        className="task-input"
                    />
                </label>

                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={isComplete}
                        onChange={(e) => setIsComplete(e.target.checked)}
                    />
                    Mark as Complete
                </label>

                {/* Parent Relationship List Block */}
                <details className="relationship-disclosure" open>
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
                <details className="relationship-disclosure" open>
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
                <details className="relationship-disclosure" open>
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
                <details className="relationship-disclosure" open>
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

                <button type="submit" className="submit-btn">Update Task</button>
            </form>

            {message && <p className="status-message">{message}</p>}
        </div>
    );
}