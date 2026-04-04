import SideBarIcon from "./SideBarIcon";
import { AiOutlineSetting, AiOutlineHome } from "react-icons/ai";
import { MdLiveTv } from "react-icons/md";
import { BiCameraMovie } from "react-icons/bi";
import { CgScreen } from "react-icons/cg";


const TABS=[
   {id:"home", label:"Home", Icon: AiOutlineHome},
   {id:"live", label:"Live", Icon:MdLiveTv},
   {id:"movies", label:"Movies", Icon: BiCameraMovie},
   {id:"series", label:"Series", Icon: CgScreen},
   {id:"settings", label:"Settings", Icon: AiOutlineSetting},
]




export default function TabButton({activeTab,setActiveTab}){
const tabs=[AiOutlineHome,MdLiveTv,BiCameraMovie,CgScreen, AiOutlineSetting]

return(
   <>
   {TABS.map(({id,label,Icon})=>
   (
      <SideBarIcon
      key={id}
      icon={<Icon size="40"/>}
      label={label}
      active={activeTab===id}
      onClick={()=> setActiveTab(id)}
       />
   ))}

   {/* {tabs.map((Icon,idx)=>
    <SideBarIcon  key={idx} icon={<Icon size="32"/>} />
   )} */}
      {/* <SideBarIcon name="home" icon={<AiOutlineHome size="40"/>} label="Home" />

      <SideBarIcon name="live" icon={<MdLiveTv size="40"/>} label="Live TV" />

      <SideBarIcon name="movies" icon={<BiCameraMovie size="40"/>} label="Movies" />

      <SideBarIcon name="series" icon={< CgScreen size="40"/>} label="Series" /> */}

      {/* <SideBarIcon name="settings" icon={< AiOutlineSetting size="40"/>} label="Settings" /> */}
   </>
   
  
);

}