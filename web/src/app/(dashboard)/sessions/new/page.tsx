"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WizardProvider,
  useWizard,
  StepIdentity,
  StepGoal,
  StepFacilitator,
  StepReview,
  StepLaunch,
} from "@/components/session/wizard";
import { createSession } from "@/lib/api/sessions";
import type { CreateSessionRequest } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Session Creation Page
 *
 * Multi-step wizard for creating a new Diadi session.
 * Integrates all wizard step components and handles API submission.
 *
 * Reference: spec.md Section 6.1 POST /sessions
 */

// Progress indicator component
function WizardProgress() {
  const { currentStep, steps } = useWizard();

  return (
    <div className="hidden md:flex items-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
              transition-colors duration-200
              ${
                index < currentStep
                  ? "bg-secondary text-secondary-foreground"
                  : index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }
            `}
            aria-current={index === currentStep ? "step" : undefined}
          >
            {index < currentStep ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              index
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`
                w-8 h-0.5 mx-1
                ${index < currentStep ? "bg-secondary" : "bg-muted"}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Mobile progress indicator
function MobileProgress() {
  const { currentStep, steps, currentStepConfig } = useWizard();

  return (
    <div className="md:hidden mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-xs font-medium text-foreground">
          {currentStepConfig.title}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// Error alert component
function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex items-start gap-3"
      role="alert"
    >
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-destructive font-medium">
          Failed to create session
        </p>
        <p className="text-sm text-destructive/80 mt-1">{message}</p>
      </div>
    </div>
  );
}

// Form data type for session creation
interface SessionFormData {
  partnerName: string;
  relationshipContext: string;
  goal: string;
  scheduledAt?: string;
  durationMinutes: number;
  facilitator: {
    persona: "neutral_mediator" | "deep_empath" | "decision_catalyst";
    interruptAuthority: boolean;
    directInquiry: boolean;
    silenceDetection: boolean;
  };
  platform: "zoom" | "meet" | "teams" | "diadi";
  meetingUrl?: string;
}

// Wrapper component that has access to wizard context
interface WizardContentWithSubmitProps {
  onCreateSession: (formData: SessionFormData) => Promise<void>;
}

function WizardContentWithSubmit({ onCreateSession }: WizardContentWithSubmitProps) {
  const { currentStep, formData, setSubmitting, isSubmitting, validateStep } = useWizard();
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate final step
    if (!validateStep(4)) {
      return;
    }

    // Check platform URL requirement
    const requiresUrl = formData.platform !== "diadi";
    if (requiresUrl && !formData.meetingUrl) {
      setError("Meeting URL is required for external platforms");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onCreateSession(formData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setSubmitting(false);
    }
  }, [formData, onCreateSession, setSubmitting, validateStep]);

  // Render appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepIdentity />;
      case 1:
        return <StepGoal />;
      case 2:
        return <StepFacilitator />;
      case 3:
        return <StepReview />;
      case 4:
        return <StepLaunch onCreateSession={handleSubmit} isSubmitting={isSubmitting} />;
      default:
        return <StepIdentity />;
    }
  };

  return (
    <>
      {error && <ErrorAlert message={error} />}
      {renderStep()}
    </>
  );
}

// Main page component
export default function NewSessionPage() {
  const router = useRouter();

  // Handle session creation
  const handleCreateSession = useCallback(
    async (formData: SessionFormData) => {
      // Get API key from environment or storage
      // For now, we'll use a placeholder - in production this would come from auth
      const apiKey =
        process.env.NEXT_PUBLIC_MEETING_BAAS_API_KEY ||
        process.env.NEXT_PUBLIC_API_KEY ||
        "";

      // Transform wizard form data to API request format
      const request: CreateSessionRequest = {
        goal: formData.goal,
        relationship_context: formData.relationshipContext,
        partner_name: formData.partnerName,
        facilitator: {
          persona: formData.facilitator.persona,
          interrupt_authority: formData.facilitator.interruptAuthority,
          direct_inquiry: formData.facilitator.directInquiry,
          silence_detection: formData.facilitator.silenceDetection,
        },
        duration_minutes: formData.durationMinutes,
        scheduled_at: formData.scheduledAt || undefined,
        platform: formData.platform,
        meeting_url: formData.platform !== "diadi" ? formData.meetingUrl : undefined,
        // Skip consent flow in dev mode for testing without a partner
        skip_consent: process.env.NODE_ENV === 'development',
      };

      // Create session via API
      const response = await createSession(request, apiKey);

      // Redirect to the session detail page
      const sessionId = response.id || response.session_id;
      router.push(`/sessions/${sessionId}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif text-foreground sr-only">
            Create New Session
          </h1>
        </div>

        {/* Wizard container */}
        <WizardProvider>
          <Card className="p-6 md:p-8">
            <WizardProgress />
            <MobileProgress />
            <WizardContentWithSubmit onCreateSession={handleCreateSession} />
          </Card>
        </WizardProvider>
      </div>
    </div>
  );
}
