"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { getTalkByInviteToken, recordConsent } from "@/lib/api/talks";
import { ConsentForm } from "@/components/talk/consent-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Talk, ConsentRequest } from "@/lib/api/types";

/**
 * InvitePage - Partner invitation landing page.
 *
 * Partners arrive here via an invite link (e.g., /invite/abc123).
 * They can view talk details and accept or decline the invitation.
 */
export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [consentResult, setConsentResult] = React.useState<
    "accepted" | "declined" | null
  >(null);

  // Fetch talk data using the invite token
  const {
    data: talk,
    isLoading,
    error,
  } = useQuery<Talk, Error>({
    queryKey: ["talk", "invite", token],
    queryFn: () => getTalkByInviteToken(token),
    enabled: !!token,
    retry: false,
  });

  // Consent mutation
  const consentMutation = useMutation({
    mutationFn: async ({
      talkId,
      data,
    }: {
      talkId: string;
      data: ConsentRequest;
    }) => recordConsent(talkId, data),
    onSuccess: (_response, variables) => {
      if (variables.data.consented) {
        setConsentResult("accepted");
        // Redirect to talk detail page after a brief delay
        setTimeout(() => {
          router.push(`/talks/${variables.talkId}`);
        }, 2000);
      } else {
        setConsentResult("declined");
      }
    },
  });

  // Get the creator's name from participants
  const getCreatorName = (): string => {
    if (!talk?.participants) return "Someone";
    const creator = talk.participants.find((p) => p.role === "creator");
    return creator?.name || "Someone";
  };

  // Handle accept
  const handleAccept = async (inviteeName: string) => {
    if (!talk) return;

    await consentMutation.mutateAsync({
      talkId: talk.id,
      data: {
        invite_token: token,
        invitee_name: inviteeName,
        consented: true,
      },
    });
  };

  // Handle decline
  const handleDecline = async () => {
    if (!talk) return;

    await consentMutation.mutateAsync({
      talkId: talk.id,
      data: {
        invite_token: token,
        invitee_name: "", // Name not needed for decline
        consented: false,
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state - invalid or expired token
  if (error || !talk) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">
            Invalid Invitation
          </h1>
          <p className="text-muted-foreground">
            This invitation link is invalid or has expired. Please ask the
            person who invited you to send a new link.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Talk already started or ended
  if (
    talk.status === "in_progress" ||
    talk.status === "ended" ||
    talk.status === "archived"
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">
            Talk No Longer Available
          </h1>
          <p className="text-muted-foreground">
            {talk.status === "archived"
              ? "This talk has been cancelled."
              : "This talk has already started or ended."}
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Consent accepted success state
  if (consentResult === "accepted") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-status-active/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-status-active" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">
            You&apos;re All Set!
          </h1>
          <p className="text-muted-foreground">
            You&apos;ve accepted the invitation. Redirecting you to the talk
            details...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  // Consent declined state
  if (consentResult === "declined") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-serif text-2xl font-semibold">
            Invitation Declined
          </h1>
          <p className="text-muted-foreground">
            You&apos;ve declined this invitation. The person who invited you
            will not be notified.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex flex-col items-center pt-12 pb-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold mb-2">
            You&apos;re Invited.
          </h1>
          <p className="text-muted-foreground">
            {getCreatorName()} has invited you to a facilitated talk on Diadi.
          </p>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pb-8 flex flex-col items-center">
          <ConsentForm
            inviterName={getCreatorName()}
            goal={talk.goal}
            scheduledAt={talk.scheduled_at}
            durationMinutes={talk.duration_minutes}
            meetingUrl={talk.meeting_url}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isSubmitting={consentMutation.isPending}
          />
        </main>
      </div>

      {/* Desktop Layout - Split View */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Panel - Hero */}
        <div className="flex-1 flex flex-col justify-center px-12 lg:px-20">
          <div className="max-w-lg">
            <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
              <Mail className="h-7 w-7 text-secondary" />
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-semibold mb-4">
              You&apos;re Invited.
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {getCreatorName()} has invited you to a facilitated conversation
              using Diadi&apos;s AI-powered communication assistant.
            </p>
            <p className="text-sm text-muted-foreground">
              Diadi helps you have difficult conversations with the people you
              care about. Our AI facilitator observes your conversation and
              offers gentle guidance when needed&mdash;always visible to both of
              you.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
          <ConsentForm
            inviterName={getCreatorName()}
            goal={talk.goal}
            scheduledAt={talk.scheduled_at}
            durationMinutes={talk.duration_minutes}
            meetingUrl={talk.meeting_url}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isSubmitting={consentMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
