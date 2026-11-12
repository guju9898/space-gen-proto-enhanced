"use client"

import { Suspense, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LAST_STUDIO_COOKIE, studioKindFromPath } from '@/lib/studio/lastStudio';
import { useDesignConfig } from '@/hooks/useDesignConfig';
import { GlobalHeader } from './GlobalHeader';
import { CheckoutSuccessDialog } from './CheckoutSuccessDialog';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { DemoRendersClaim } from '@/components/demo/DemoRendersClaim';
import { StudioV2Provider, useStudioV2 } from './StudioV2Context';
import { trackStudioEvent } from './analytics';
import { GuideButton, TradeQuestion } from './OnboardingBits';
import { StudioCreditPill } from './StudioCreditPill';
import { Camera } from 'lucide-react';

interface StudioLayoutProps {
  formContent: React.ReactNode;
  previewContent: React.ReactNode;
  requestContent: React.ReactNode;
  demoMode?: boolean;
  /** Studio v2 (flagged redesign). Off = the current three-column layout. */
  studioV2?: boolean;
  /** A site photo is uploaded (v2 uses this to tuck away camera controls). */
  hasPhoto?: boolean;
  /** The user chose to explore ideas without a photo (v2). */
  noPhotoMode?: boolean;
}

/** v2: one line above the form explaining why camera fields are hidden, with a way to show them. */
function CameraControlsNote() {
  const v2 = useStudioV2();
  if (!v2.enabled || !v2.hasPhoto || v2.noPhotoMode) return null;
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {v2.showCameraControls
          ? 'Camera and composition controls are shown. Your photo already sets most of these.'
          : 'Your photo sets the camera angle and layout, so those controls are hidden.'}
      </span>
      <button
        type="button"
        className="shrink-0 font-medium text-foreground underline underline-offset-2"
        onClick={() => {
          const next = !v2.showCameraControls;
          v2.setShowCameraControls(next);
          if (next) trackStudioEvent('camera_controls_shown', { studio: v2.studio ?? undefined });
        }}
      >
        {v2.showCameraControls ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function StudioLayout({ formContent, previewContent, requestContent, demoMode, studioV2 = false, hasPhoto = false, noPhotoMode = false }: StudioLayoutProps) {
  const { interior } = useDesignConfig();
  const pathname = usePathname();

  useEffect(() => {
    const kind = studioKindFromPath(pathname);
    if (!kind) return;
    trackStudioEvent('studio_opened', {
      studio: kind,
      mode: demoMode ? 'demo' : 'account',
      device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'phone' : 'desktop',
      studio_version: studioV2 ? 'v2' : 'v1',
    });
    // Once per Studio visit and version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, studioV2]);

  // Remember this Studio so /studio reopens it next time (one year, this site only).
  useEffect(() => {
    const kind = studioKindFromPath(pathname);
    if (kind) document.cookie = `${LAST_STUDIO_COOKIE}=${kind}; path=/; max-age=31536000; samesite=lax`;
  }, [pathname]);

  // photo_uploaded when a photo appears (any upload path: picker, drop, preset).
  const hadPhoto = useRef(hasPhoto);
  useEffect(() => {
    if (hasPhoto && !hadPhoto.current) {
      trackStudioEvent('photo_uploaded', { studio: studioKindFromPath(pathname) ?? undefined, studio_version: studioV2 ? 'v2' : 'v1' });
    }
    hadPhoto.current = hasPhoto;
  }, [hasPhoto, pathname, studioV2]);

  if (!interior) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (studioV2) {
    // v2: two columns on desktop (form | result), one column on phones and tablets.
    // The page scrolls normally on small screens; on desktop each column scrolls.
    return (
      <StudioV2Provider enabled hasPhoto={hasPhoto} noPhotoMode={noPhotoMode}>
        <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
          <GlobalHeader demoMode={demoMode} />
          {demoMode && <DemoBanner />}
          <DemoRendersClaim demoMode={demoMode} />
          <Suspense fallback={null}>
            <CheckoutSuccessDialog />
          </Suspense>
          <main className="flex-1 lg:overflow-hidden">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 lg:h-full lg:py-6">
              <div className="flex flex-col gap-6 lg:grid lg:h-full lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
                <div className="lg:overflow-y-auto lg:overscroll-contain lg:pr-2" data-studio-form>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    {!demoMode ? <StudioCreditPill /> : <span />}
                    <GuideButton />
                  </div>
                  <TradeQuestion />
                  <CameraControlsNote />
                  {formContent}
                </div>
                <div className="space-y-4 lg:overflow-y-auto lg:pr-1">
                  {previewContent}
                  <div>{requestContent}</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </StudioV2Provider>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <GlobalHeader demoMode={demoMode} />
      {demoMode && <DemoBanner />}
      <DemoRendersClaim demoMode={demoMode} />
      <Suspense fallback={null}>
        <CheckoutSuccessDialog />
      </Suspense>
      <main className="flex-1 lg:overflow-hidden">
        {/* One column below 1024px (phones, tablets); the original three columns above. */}
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:h-full lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-3">
            <div className="lg:col-span-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
              {formContent}
            </div>
            <div className="lg:col-span-1 lg:overflow-y-auto">
              {previewContent}
            </div>
            <div className="lg:col-span-1 lg:overflow-y-auto">
              {requestContent}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
