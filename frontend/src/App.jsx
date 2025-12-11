// App.jsx
import { useState, useEffect, useRef } from "react";
import NavBar from "./components/NavBar";
import MainContent from "./components/MainContent";
import ConnectScreen from "./components/auth/ConnectScreen";
import { isTokenExpired } from "./api/client";

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isConnected, setIsConnected] = useState(()=>{
    const token = localStorage.getItem("xtream_token");
    return token && !isTokenExpired(token);
  });

  const [dockLeft,setDockLeft]= useState(false);
  const navRef=useRef(null)
  
// ─────────────────────────────moving nav bar left when scrolling down, deal with it later─────────────────────────────
  //   useEffect(()=>{
  //     const navEl= navRef.current;
  //     if(!navEl) return;
      
  //     const observer= new IntersectionObserver(
  //       ([entry])=>{
  //         setDockLeft(!entry.isIntersecting)
  //       },
  //     {
  //       root:null,
  //       threshold:0,
  //     }
  //   );
  //     observer.observe(navEl);

  //     return()=>{
  //       observer.unobserve(navEl);
  //     }
    
  // },[]);


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
        <NavBar ref={navRef} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MainContent activeTab={activeTab} setActiveTab={setActiveTab}/>
      </div>
    </div>
  );
}

export default App;
