import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="border-b py-4">
        <nav className="container">
          <Link href="/" className="font-semibold tracking-tight">
            YeetOrJeet
          </Link>
        </nav>
      </div>
    </main>
  );
}
