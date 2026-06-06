import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-panel">
        <p className="eyebrow">AgentVerse MVP</p>
        <h1>Agent task execution and reputation input demo</h1>
        <p>
          Run the mock research agent, inspect its report, and review the generated
          reputationInput payload.
        </p>
        <Link className="primary-link" href="/agent-demo">
          Open Agent Demo
        </Link>
      </section>
    </main>
  );
}
