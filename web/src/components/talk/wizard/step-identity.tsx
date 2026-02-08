"use client";

import { useWizardFormData, useWizardNavigation } from "./wizard-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * Step 0: Identity & Bond
 *
 * First step of the session creation wizard where users identify:
 * - Partner's name
 * - Relationship context
 *
 * Reference: requirements.md Section 6.4 Step 0
 */
export function StepIdentity() {
  const { formData, setFieldValue, getFieldError, stepErrors } =
    useWizardFormData();
  const { nextStep } = useWizardNavigation();

  const partnerNameError = getFieldError("partnerName");
  const relationshipContextError = getFieldError("relationshipContext");

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="mb-6">
        <span className="text-xs font-medium tracking-widest text-muted-foreground">
          00 / IDENTITY & BOND
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-8">
        Who are you connecting with?
      </h1>

      {/* Form fields */}
      <div className="flex-1 space-y-6">
        {/* Partner's Name */}
        <div className="space-y-2">
          <Label
            htmlFor="partnerName"
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            Partner&apos;s Name
          </Label>
          <Input
            id="partnerName"
            type="text"
            placeholder="e.g. David Miller"
            value={formData.partnerName}
            onChange={(e) => setFieldValue("partnerName", e.target.value)}
            className={partnerNameError ? "border-destructive" : ""}
            aria-invalid={!!partnerNameError}
            aria-describedby={partnerNameError ? "partnerName-error" : undefined}
          />
          {partnerNameError && (
            <p
              id="partnerName-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {partnerNameError}
            </p>
          )}
        </div>

        {/* Relationship Context */}
        <div className="space-y-2">
          <Label
            htmlFor="relationshipContext"
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            Relationship Context
          </Label>
          <Textarea
            id="relationshipContext"
            placeholder="Describe your dynamic (e.g. Co-founders, 3 years working together, high trust but recent friction...)"
            value={formData.relationshipContext}
            onChange={(e) =>
              setFieldValue("relationshipContext", e.target.value)
            }
            className={relationshipContextError ? "border-destructive" : ""}
            aria-invalid={!!relationshipContextError}
            aria-describedby={
              relationshipContextError ? "relationshipContext-error" : undefined
            }
            rows={4}
          />
          {relationshipContextError && (
            <p
              id="relationshipContext-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {relationshipContextError}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.relationshipContext.length}/500 characters
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 pt-6 border-t border-border">
        <Button
          onClick={handleContinue}
          className="w-full md:w-auto"
          disabled={Object.keys(stepErrors).length > 0}
        >
          Continue to Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
