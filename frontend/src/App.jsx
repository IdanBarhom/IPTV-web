// App.jsx
import { useState } from "react";
import NavBar from "./components/NavBar";
import MainContent from "./components/MainContent";
import ConnectScreen from "./components/auth/ConnectScreen";

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isConnected, setIsConnected] = useState(()=>{
    return !!localStorage.getItem("xtream_token")
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <ConnectScreen onConnected={() => setIsConnected(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl px-4 space-y-6">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <MainContent activeTab={activeTab} />
      </div>
    </div>
  );
}

export default App;
