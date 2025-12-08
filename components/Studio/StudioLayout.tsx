"use client"

import { useDesignConfig } from '@/hooks/useDesignConfig';
import { GlobalHeader } from './GlobalHeader';

interface StudioLayoutProps {
  formContent: React.ReactNode;
  previewContent: React.ReactNode;
  requestContent: React.ReactNode;
}

export function StudioLayout({ formContent, previewContent, requestContent }: StudioLayoutProps) {
  const { interior } = useDesignConfig();

  if (!interior) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <GlobalHeader />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-[300px,1fr,300px] gap-6">
            {/* Left panel (PromptBuilder) - ~27% width */}
            <div className="md:col-span-1 h-full">
              {formContent}
            </div>
            {/* Center panel (RenderGrid) - ~46% width */}
            <div className="md:col-span-1 h-full">
              {previewContent}
            </div>
            {/* Right panel (Request Summary + CTA) - ~27% width */}
            <div className="md:col-span-1 h-full">
              {requestContent}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
