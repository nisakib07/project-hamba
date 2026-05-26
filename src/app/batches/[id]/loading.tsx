import LoadingSpinner from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        width: "100%",
      }}
    >
      <LoadingSpinner />
    </div>
  );
}
