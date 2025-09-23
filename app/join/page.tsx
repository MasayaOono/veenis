"use client";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Box, CircularProgress } from "@mui/material";

export default function JoinGroupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const token = useSearchParams().get("token");

  useEffect(() => {
    const join = async () => {
      if (!token) return;
      const { data, error } = await supabase.rpc("join_group_by_token", {
        p_token: token,
      });
      if (!error && data) router.replace(`/groups/${data}`);
    };
    join();
  }, [token]);

  return (
    <Box sx={{ display: "grid", placeItems: "center", height: "40vh" }}>
      <CircularProgress />
    </Box>
  );
}
