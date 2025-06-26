// src/context/WebSocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";

const WebSocketContext = createContext<WebSocket | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("http://echo.websocket.events/"); // Replace with actual URL
    socketRef.current = ws;

    ws.onopen = () => {
        ws.send("Yes"); // or "no"
        console.log("✅ WebSocket Connected");
    }

    // ws.onmessage = (event) => console.log("📨 Message :", event.data);
    ws.onmessage = (event) => {
      console.log("📨 Message 66 :", event.data);
      // Here you can handle incoming messages
      // For example, you could parse JSON data if needed
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed Data:", data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    ws.onclose = () => console.log("❌ WebSocket Closed");
    ws.onerror = (err) => console.error("⚠️ WebSocket Error:", err);


    

    return () => {
      ws.close();
    };
  }, []);
  

  return (
    <WebSocketContext.Provider value={socketRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
