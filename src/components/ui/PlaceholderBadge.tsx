export default function PlaceholderBadge({ text = "Sample data — replace in Manage Data" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-semibold">
      ⚠️ {text}
    </span>
  );
}
