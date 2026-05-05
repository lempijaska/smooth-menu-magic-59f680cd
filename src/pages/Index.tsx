import FloatingMenu from "@/components/FloatingMenu";
import Dock from "@/components/Dock";

const Index = () => {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />

      <div className="relative text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Drag the menu around
        </h1>
        <p className="mt-3 text-muted-foreground">
          Click anywhere on the canvas to close it
        </p>
      </div>
      <FloatingMenu />
      <Dock />
    </div>
  );
};

export default Index;
