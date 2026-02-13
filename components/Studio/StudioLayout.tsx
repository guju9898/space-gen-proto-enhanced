"use client"

import { Suspense } from 'react';
import { useDesignConfig } from '@/hooks/useDesignConfig';
import { GlobalHeader } from './GlobalHeader';
import { CheckoutSuccessDialog } from './CheckoutSuccessDialog';

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
    <div className="flex flex-col h-screen overflow-hidden">
      <GlobalHeader />
      <Suspense fallback={null}>
        <CheckoutSuccessDialog />
      </Suspense>
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 py-8 h-full">
          <div className="grid grid-cols-3 gap-6 h-full">
            <div className="col-span-1 overflow-y-auto overscroll-contain pr-2">
              {formContent}
            </div>
            <div className="col-span-1 overflow-hidden">
              {previewContent}
            </div>
            <div className="col-span-1 overflow-hidden">
              {requestContent}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
