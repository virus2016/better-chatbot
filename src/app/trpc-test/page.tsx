"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function TRPCTestPage() {
  const [name, setName] = useState("World");
  const [itemName, setItemName] = useState("");

  // tRPC queries
  const helloQuery = trpc.example.hello.useQuery({ text: name });
  const getByIdQuery = trpc.example.getById.useQuery({ id: "123" });

  // tRPC mutation
  const createMutation = trpc.example.create.useMutation({
    onSuccess: (data) => {
      console.log("Created item:", data);
      setItemName("");
    },
  });

  const handleCreate = () => {
    if (itemName.trim()) {
      createMutation.mutate({
        name: itemName,
        description: "Test item created via tRPC",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">tRPC v11 Test Page</h1>

      {/* Hello Query Test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Hello Query Test</h2>
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded mr-2"
            placeholder="Enter name"
          />
        </div>
        {helloQuery.isLoading && <p>Loading...</p>}
        {helloQuery.error && (
          <p className="text-red-500">Error: {helloQuery.error.message}</p>
        )}
        {helloQuery.data && (
          <p className="text-green-600 font-medium">
            {helloQuery.data.greeting}
          </p>
        )}
      </div>

      {/* Get By ID Query Test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Get By ID Query Test</h2>
        {getByIdQuery.isLoading && <p>Loading...</p>}
        {getByIdQuery.error && (
          <p className="text-red-500">Error: {getByIdQuery.error.message}</p>
        )}
        {getByIdQuery.data && (
          <div className="text-sm">
            <p>
              <strong>ID:</strong> {getByIdQuery.data.id}
            </p>
            <p>
              <strong>Name:</strong> {getByIdQuery.data.name}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(getByIdQuery.data.createdAt).toISOString()}
            </p>
          </div>
        )}
      </div>

      {/* Create Mutation Test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Create Mutation Test</h2>
        <div className="mb-4">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border p-2 rounded mr-2"
            placeholder="Enter item name"
          />
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !itemName.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Item"}
          </button>
        </div>
        {createMutation.error && (
          <p className="text-red-500">Error: {createMutation.error.message}</p>
        )}
        {createMutation.data && (
          <div className="text-green-600">
            <p>Successfully created item: {createMutation.data.name}</p>
            <p>ID: {createMutation.data.id}</p>
          </div>
        )}
      </div>
    </div>
  );
}
