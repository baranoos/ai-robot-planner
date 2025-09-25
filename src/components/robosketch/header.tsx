import { Bot } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold font-headline tracking-tight">
              RoboSketch Planner
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
