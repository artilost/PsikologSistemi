export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-4">
          Psychology Practice Management System
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Enterprise-grade solution for modern psychology practices
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href="/demo"
            className="rounded-lg border border-input bg-background px-6 py-3 hover:bg-accent"
          >
            View Demo
          </a>
        </div>
      </div>
    </main>
  );
}

