// app/users/[username]/followers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Chip,
  Skeleton,
  Button,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NextLink from "next/link";
import { useTheme } from "@mui/material/styles";

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function FollowersListPage() {
  const supabase = useMemo(() => createClient(), []);
  const { username } = useParams<{ username: string }>();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const [owner, setOwner] = useState<Profile | null>(null);
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!username) return;
      setLoading(true);
      setErr(null);

      // username -> owner profile
      const prof = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .eq("username", username)
        .maybeSingle();

      if (prof.error || !prof.data) {
        setErr("ユーザーが見つかりません。");
        setLoading(false);
        return;
      }
      const ownerProf = prof.data as Profile;
      setOwner(ownerProf);

      // followers: follows.followee_id = owner_id -> follower_id -> profiles
      const fRes = await supabase
        .from("follows")
        .select("follower_id")
        .eq("followee_id", ownerProf.user_id);

      if (fRes.error) {
        setErr(fRes.error.message);
        setList([]);
        setLoading(false);
        return;
      }

      const ids = (fRes.data ?? []).map((r: any) => r.follower_id) as string[];
      if (ids.length === 0) {
        setList([]);
        setLoading(false);
        return;
      }

      const pRes = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", ids)
        .order("display_name", { ascending: true });

      if (pRes.error) {
        setErr(pRes.error.message);
        setList([]);
        setLoading(false);
        return;
      }

      const arr = (pRes.data as Profile[]) || [];
      arr.sort((a, b) =>
        (a.display_name || a.username || "").localeCompare(
          b.display_name || b.username || ""
        )
      );
      setList(arr);
      setLoading(false);
    })();
  }, [username, supabase]);

  if (loading && !owner) {
    return (
      <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Paper variant="outlined" sx={{ p: 2 }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", py: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" />
                <Skeleton width="25%" />
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  if (err || !owner) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", px: 2, py: 4 }}>
        <Alert severity="warning">{err ?? "表示できません"}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 1.5, sm: 2 }, py: 3 }}>
      {/* パンくず */}
      <Breadcrumbs sx={{ mb: 1.5 }}>
        <MuiLink
          component={NextLink}
          href={`/users/${encodeURIComponent(owner.username || "")}`}
          underline="hover"
          color="inherit"
        >
          @{owner.username}
        </MuiLink>
        <Typography color="text.primary">フォロワー</Typography>
      </Breadcrumbs>

      {/* ヘッダー */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(99,102,241,.14), rgba(16,185,129,.12))",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={owner.avatar_url ?? undefined}
            sx={{
              width: 56,
              height: 56,
              border: "3px solid rgba(255,255,255,0.9)",
              bgcolor: "background.paper",
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant={isSmDown ? "h6" : "h5"}
              sx={{ fontWeight: 800, lineHeight: 1.15 }}
              noWrap
              title={owner.display_name || owner.username || "Unknown"}
            >
              {owner.display_name || owner.username || "Unknown"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              @{owner.username}
            </Typography>
          </Box>
          <Button
            component={NextLink}
            href={`/users/${encodeURIComponent(owner.username || "")}`}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            sx={{
              backdropFilter: "saturate(140%) blur(6px)",
              bgcolor: "rgba(255,255,255,0.7)",
            }}
          >
            プロフィールへ
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Chip label={`フォロワー ${list.length} 人`} size="small" />
      </Paper>

      {/* 一覧 */}
      <Paper variant="outlined" sx={{ p: { xs: 0.5, sm: 1 } }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", py: 1.25 }}>
              <Skeleton variant="circular" width={44} height={44} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="35%" />
                <Skeleton width="22%" />
              </Box>
            </Box>
          ))
        ) : list.length === 0 ? (
          <Alert severity="info" sx={{ m: 1.5 }}>
            フォロワーはいません。
          </Alert>
        ) : (
          <List disablePadding>
            {list.map((u, idx) => {
              const primary = u.display_name || u.username || "Unknown";
              const secondary = `@${u.username ?? "unknown"}`;
              return (
                <Box key={u.user_id}>
                  <ListItem
                    component={NextLink}
                    href={`/users/${encodeURIComponent(u.username || "")}`}
                    sx={{
                      px: { xs: 1, sm: 1.25 },
                      py: { xs: 1, sm: 1.25 },
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: "action.hover" },
                      transition: "background-color .15s ease",
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.avatar_url ?? undefined} sx={{ width: 44, height: 44 }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={primary}
                      secondary={secondary}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: "text.secondary" }}
                    />
                  </ListItem>
                  {idx < list.length - 1 && <Divider component="li" sx={{ mx: 1 }} />}
                </Box>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
}
