import { Link } from "@tanstack/react-router";

export function MemberNotFound() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Member not found
          </h1>
          <p className="text-muted-foreground mb-4">
            The member you are looking for does not exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
