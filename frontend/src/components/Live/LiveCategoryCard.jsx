// src/components/live/LiveCategoryCard.jsx
export default function LiveCategoryCard({ category, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-800 p-3 rounded-xl cursor-pointer hover:bg-slate-700 transition shadow-md"
    >
      <h3 className="font-semibold">{category.category_name}</h3>
      <p className="text-xs text-slate-400">ID: {category.category_id}</p>
    </div>
  );
}
