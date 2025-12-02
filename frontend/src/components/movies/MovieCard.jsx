// src/components/live/LiveChannelCard.jsx
export default function MovieCard({ channel }) {
  return (
    <div className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition shadow-md cursor-pointer flex flex-col gap-1">
      <div className="text-xs text-slate-400">#{channel.num}</div>
      <div className="font-semibold truncate">{channel.name}</div>
      <div className="text-xs text-slate-400">Stream ID: {channel.stream_id}</div>
    </div>
  );
}
