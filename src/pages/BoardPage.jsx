import { useEffect, useMemo, useState } from "react";


export default function BoardPage() {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Board Page</h1>
      <p className="text-lg text-gray-600">This is a protected route. You are logged in!</p>
    </div>
  );
}
