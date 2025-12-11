import TabButton from "./TabButton.jsx"


export default function NavBar({activeTab,setActiveTab, }){

return(
   <div className=" w-full flex justify-center mt-4">
      <menu className="flex items-center gap-8 px-4 py-2 rounded-xl bg-gray-900 text-white shadow-lg justify-center  " >
         <TabButton activeTab={activeTab} setActiveTab={setActiveTab}></TabButton>
      </menu>
  </div>
);

}

