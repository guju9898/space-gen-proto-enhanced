"use client"

import { useEffect } from "react"
import { trackAcademyEvent, type AcademyEventName } from "@/components/conversion/group-7/analytics"

export function AcademyView({ eventName, lesson }: { eventName: AcademyEventName; lesson?: string }) {
  useEffect(() => {
    trackAcademyEvent(eventName, lesson ? { lesson } : {})
  }, [eventName, lesson])
  return null
}
