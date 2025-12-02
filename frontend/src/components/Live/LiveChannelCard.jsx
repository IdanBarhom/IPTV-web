// src/components/live/LiveChannelCard.jsx
export default function LiveChannelCard({ channel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        bg-slate-800 p-3 rounded-xl 
        hover:bg-slate-700 transition 
        shadow-md cursor-pointer 
        flex flex-col gap-1 w-full text-left
      "
    >
      <div className="text-xs text-slate-400">#{channel.num}</div>
      <div className="font-semibold truncate">{channel.name}</div>
      <div className="text-xs text-slate-400">
        Stream ID: {channel.stream_id}
      </div>
    </button>
  );
}
