export default function EmptyState({ icon = "📭", title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <span className="text-5xl mb-4 select-none">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {message && <p className="text-sm text-gray-500 max-w-xs">{message}</p>}
    </div>
  );
}
