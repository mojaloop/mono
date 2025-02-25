import React, { useState, useEffect, useRef } from 'react';
import LogDisplay from './LogDisplay.js';

const App = () => {
  const [logMessages, setLogMessages] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('//' + window.location.host.replace(':3000', ':8080'));
    ws.current.onmessage = (event) => {
      let logMessage = event.data;
      try {
        logMessage = JSON.parse(event.data);
      } catch (e) {
        logMessage = { message: event.data };
      }
      if (logMessages.length > 1000) {
        logMessages.pop();
      }
      setLogMessages((prevMessages) => [logMessage, ...prevMessages]);
    };

    return () => {
      ws.current.close();
    };
  }, []);

  return (
      <LogDisplay logMessages={logMessages} />
  );
};

export default App;
