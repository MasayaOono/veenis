// app/users/[id]/FollowButton.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@mui/material";

export default function FollowButton({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState<string | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data.user?.id ?? null);
      if (!data.user) return;
      const { data: rel } = await supabase
        .from("user_follows")
        .select("followee_id")
        .eq("follower_id", data.user.id)
        .eq("followee_id", userId)
        .maybeSingle();
      setFollowing(!!rel);
    })();
  }, [supabase, userId]);

  const toggle = async () => {
    if (!me || me === userId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("toggle_follow", {
      p_followee: userId,
    });
    setLoading(false);
    if (!error) setFollowing(!!data);
  };

  if (!me || me === userId) return null;

  return (
    <Button
      size="small"
      variant={following ? "outlined" : "contained"}
      onClick={toggle}
      disabled={loading}
    >
      {following ? "フォロー中" : "フォロー"}
    </Button>
  );
}
