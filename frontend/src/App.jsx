// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import ChatSection from "./components/ChatSection";
import ActionSection from "./components/ActionSection";
import {
  Brain,
  Search,
  FileText,
  BarChart3,
  Database,
  Sparkles,
} from "lucide-react";

// Icon mapping for different tools
const getIconForTool = (toolName) => {
  if (!toolName || toolName === 'null' || toolName === null) return Brain;
  
  const iconMap = {
    'search_paper': Search,
    'search_web': Search,
    'load_pdf_from_url': FileText,
    'load_document_from_web': FileText,
    'summarize_content': BarChart3,
    'summarize_content_from_urls': BarChart3,
  };
  
  return iconMap[toolName] || Database;
};

// Helper function to check if an object is empty
const isEmptyObject = (obj) => {
  return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actions, setActions] = useState([]); // Single actions array with status
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const wsRef = useRef(null);

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      // Update this URL to match your backend WebSocket endpoint
      wsRef.current = new WebSocket('ws://localhost:8000/ws/query');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnectionStatus('disconnected');
        // Only set isProcessing to false if it wasn't a normal closure
        if (event.code !== 1000) {
          setIsProcessing(false);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const handleWebSocketMessage = (data) => {
    // Handle errors
    if (data.error) {
      const errorMessage = {
        id: Date.now(),
        type: "agent",
        content: `Error: ${data.error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsProcessing(false);
      return;
    }

    // Handle query completion
    if (data.status === 'done') {
      console.log('Query processing completed');
      if(isProcessing){
        setIsProcessing(false)
      }
      return;
    }

    // Handle steps - check if step exists and is not empty
    if (data.step) {
      // Check if step is an empty object
      if (isEmptyObject(data.step)) {
        console.log('Received empty step, query likely completed');
        setIsProcessing(false);
        return;
      }

      // Valid step received - add it as processing
      const step = data.step;
      const stepAction = {
        id: `step-${data.step_number}`,
        action: step.query || 'Processing...',
        icon: getIconForTool(step.tool),
        stepNumber: data.step_number,
        tool: step.tool,
        parameters: step.parameters,
        status: 'processing'
      };

      // Add or update the action
      setActions((prev) => {
        const existingIndex = prev.findIndex(action => action.stepNumber === data.step_number);
        if (existingIndex >= 0) {
          // Update existing action
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...stepAction };
          return updated;
        } else {
          // Add new action
          return [...prev, stepAction];
        }
      });
    }

    // Handle step results
    if (data.result) {
      const result = data.result;
      const stepNumber = data.step_number;
      
      // Update the action status to completed
      setActions((prev) => {
        return prev.map(action => 
          action.stepNumber === stepNumber 
            ? { ...action, status: 'completed' }
            : action
        );
      });

      // Extract the actual result content and add as agent message
      const resultEntries = Object.entries(result);
      if (resultEntries.length > 0) {
        const [query, resultData] = resultEntries[0];
        let content = '';
        
        if (resultData.error) {
          content = `Error: ${resultData.error}`;
        } else if (resultData.result) {
          content = typeof resultData.result === 'string' 
            ? resultData.result 
            : JSON.stringify(resultData.result, null, 2);
        }

        if (content) {
          const agentMessage = {
            id: Date.now() + Math.random(),
            type: "agent",
            content: content,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, agentMessage]);
        }
      }
    }
  };

  // Initialize WebSocket connection on component mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      
    };
  }, []);

  // Auto-reconnect when connection is lost (but not on initial load)
  useEffect(() => {
    if (connectionStatus === 'disconnected' && wsRef.current) {
      const timer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || connectionStatus !== 'connected') return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const queryToSend = input;
    setInput("");
    setIsProcessing(true);
    
    // Clear previous actions
    setActions([]);

    // Send query through WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ query: queryToSend }));
    } else {
      console.error('WebSocket is not connected');
      setIsProcessing(false);
      
      // Try to reconnect
      connectWebSocket();
    }
  };

  // Separate actions by status for the ActionSection component
  const currentActions = actions.filter(action => action.status === 'processing');
  const completedActions = actions.filter(action => action.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black h-[100vh]">
      <Navbar />
      {connectionStatus !== 'connected' && (
        <div className="bg-yellow-900/50 border border-yellow-700/50 text-yellow-200 px-4 py-2 text-center text-sm">
          WebSocket Status: {connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
          {connectionStatus === 'error' && (
            <button 
              onClick={connectWebSocket}
              className="ml-2 px-2 py-1 bg-yellow-700/50 rounded text-xs hover:bg-yellow-600/50"
            >
              Retry
            </button>
          )}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-0 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 h-[calc(100vh-70px)]">
          <div className="lg:col-span-2">
            <ChatSection
              messages={messages}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isProcessing={isProcessing}
            />
          </div>
          <div className="lg:col-span-1">
            <ActionSection
              currentActions={currentActions}
              completedActions={completedActions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;