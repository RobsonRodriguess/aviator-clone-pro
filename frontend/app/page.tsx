import AviatorGame from "@/components/AviatorGame";

export default function Home() {
  return (
    // Removemos 'max-w-3xl', 'p-4' e 'flex-col'.
    // Agora usamos h-screen (altura total) e w-screen (largura total).
    <main className="h-screen w-screen bg-[#0F1923] overflow-hidden">
      <AviatorGame />
    </main>
  );
}