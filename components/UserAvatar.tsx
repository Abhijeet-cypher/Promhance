"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getAvatarUrl, getInitial } from "@/lib/user-display";

/**
 * Profile picture (e.g. from Google) with an initial-in-a-circle fallback when
 * the user has none or the image fails to load.
 */
export default function UserAvatar({
  user,
  className = "h-6 w-6 text-[11px]",
}: {
  user: User;
  /** Size and text-size classes, e.g. "h-8 w-8 text-sm". */
  className?: string;
}) {
  const url = getAvatarUrl(user);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url && failedUrl !== url;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-500/30 bg-blue-500/15 font-semibold text-blue-300 ${className}`}
    >
      {showImage ? (
        // Plain <img>: Google avatar hosts vary, and referrerPolicy avoids hotlink blocks.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        getInitial(user)
      )}
    </span>
  );
}
