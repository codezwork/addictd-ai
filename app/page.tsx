import { ScrollOrchestrator } from './components/ScrollOrchestrator';
import { Header } from './components/Header';

export default function Home() {
  return (
    <main className="bg-[#06040F] min-h-screen font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <Header />
      <ScrollOrchestrator />
    </main>
  );
}
