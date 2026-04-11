type Stat = {
  label: string;
  value: string;
};

export default function PropertyStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--kunda-green-light)" }}
        >
          <p className="mb-1 text-xs text-gray-500">{stat.label}</p>
          <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
