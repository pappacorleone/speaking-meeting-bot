"use client";

import { useWizardFormData, useWizardNavigation } from "./wizard-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, Calendar } from "lucide-react";

/**
 * Duration options for session length
 * Minimum: 15 minutes, Maximum: 90 minutes (per spec)
 */
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
] as const;

/**
 * Step 1: Session Goal
 *
 * Second step of the session creation wizard where users define:
 * - Session goal (what they want to accomplish)
 * - Schedule (optional - now or later)
 * - Duration (15-90 minutes)
 *
 * Reference: requirements.md Section 6.4 / 7.2
 */
export function StepGoal() {
  const { formData, setFieldValue, getFieldError, stepErrors } =
    useWizardFormData();
  const { nextStep, prevStep, canGoBack } = useWizardNavigation();

  const goalError = getFieldError("goal");
  const durationError = getFieldError("durationMinutes");
  const scheduledAtError = getFieldError("scheduledAt");

  const handleContinue = () => {
    nextStep();
  };

  const handleBack = () => {
    prevStep();
  };

  // Character count for goal (max 500)
  const goalLength = formData.goal.length;
  const goalMaxLength = 500;
  const isGoalNearLimit = goalLength > goalMaxLength * 0.8;

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="mb-6">
        <span className="text-xs font-medium tracking-widest text-muted-foreground">
          01 / SESSION GOAL
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-8">
        What do you want to accomplish?
      </h1>

      {/* Form fields */}
      <div className="flex-1 space-y-6">
        {/* Goal */}
        <div className="space-y-2">
          <Label
            htmlFor="goal"
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            Session Goal
          </Label>
          <Textarea
            id="goal"
            placeholder="Describe the outcome you're hoping for (e.g., Reach agreement on equity split and responsibilities before Series A...)"
            value={formData.goal}
            onChange={(e) => setFieldValue("goal", e.target.value)}
            className={goalError ? "border-destructive" : ""}
            aria-invalid={!!goalError}
            aria-describedby={goalError ? "goal-error" : "goal-hint"}
            rows={4}
          />
          {goalError && (
            <p id="goal-error" className="text-sm text-destructive" role="alert">
              {goalError}
            </p>
          )}
          <p
            id="goal-hint"
            className={`text-xs ${
              isGoalNearLimit ? "text-warning" : "text-muted-foreground"
            }`}
          >
            {goalLength}/{goalMaxLength} characters
          </p>
        </div>

        {/* Schedule - Optional date/time picker */}
        <div className="space-y-2">
          <Label
            htmlFor="scheduledAt"
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            Schedule (Optional)
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt || ""}
              onChange={(e) => setFieldValue("scheduledAt", e.target.value || undefined)}
              className={`pl-10 ${scheduledAtError ? "border-destructive" : ""}`}
              aria-invalid={!!scheduledAtError}
              aria-describedby={scheduledAtError ? "scheduledAt-error" : "scheduledAt-hint"}
            />
          </div>
          {scheduledAtError && (
            <p
              id="scheduledAt-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {scheduledAtError}
            </p>
          )}
          <p id="scheduledAt-hint" className="text-xs text-muted-foreground">
            Leave empty to start when both participants are ready
          </p>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label
            htmlFor="durationMinutes"
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Session Duration
          </Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFieldValue("durationMinutes", option.value)}
                className={`
                  px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${
                    formData.durationMinutes === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                  }
                `}
                aria-pressed={formData.durationMinutes === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
          {durationError && (
            <p
              id="durationMinutes-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {durationError}
            </p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col-reverse sm:flex-row gap-3">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <Button
          onClick={handleContinue}
          className="w-full sm:w-auto sm:ml-auto"
          disabled={Object.keys(stepErrors).length > 0}
        >
          Continue to Facilitator
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
