export default function PriorityBadge({ priority }) {
  const classes = {
    HIGH:   "badge-high",
    MEDIUM: "badge-medium",
    LOW:    "badge-low",
  };
  const icons = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };

  return (
    <span className={classes[priority] || "badge"}>
      {icons[priority]} {priority?.charAt(0) + priority?.slice(1).toLowerCase()}
    </span>
  );
}
