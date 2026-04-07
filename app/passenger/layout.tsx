export default function PassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* Mobile simulator container */}
      <div className="w-full max-w-[480px] bg-zinc-950 min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
