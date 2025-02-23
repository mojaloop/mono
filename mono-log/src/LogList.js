import React from 'react';

const LogList = ({ logMessages }) => {
    return (
        <div className="log-list">
            {logMessages.map((msg, index) => (
                <div key={index} className="log-message">
                    {msg}
                </div>
            ))}
        </div>
    );
};

export default LogList;