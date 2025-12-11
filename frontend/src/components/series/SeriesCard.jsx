export default function SeriesCard({series,onClick}){

return (
    <div className="cursor-pointer flex flex-col items-start gap-2 transform duration-200 hover:scale-105" 
    onClick={onClick}
    >
      {/* IMAGE ONLY */}
      <div className="w-[200px] h-[300px] overflow-hidden rounded-xl">
        <img
          src={series.cover}
          alt={series.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* TEXT UNDER THE IMAGE */}
      <div className="px-1">
        <h2 className="font-semibold text-sm">{series.name}</h2>
      </div>
    </div>
  );
}