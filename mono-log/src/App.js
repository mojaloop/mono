import React, { useState, useEffect, useRef } from 'react';
import LogDisplay from './LogDisplay.js';
import { FilterMatchMode } from 'primereact/api/api.esm.js';

const filters = {
    level: { value: '', matchMode: FilterMatchMode.IN },
    context: { value: '', matchMode: FilterMatchMode.IN },
    component: { value: '', matchMode: FilterMatchMode.IN },
    type: { value: '', matchMode: FilterMatchMode.IN },
    method: { value: '', matchMode: FilterMatchMode.IN }
};

const App = () => {
  const [logMessages, setLogMessages] = useState([]);
  const [dropDowns, setDropDowns] = useState({});
  const ws = useRef(null);
  const [reconnect, setReconnect] = useState({})
  const triggerReconnect = () => setTimeout(() => setReconnect({}), 1000);

  useEffect(() => {
    console.log('Connecting to WebSocket...');
    const connection = {
      socket: new WebSocket('//' + window.location.host.replace(':3000', ':8080')),
      reconnect: true
    }
    ws.current = connection;

    connection.socket.onmessage = (event) => {
      let logMessage = event.data;
      try {
        logMessage = JSON.parse(event.data);
      } catch (e) {
        logMessage = { message: event.data };
      }
      if (logMessages.length > 1000) {
        logMessages.pop();
      }
      setDropDowns(prev => {
        Object.keys(filters).forEach(key => {
          if (typeof logMessage[key] === 'string') {
            prev[key] = prev[key] ?? new Set();
            prev[key].add(logMessage[key]);
          }
        });
        return prev;
      });
      setLogMessages((prevMessages) => [logMessage, ...prevMessages]);
    };
    connection.socket.onopen = event => {
      console.log(connection.socket.url, ' connected');
    };
    connection.socket.onclose = event => {
      console.log(connection.socket.url, ' closed');
      if (connection.reconnect) triggerReconnect();
    };
    connection.socket.onerror = event => {
      console.error(connection.socket.url, ' error', event);
    };

    return () => {
      console.log('Cleaning up WebSocket...');
      connection.reconnect = false;
      connection.socket.close();
    };
  }, [reconnect]);

  return (
      <LogDisplay logMessages={logMessages} dropDowns={dropDowns} filters={filters} />
  );
};

export default App;
