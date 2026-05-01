export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
      ⚠️ {message}
    </div>
  );
}
