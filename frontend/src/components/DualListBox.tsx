import React from 'react';

interface DualListBoxProps {
  title: string;
  availableLabel: string;
  selectedLabel: string;
  availableItems: string[];
  selectedItems: string[];
  highlightedAvailable: string;
  highlightedSelected: string;
  onHighlightAvailable: (value: string) => void;
  onHighlightSelected: (value: string) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export const DualListBox: React.FC<DualListBoxProps> = ({
  title,
  availableLabel,
  selectedLabel,
  availableItems,
  selectedItems,
  highlightedAvailable,
  highlightedSelected,
  onHighlightAvailable,
  onHighlightSelected,
  onAdd,
  onRemove,
}) => {
  return (
    <>
      <h3 className="form-title">{title}</h3>
      <div className="picker-container">
        
        {/* Available Items */}
        <div className="list-wrapper">
          <label className="list-label">{availableLabel}</label>
          <select
            size={6}
            className="task-select"
            value={highlightedAvailable || undefined}
            onChange={(e) => onHighlightAvailable(e.target.value)}
          >
            {availableItems.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="button-group">
          <button
            type="button"
            onClick={onAdd}
            disabled={!highlightedAvailable}
            className="action-btn"
          >
            Add ➔
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={!highlightedSelected}
            className="action-btn"
          >
            ⬅ Remove
          </button>
        </div>

        {/* Selected Items */}
        <div className="list-wrapper">
          <label className="list-label">{selectedLabel}</label>
          <select
            size={6}
            className="task-select"
            value={highlightedSelected || undefined}
            onChange={(e) => onHighlightSelected(e.target.value)}
          >
            {selectedItems.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};