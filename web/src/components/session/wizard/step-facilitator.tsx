"use client";

import { useWizardFormData, useWizardNavigation } from "./wizard-provider";
import { PersonaSelector } from "@/components/session/persona-selector";
import { ParameterToggles } from "@/components/session/parameter-toggles";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { FacilitatorPersona, FacilitatorConfig } from "@/types/session";

/**
 * Step 2: Facilitator Calibration
 *
 * Third step of the session creation wizard where users configure:
 * - AI facilitator persona (Neutral Mediator, Deep Empath, Decision Catalyst)
 * - Agent parameters (Interrupt Authority, Direct Inquiry, Silence Detection)
 *
 * Reference: requirements.md Section 6.4 Step 2
 */
export function StepFacilitator() {
  const { formData, setFieldValue, stepErrors } = useWizardFormData();
  const { nextStep, prevStep, canGoBack } = useWizardNavigation();

  const handlePersonaChange = (persona: FacilitatorPersona) => {
    setFieldValue("facilitator", {
      ...formData.facilitator,
      persona,
    });
  };

  const handleParameterChange = (
    key: keyof Omit<FacilitatorConfig, "persona">,
    value: boolean
  ) => {
    setFieldValue("facilitator", {
      ...formData.facilitator,
      [key]: value,
    });
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="mb-6">
        <span className="text-xs font-medium tracking-widest text-muted-foreground">
          02 / FACILITATOR CALIBRATION
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-8">
        Facilitator.
      </h1>

      {/* Form content - Two columns on desktop */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Persona selection */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Choose Agent Persona
          </h2>
          <PersonaSelector
            value={formData.facilitator.persona}
            onChange={handlePersonaChange}
          />
        </div>

        {/* Right column: Parameter toggles */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Agent Parameters
          </h2>
          <ParameterToggles
            values={{
              interruptAuthority: formData.facilitator.interruptAuthority,
              directInquiry: formData.facilitator.directInquiry,
              silenceDetection: formData.facilitator.silenceDetection,
            }}
            onChange={handleParameterChange}
          />

          {/* Helper text */}
          <p className="text-xs text-muted-foreground mt-4">
            These settings can be adjusted during the session via the
            facilitator settings panel.
          </p>
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
          Review & Connect
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
