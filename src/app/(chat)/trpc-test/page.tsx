"use client";
import { api } from "@/utils/trpc";
import { useEffect, useState } from "react";

export default function TRPCTestPage() {
  const [messages, setMessages] = useState<Array<{ message: string; timestamp: Date }>>([]);
  
  // Test basic query
  const { data: models, isLoading, error } = api.chat.getModels.useQuery();
  
  // Test subscription (will only work with WebSocket)
  api.chat.onChatUpdate.useSubscription(
    { threadId: "test-thread" },
    {
      onData: (data) => {
        setMessages(prev => [...prev, { message: data.message, timestamp: data.timestamp }]);
      },
      onError: (err) => {
        console.error("Subscription error:", err);
      },
    }
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">tRPC Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Models Query Test</h2>
        {isLoading && <p>Loading models...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {models && (
          <div>
            <p className="text-green-500">✓ Models loaded successfully!</p>
            <p>Found {models.length} provider(s)</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">WebSocket Subscription Test</h2>
        <p className="text-sm text-gray-600 mb-2">
          (This will show subscription messages if WebSocket is working)
        </p>
        <div className="max-h-40 overflow-y-auto border rounded p-2">
          {messages.length === 0 ? (
            <p className="text-gray-500">No subscription messages yet...</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="text-sm">
                <span className="text-blue-500">{msg.timestamp.toLocaleTimeString()}</span>: {msg.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}