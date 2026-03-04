// TODO: Show unique device metadata (Phase 2 — Device Info panel)
export default function DeviceInfo() {
  return (
    <div
      className="p-3 rounded-lg bg-[#0d1016] border border-[rgba(255,255,255,0.07)] w-full"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        Device Info
      </h3>
      <p className="text-[#555] text-sm">Device metadata will appear here.</p>
    </div>
  );
}
