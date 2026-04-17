import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="bg-[#0f131d] text-[#dfe2f1] min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #c3c0ff 100%)" }}>
        
      </div>
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold text-[#dfe2f1] mb-2">App Not Found</h1>
        <p className="text-[#c7c4d8] text-sm">This app doesn&apos;t exist or hasn&apos;t been published yet.</p>
      </div>
      <Link href="/" className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}>
        Go Home
      </Link>
    </div>
  );
}

