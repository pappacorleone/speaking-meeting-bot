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

// Internal StepLaunch with custom create handler
interface StepLaunchInternalProps {
  onCreateSession: () => void;
  isSubmitting: boolean;
}

function StepLaunchInternal({ onCreateSession, isSubmitting }: StepLaunchInternalProps) {
  const [copied, setCopied] = useState(false);
  const { formData, setFieldValue, getFieldError, prevStep, canGoBack } = useWizard();

  // Generate placeholder invite link (real link comes from API response)
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/invite/preview-token`
    : "/invite/preview-token";

  const showMeetingUrlInput = formData.platform !== "diadi";

  const handleCopyInviteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  }, [inviteLink]);

  const meetingUrlError = getFieldError("meetingUrl");

  // Platform options for display
  const platformOptions = [
    { id: "diadi" as const, name: "Diadi", description: "Use Diadi's built-in video chat", icon: "✨" },
    { id: "zoom" as const, name: "Zoom", description: "Join via Zoom meeting", icon: "📹" },
    { id: "meet" as const, name: "Google Meet", description: "Join via Google Meet", icon: "🖥️" },
    { id: "teams" as const, name: "Microsoft Teams", description: "Join via Microsoft Teams", icon: "👥" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="mb-6">
        <span className="text-xs font-medium tracking-widest text-muted-foreground">
          04 / LAUNCH HUB
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">
        Invite Your Partner
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Share the invite link and choose how you&apos;ll connect.
      </p>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {/* Invite Link Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Partner Invite Link
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Share this link with {formData.partnerName || "your partner"} to
                invite them to the session.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={inviteLink}
                readOnly
                className="flex-1 bg-muted/50 font-mono text-sm h-10 rounded-lg px-4 border border-input"
                aria-label="Invite link"
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="shrink-0 min-w-[100px] h-10 px-4 rounded-lg border border-input bg-background hover:bg-muted text-sm font-medium"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your partner will need to consent before the session can begin.
            </p>
          </div>
        </Card>

        {/* Platform Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Meeting Platform
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose how you&apos;ll connect for your session.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
            {platformOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setFieldValue("platform", option.id);
                  if (option.id === "diadi") {
                    setFieldValue("meetingUrl", "");
                  }
                }}
                className={`
                  relative flex items-center gap-4 p-4 rounded-lg border text-left
                  transition-all duration-200
                  ${
                    formData.platform === option.id
                      ? "border-secondary bg-secondary/5 ring-2 ring-secondary"
                      : "border-border hover:border-secondary/50 hover:bg-muted/50"
                  }
                `}
                role="radio"
                aria-checked={formData.platform === option.id}
              >
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{option.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Meeting URL Input (conditional) */}
        {showMeetingUrlInput && (
          <div className="space-y-2">
            <label
              htmlFor="meeting-url"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              Meeting Link
            </label>
            <input
              id="meeting-url"
              type="url"
              value={formData.meetingUrl || ""}
              onChange={(e) => setFieldValue("meetingUrl", e.target.value)}
              placeholder="Paste your meeting URL"
              className={`w-full h-10 px-4 rounded-lg border bg-background text-sm ${
                meetingUrlError ? "border-destructive" : "border-input"
              }`}
            />
            {meetingUrlError && (
              <p className="text-xs text-destructive">{meetingUrlError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The AI facilitator will join this meeting when you start the session.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col-reverse sm:flex-row gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2 rounded-button border border-input bg-background hover:bg-muted text-sm font-medium disabled:opacity-50"
          >
            ← Back to Review
          </button>
        )}
        <button
          type="button"
          onClick={onCreateSession}
          disabled={isSubmitting}
          className="w-full sm:w-auto sm:ml-auto px-6 py-2 rounded-button bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium uppercase tracking-widest disabled:opacity-50"
        >
          {isSubmitting ? "Creating Session..." : "Create Session"}
        </button>
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
        return <StepLaunchInternal onCreateSession={handleSubmit} isSubmitting={isSubmitting} />;
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
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

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
        meeting_url: formData.platform !== 'diadi' ? formData.meetingUrl : undefined,
        // Skip consent flow in dev mode for testing without a partner
        skip_consent: process.env.NODE_ENV === 'development',
      };

      // Create session via API
      const response = await createSession(request, apiKey);

      // Redirect to the session detail page
      router.push(`/sessions/${response.session_id}`);
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
