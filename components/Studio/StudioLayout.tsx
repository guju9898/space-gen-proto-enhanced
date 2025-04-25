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
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1">
              {formContent}
            </div>
            <div className="col-span-1">
              {previewContent}
            </div>
            <div className="col-span-1">
              {requestContent}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
