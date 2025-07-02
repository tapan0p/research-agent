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

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentActions, setCurrentActions] = useState([]);
  const [completedActions, setCompletedActions] = useState([]);
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

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsProcessing(false);
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
    if (data.error) {
      // Handle error
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

    if (data.status === 'done') {
      // Query processing completed
      setIsProcessing(false);
      // Move all current actions to completed
      setCompletedActions((prev) => [...prev, ...currentActions]);
      setCurrentActions([]);
      return;
    }

    if (data.step) {
      // New step received
      const step = data.step;
      const stepAction = {
        id: `step-${data.step_number}`,
        action: step.query || 'Processing...',
        icon: getIconForTool(step.tool),
        stepNumber: data.step_number,
        tool: step.tool,
        parameters: step.parameters
      };

      // Add to current actions
      setCurrentActions((prev) => {
        const filtered = prev.filter(action => action.stepNumber !== data.step_number);
        return [...filtered, stepAction];
      });
    }

    if (data.result) {
      // Step result received
      const result = data.result;
      const stepNumber = data.step_number;
      
      // Move the completed step from current to completed actions
      setCurrentActions((prev) => {
        const completedStep = prev.find(action => action.stepNumber === stepNumber);
        if (completedStep) {
          setCompletedActions((prevCompleted) => [...prevCompleted, completedStep]);
          return prev.filter(action => action.stepNumber !== stepNumber);
        }
        return prev;
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
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
    setCurrentActions([]);
    setCompletedActions([]);

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