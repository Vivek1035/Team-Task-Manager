const STATUS_MAP = {
  PENDING:     { cls: "badge-pending",     label: "Pending" },
  IN_PROGRESS: { cls: "badge-in-progress", label: "In Progress" },
  DONE:        { cls: "badge-done",        label: "Done" },
};

export default function StatusBadge({ status }) {
  const { cls, label } = STATUS_MAP[status] || { cls: "badge", label: status };
  return <span className={cls}>{label}</span>;
}
