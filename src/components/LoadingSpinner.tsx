export default function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border-color)",
          borderTopColor: "var(--accent-green)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        Loading...
      </p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
