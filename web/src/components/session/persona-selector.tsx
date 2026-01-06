"use client";

import { Shield, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacilitatorPersona } from "@/types/session";

/**
 * Persona configuration for display
 */
interface PersonaOption {
  id: FacilitatorPersona;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: "neutral_mediator",
    name: "Neutral Mediator",
    subtitle: "BALANCED DIALOGUE",
    description:
      "Calm, impartial facilitator focused on fair representation of both perspectives.",
    icon: Shield,
  },
  {
    id: "deep_empath",
    name: "Deep Empath",
    subtitle: "EMOTIONAL ANCHOR",
    description:
      "Warm, emotionally attuned facilitator prioritizing emotional safety and understanding.",
    icon: Heart,
  },
  {
    id: "decision_catalyst",
    name: "Decision Catalyst",
    subtitle: "RAPID RESOLUTION",
    description:
      "Focused, action-oriented facilitator driving toward concrete decisions and outcomes.",
    icon: Zap,
  },
];

export interface PersonaSelectorProps {
  value: FacilitatorPersona;
  onChange: (persona: FacilitatorPersona) => void;
  disabled?: boolean;
}

/**
 * PersonaSelector - Radio card group for selecting AI facilitator persona
 *
 * Displays three persona options as selectable cards with icons and descriptions.
 * Reference: requirements.md Section 6.4 Step 2 - Facilitator Calibration
 */
export function PersonaSelector({
  value,
  onChange,
  disabled = false,
}: PersonaSelectorProps) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Choose agent persona">
      {PERSONA_OPTIONS.map((persona) => {
        const isSelected = value === persona.id;
        const Icon = persona.icon;

        return (
          <button
            key={persona.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(persona.id)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-card border text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-input bg-background hover:border-muted-foreground/50 hover:bg-accent/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">
                  {persona.name}
                </span>
                {isSelected && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-primary text-primary-foreground rounded">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground mb-1">
                {persona.subtitle}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {persona.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { PERSONA_OPTIONS };
export type { PersonaOption };
