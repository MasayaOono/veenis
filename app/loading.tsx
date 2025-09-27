// app/loading.tsx
export default function RootLoading() {
  return (
    <div className="topbar" aria-hidden>
      <div className="topbar__bar" style={{ transform: "scaleX(0.7)" }}>
        <div className="topbar__peg" />
      </div>
    </div>
  );
}
