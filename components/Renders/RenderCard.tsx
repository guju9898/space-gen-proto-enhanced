"use client";

import Image from "next/image";
import Link from "next/link";
import type { RenderRow } from "./types";

interface RenderCardProps {
  render: RenderRow;
  onDelete: (id: string) => void;
}

export function RenderCard({ render, onDelete }: RenderCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/renders/${render.id}/download`, {
        credentials: "include"
      });
      if (response.ok) {
        // If it's a redirect, the browser will handle it
        if (response.redirected) {
          window.open(response.url, "_blank");
        } else {
          // If it's a stream, trigger download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `render-${render.id}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      } else {
        // Fallback to direct image URL
        if (render.image_url) {
          window.open(render.image_url, "_blank");
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to direct image URL
      if (render.image_url) {
        window.open(render.image_url, "_blank");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded": return "text-green-400 bg-green-400/10";
      case "failed": case "canceled": case "failed_timeout": return "text-red-400 bg-red-400/10";
      case "processing": case "starting": return "text-yellow-400 bg-yellow-400/10";
      case "queued": return "text-blue-400 bg-blue-400/10";
      default: return "text-neutral-400 bg-neutral-400/10";
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col hover:border-neutral-700 transition-colors">
      {/* Image Preview */}
      <div className="relative h-48 bg-neutral-800">
        {render.image_url ? (
          <Image
            src={render.image_url}
            alt={render.prompt || "Render"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(render.status)}`}>
            {render.status}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="space-y-2 mb-4 flex-1">
          <h3 className="font-medium text-white line-clamp-2">
            {render.prompt ? String(render.prompt).slice(0, 100) + (String(render.prompt).length > 100 ? "..." : "") : "Untitled render"}
          </h3>
          <p className="text-neutral-400 text-sm">
            {new Date(render.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/studio/${render.type || "interior"}?renderId=${render.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open in Studio
          </Link>
          
          {render.image_url && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-700 text-white rounded-md text-xs font-medium hover:bg-neutral-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          )}
          
          <button
            onClick={() => onDelete(render.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
