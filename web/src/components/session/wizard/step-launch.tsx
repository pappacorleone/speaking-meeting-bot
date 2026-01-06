"use client";

import { useState, useCallback } from "react";
import { useWizardFormData, useWizardNavigation, useWizard } from "./wizard-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Monitor,
  Video,
  Users,
  Sparkles,
} from "lucide-react";
import type { Platform } from "@/types/session";

/**
 * Step 4: Launch Hub
 *
 * Final step of the session creation wizard where users:
 * - See the generated invite link to share with their partner
 * - Select the meeting platform (Zoom, Meet, Teams, or Diadi)
 * - Optionally provide an external meeting URL
 *
 * Reference: requirements.md Section 6.4 / Screenshot 2025-12-31 144137.png
 */

// Platform configuration
interface PlatformOption {
  id: Platform;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresUrl: boolean;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: "diadi",
    name: "Diadi",
    description: "Use Diadi's built-in video chat",
    icon: <Sparkles className="h-5 w-5" />,
    requiresUrl: false,
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Join via Zoom meeting",
    icon: <Video className="h-5 w-5" />,
    requiresUrl: true,
  },
  {
    id: "meet",
    name: "Google Meet",
    description: "Join via Google Meet",
    icon: <Monitor className="h-5 w-5" />,
    requiresUrl: true,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Join via Microsoft Teams",
    icon: <Users className="h-5 w-5" />,
    requiresUrl: true,
  },
];

// Helper to generate invite link (placeholder - real link comes from backend)
function generateInviteLink(token?: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  // In production, token comes from backend after session creation
  const placeholderToken = token || "preview-token";
  return `${baseUrl}/invite/${placeholderToken}`;
}

interface PlatformCardProps {
  option: PlatformOption;
  isSelected: boolean;
  onSelect: () => void;
}

function PlatformCard({ option, isSelected, onSelect }: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative flex items-center gap-4 p-4 rounded-lg border text-left
        transition-all duration-200
        ${
          isSelected
            ? "border-secondary bg-secondary/5 ring-2 ring-secondary"
            : "border-border hover:border-secondary/50 hover:bg-muted/50"
        }
      `}
      role="radio"
      aria-checked={isSelected}
    >
      {/* Icon */}
      <div
        className={`
          flex items-center justify-center w-10 h-10 rounded-full
          ${isSelected ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}
        `}
      >
        {option.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground">{option.name}</span>
        <span className="block text-xs text-muted-foreground">
          {option.description}
        </span>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
            <Check className="h-3 w-3 text-secondary-foreground" />
          </div>
        </div>
      )}
    </button>
  );
}

export function StepLaunch() {
  const { formData, setFieldValue, getFieldError } = useWizardFormData();
  const { prevStep, canGoBack, isLastStep } = useWizardNavigation();
  const { isSubmitting, validateCurrentStep } = useWizard();
  const [copied, setCopied] = useState(false);

  const inviteLink = generateInviteLink();
  const selectedPlatform = PLATFORM_OPTIONS.find(
    (p) => p.id === formData.platform
  );
  const showMeetingUrlInput = selectedPlatform?.requiresUrl ?? false;

  const handlePlatformSelect = useCallback(
    (platformId: Platform) => {
      setFieldValue("platform", platformId);
      // Clear meeting URL when switching to a platform that doesn't require it
      const platform = PLATFORM_OPTIONS.find((p) => p.id === platformId);
      if (!platform?.requiresUrl) {
        setFieldValue("meetingUrl", "");
      }
    },
    [setFieldValue]
  );

  const handleMeetingUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue("meetingUrl", e.target.value);
    },
    [setFieldValue]
  );

  const handleCopyInviteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  }, [inviteLink]);

  const handleBack = () => {
    prevStep();
  };

  const handleCreateSession = () => {
    // Validate the current step
    if (!validateCurrentStep()) {
      return;
    }
    // The actual API call will be handled by the parent page component
    // This step just validates and signals completion
    // For now, we log completion - the next step (3.7) will wire this up
    console.log("Session ready to create:", formData);
  };

  const meetingUrlError = getFieldError("meetingUrl");

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

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground mb-8">
        Share the invite link and choose how you&apos;ll connect.
      </p>

      {/* Content container */}
      <div className="flex-1 space-y-6">
        {/* Invite Link Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Partner Invite Link
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Share this link with {formData.partnerName || "your partner"} to
                invite them to the session.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1 bg-muted/50 font-mono text-sm"
                aria-label="Invite link"
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleCopyInviteLink}
                className="shrink-0 min-w-[100px]"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your partner will need to consent before the session can begin.
            </p>
          </div>
        </Card>

        {/* Platform Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Meeting Platform
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose how you&apos;ll connect for your session.
            </p>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            role="radiogroup"
            aria-label="Select meeting platform"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <PlatformCard
                key={option.id}
                option={option}
                isSelected={formData.platform === option.id}
                onSelect={() => handlePlatformSelect(option.id)}
              />
            ))}
          </div>
        </div>

        {/* Meeting URL Input (conditional) */}
        {showMeetingUrlInput && (
          <div className="space-y-2">
            <Label
              htmlFor="meeting-url"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              {selectedPlatform?.name} Meeting Link
            </Label>
            <Input
              id="meeting-url"
              type="url"
              value={formData.meetingUrl || ""}
              onChange={handleMeetingUrlChange}
              placeholder={`Paste your ${selectedPlatform?.name} meeting URL`}
              className={meetingUrlError ? "border-destructive" : ""}
              aria-describedby={meetingUrlError ? "meeting-url-error" : undefined}
            />
            {meetingUrlError && (
              <p id="meeting-url-error" className="text-xs text-destructive">
                {meetingUrlError}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              The AI facilitator will join this meeting when you start the
              session.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col-reverse sm:flex-row gap-3">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review
          </Button>
        )}
        <Button
          onClick={handleCreateSession}
          className="w-full sm:w-auto sm:ml-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Creating Session..."
          ) : isLastStep ? (
            "Create Session"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
