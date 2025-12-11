export default function SeriesCategory({category,onClick}){

return(
    <div 
    onClick={onClick}
    className="bg-slate-800 p-3 rounded-xl gap-2 cursor-pointer hover:bg-slate-700 transition shadow-md">
        <h2 className="font-semibold ">{category.category_name}</h2>
        <p className="text-xs text-slate-400">ID: {category.category_id}</p>
    </div>
);
}