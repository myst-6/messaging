import { useCallback, useState } from "react";
import { client } from "./client";

export function useUsers() {
  const loadingUsers = new Set();
  const [usernameMap, setUsernameMap] = useState<Map<string, string>>(
    new Map()
  );

  const getUsername = useCallback(
    (userId: string): string | null => {
      console.log("getUsername", userId);
      if (Number.isNaN(parseInt(userId))) return userId;
      if (usernameMap.has(userId)) return usernameMap.get(userId)!;
      if (loadingUsers.has(userId)) return null;
      loadingUsers.add(userId);
      console.log({ loadingUsers });
      console.log("sending out request", userId);
      client.auth.user
        .$post({
          json: { userId },
        })
        .then(async (res) => {
          const json = await res.json();
          if ("error" in json) throw new Error(json.error);
          setUsernameMap((mp) => {
            const cp = new Map(mp);
            cp.set(userId, json.data.username);
            return cp;
          });
          loadingUsers.delete(userId);
        });
      return null;
    },
    [usernameMap]
  );

  return { getUsername };
}
