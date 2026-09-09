import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi, type Task } from '../services/api';
import { DualListBox } from '../components/DualListBox';

export function TaskFormPage() {
    const { task_name } = useParams<{ task_name?: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(task_name);

    // Form Field State
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [deadline, setDeadline] = useState('');
    const [complete, setComplete] = useState(false);

    // Loaded Tasks State
    const [dbTasks, setDbTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [message, setMessage] = useState('');

    // DualListBox Relationship States
    const [isPartOf, setIsPartOf] = useState<string[]>([]);
    const [dependsOn, setDependsOn] = useState<string[]>([]);
    const [blocks, setBlocks] = useState<string[]>([]);
    const [isBlockedBy, setIsBlockedBy] = useState<string[]>([]);

    // Highlight States
    const [hlParentAvail, setHlParentAvail] = useState('');
    const [hlParentSel, setHlParentSel] = useState('');
    const [hlChildAvail, setHlChildAvail] = useState('');
    const [hlChildSel, setHlChildSel] = useState('');
    const [hlBlocksAvail, setHlBlocksAvail] = useState('');
    const [hlBlocksSel, setHlBlocksSel] = useState('');
    const [hlBlockedByAvail, setHlBlockedByAvail] = useState('');
    const [hlBlockedBySel, setHlBlockedBySel] = useState('');

    // Initial Data Fetching
    useEffect(() => {
        const initData = async () => {
            try {
                const tasksRes = await taskApi.getAll();
                setDbTasks(tasksRes.nodes || tasksRes || []);

                if (isEditing && task_name) {
                    const taskData = await taskApi.getByName(task_name);
                    setName(taskData.name || '');
                    setDetails(taskData.details || '');
                    setDeadline(taskData.deadline || '');
                    setComplete(Boolean(taskData.complete));
                    setIsPartOf(taskData.is_part_of || []);
                    setDependsOn(taskData.depends_on || []);
                    setBlocks(taskData.blocks || []);
                    setIsBlockedBy(taskData.is_blocked_by || []);
                }
            } catch (err: any) {
                setMessage(`Error loading page data: ${err.response?.data?.detail || 'Fetch failed'}`);
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, [isEditing, task_name]);

    // Collect all selected items across every relationship box
    const allSelected = useMemo(() => [
        ...isPartOf,
        ...dependsOn,
        ...blocks,
        ...isBlockedBy,
    ], [isPartOf, dependsOn, blocks, isBlockedBy]);

    // Current task name (prevents self-referencing)
    const currentName = task_name || name;

    // Filter available lists: exclude the task itself AND anything selected in ANY box
    const unselectedParents = useMemo(() => {
        return dbTasks.filter(t => t.name !== currentName && !allSelected.includes(t.name));
    }, [dbTasks, currentName, allSelected]);

    const unselectedChildren = useMemo(() => {
        return dbTasks.filter(t => t.name !== currentName && !allSelected.includes(t.name));
    }, [dbTasks, currentName, allSelected]);

    const unselectedBlocks = useMemo(() => {
        return dbTasks.filter(t => t.name !== currentName && !allSelected.includes(t.name));
    }, [dbTasks, currentName, allSelected]);

    const unselectedBlockedBy = useMemo(() => {
        return dbTasks.filter(t => t.name !== currentName && !allSelected.includes(t.name));
    }, [dbTasks, currentName, allSelected]);

    // Unified Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const payload = {
            name,
            details: details || null,
            deadline: deadline || null,
            complete,
            is_part_of: isPartOf,
            depends_on: dependsOn,
            blocks,
            is_blocked_by: isBlockedBy,
        };

        try {
            if (isEditing && task_name) {
                await taskApi.update(task_name, payload);
                setMessage('Task updated successfully!');
                setTimeout(() => navigate(`/tasks/${encodeURIComponent(name)}`), 800);
            } else {
                const res = await taskApi.create(payload);
                setMessage(`Task created successfully! ID: ${res.id}`);
                // Reset inputs on creation
                setName('');
                setDetails('');
                setDeadline('');
                setComplete(false);
                setIsPartOf([]);
                setDependsOn([]);
                setBlocks([]);
                setIsBlockedBy([]);
            }
        } catch (err: any) {
            setMessage(`Error: ${err.response?.data?.detail || 'Operation failed'}`);
        }
    };

    const renderDualList = (
        label: string,
        availableItems: Task[],
        selectedItems: string[],
        hlAvail: string,
        hlSel: string,
        setHlAvail: (v: string) => void,
        setHlSel: (v: string) => void,
        setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>
    ) => (
        <details className="relationship-disclosure" open>
            <summary className="disclosure-summary">{label}</summary>
            <div className="disclosure-content">
                <DualListBox
                    availableLabel="Available Tasks"
                    selectedLabel="Selected Tasks"
                    availableItems={availableItems.map(t => t.name)}
                    selectedItems={selectedItems}
                    highlightedAvailable={hlAvail}
                    highlightedSelected={hlSel}
                    onHighlightAvailable={setHlAvail}
                    onHighlightSelected={setHlSel}
                    onAdd={() => {
                        if (!hlAvail) return;
                        setSelectedItems(prev => [...prev, hlAvail]);
                        setHlAvail('');
                    }}
                    onRemove={() => {
                        if (!hlSel) return;
                        setSelectedItems(prev => prev.filter(n => n !== hlSel));
                        setHlSel('');
                    }}
                />
            </div>
        </details>
    );

    if (isLoading) {
        return <div className="app-container"><p>Loading task details...</p></div>;
    }

    return (
        <div className="app-container">
            <h2>{isEditing ? `Edit Task: ${task_name}` : 'Create Task'}</h2>

            <form onSubmit={handleSubmit} className="task-form">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter task name..."
                    className="task-input"
                    required
                />
                <input
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Enter task details (optional)..."
                    className="task-input"
                />
                <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="task-input"
                />

                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={complete}
                        onChange={(e) => setComplete(e.target.checked)}
                    />
                    Mark as Complete
                </label>

                {renderDualList("Task is part of:", unselectedParents, isPartOf, hlParentAvail, hlParentSel, setHlParentAvail, setHlParentSel, setIsPartOf)}
                {renderDualList("Task depends on:", unselectedChildren, dependsOn, hlChildAvail, hlChildSel, setHlChildAvail, setHlChildSel, setDependsOn)}
                {renderDualList("Task blocks:", unselectedBlocks, blocks, hlBlocksAvail, hlBlocksSel, setHlBlocksAvail, setHlBlocksSel, setBlocks)}
                {renderDualList("Task is blocked by:", unselectedBlockedBy, isBlockedBy, hlBlockedByAvail, hlBlockedBySel, setHlBlockedByAvail, setHlBlockedBySel, setIsBlockedBy)}

                <button type="submit" className="submit-btn">
                    {isEditing ? 'Update Task' : 'Save Task'}
                </button>
            </form>

            {message && <p className="status-message">{message}</p>}
        </div>
    );
}