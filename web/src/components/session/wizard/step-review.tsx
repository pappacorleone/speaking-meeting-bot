"use client";

import { useWizardFormData, useWizardNavigation } from "./wizard-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Pencil } from "lucide-react";
import type { FacilitatorPersona } from "@/types/session";

/**
 * Step 3: Review & Connect
 *
 * Fourth step of the session creation wizard where users review all
 * entered information before finalizing the session setup.
 *
 * Displays summary of:
 * - Partner name
 * - Session goal
 * - Selected facilitator persona
 * - Duration and schedule (if set)
 *
 * Reference: requirements.md Section 6.4 / Screenshot 2025-12-31 144134.png
 */

// Helper to get display name for persona
function getPersonaDisplayName(persona: FacilitatorPersona): string {
  const displayNames: Record<FacilitatorPersona, string> = {
    neutral_mediator: "Neutral Mediator",
    deep_empath: "Deep Empath",
    decision_catalyst: "Decision Catalyst",
  };
  return displayNames[persona];
}

// Helper to format duration
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

// Helper to format scheduled date
function formatScheduledDate(dateString?: string): string {
  if (!dateString) return "Not scheduled";

  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface SummaryRowProps {
  label: string;
  value: string;
  onEdit?: () => void;
  truncate?: boolean;
}

function SummaryRow({ label, value, onEdit, truncate = false }: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase block mb-1">
          {label}
        </span>
        <span
          className={`text-sm text-foreground ${truncate ? "line-clamp-2" : ""}`}
        >
          {value}
        </span>
      </div>
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          aria-label={`Edit ${label}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function StepReview() {
  const { formData } = useWizardFormData();
  const { nextStep, prevStep, goToStep, canGoBack } = useWizardNavigation();

  const handleContinue = () => {
    nextStep();
  };

  const handleBack = () => {
    prevStep();
  };

  const handleEditIdentity = () => {
    goToStep(0);
  };

  const handleEditGoal = () => {
    goToStep(1);
  };

  const handleEditFacilitator = () => {
    goToStep(2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="mb-6">
        <span className="text-xs font-medium tracking-widest text-muted-foreground">
          03 / REVIEW & CONFIRM
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">
        Finalize Setup
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground mb-8">
        Initialize the encrypted facilitation chamber.
      </p>

      {/* Summary Card */}
      <Card className="flex-1 p-6">
        <div className="space-y-1">
          {/* Partner */}
          <SummaryRow
            label="Partner"
            value={formData.partnerName}
            onEdit={handleEditIdentity}
          />

          {/* Goal */}
          <SummaryRow
            label="Goal"
            value={formData.goal}
            onEdit={handleEditGoal}
            truncate
          />

          {/* Facilitator */}
          <SummaryRow
            label="Mediator"
            value={getPersonaDisplayName(formData.facilitator.persona)}
            onEdit={handleEditFacilitator}
          />

          {/* Duration */}
          <SummaryRow
            label="Duration"
            value={formatDuration(formData.durationMinutes)}
            onEdit={handleEditGoal}
          />

          {/* Schedule (if set) */}
          {formData.scheduledAt && (
            <SummaryRow
              label="Scheduled"
              value={formatScheduledDate(formData.scheduledAt)}
              onEdit={handleEditGoal}
            />
          )}

          {/* Facilitator Settings */}
          <div className="pt-4 mt-2 border-t border-border">
            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase block mb-3">
              Facilitator Settings
            </span>
            <div className="flex flex-wrap gap-2">
              {formData.facilitator.interruptAuthority && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                  Interrupt Authority
                </span>
              )}
              {formData.facilitator.directInquiry && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                  Direct Inquiry
                </span>
              )}
              {formData.facilitator.silenceDetection && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                  Silence Detection
                </span>
              )}
              {!formData.facilitator.interruptAuthority &&
                !formData.facilitator.directInquiry &&
                !formData.facilitator.silenceDetection && (
                  <span className="text-xs text-muted-foreground italic">
                    No active behaviors enabled
                  </span>
                )}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation buttons */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col-reverse sm:flex-row gap-3">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Calibration
          </Button>
        )}
        <Button
          onClick={handleContinue}
          className="w-full sm:w-auto sm:ml-auto"
        >
          Accept & Initialize
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
