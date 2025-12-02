export default function SideBarIcon({icon,label,active,onClick}){
    
   return (
        
      <button
      onClick={onClick}
      className={` p-2 relative flex-row items-center justify-center shadow-lg
       transition 
        transform 
        duration-200 
        hover:scale-125 
        hover:text-red-500"
       ${active? " text-red-500":" text-slate-100 hover:text-blue-500"}
       `}
       >
        {icon} 
        <span className="text-sm">{label}</span>
      </button>
   );
}

//p-2 rounded-lg hover-bg-white-800 transition-colors