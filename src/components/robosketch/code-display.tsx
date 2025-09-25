'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clipboard } from 'lucide-react';

interface CodeDisplayProps {
  code: string;
  platform: 'Raspberry Pi' | 'Arduino' | 'MicroBit';
}

export default function CodeDisplay({ code, platform }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = platform === 'Raspberry Pi' ? 'python' : 'cpp';

  return (
    <div className="relative group">
      <pre
        className={`bg-secondary p-4 rounded-md border text-sm text-foreground overflow-x-auto max-h-[500px]`}
      >
        <code className={`language-${language} font-code`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Clipboard className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
