import { useCallback, useEffect, useState } from "react";

interface InvitationSessionState {
  invitationId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useInvitationSession() {
  const [state, setState] = useState<InvitationSessionState>({
    invitationId: null,
    isLoading: true,
    error: null,
  });

  const fetchSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch("/api/invitations/session");
      if (!res.ok) {
        setState({ invitationId: null, isLoading: false, error: null });
        return;
      }
      const data = (await res.json()) as { invitationId?: string };
      setState({
        invitationId: data.invitationId ?? null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        invitationId: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { ...state, refresh: fetchSession };
}
