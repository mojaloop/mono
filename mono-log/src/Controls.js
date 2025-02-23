import React from 'react';

const Controls = ({ filter, setFilter, paused, setPaused, clearMessages }) => {
    return (
        <div className="controls">
            <input
                type="text"
                placeholder="Filter logs"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
            <button onClick={() => setPaused(!paused)}>
                {paused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={clearMessages}>Clear</button>
        </div>
    );
};

export default Controls;