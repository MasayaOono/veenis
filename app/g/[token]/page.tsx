// app/g/[token]/page.tsx
"use client";
import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CircularProgress, Box } from "@mui/material";
import { createClient } from "@/lib/supabase";

export default function GroupInviteJoinPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace(
          `/auth/login?next=/g/${encodeURIComponent(token)}${
            search?.toString() ? `?${search}` : ""
          }`
        );
        return;
      }
      const { data: joined, error } = await supabase.rpc(
        "join_group_by_token",
        { p_token: token }
      );
      if (cancelled) return;
      if (error || typeof joined !== "string") {
        router.replace(
          `/groups?err=${encodeURIComponent(
            error?.message ?? "Invalid RPC response"
          )}`
        );
      } else {
        router.replace(`/groups/${joined}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, supabase, token, search]);

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
      <CircularProgress />
    </Box>
  );
}
