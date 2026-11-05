"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { SidePanel } from "@/components/side-panel";
import { SUGGESTED_USERS } from "@/data/demo-content";

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const users = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SUGGESTED_USERS;
    return SUGGESTED_USERS.filter(
      (user) =>
        user.username.toLowerCase().startsWith(normalized) ||
        user.fullName.toLowerCase().startsWith(normalized),
    ).sort((a, b) => {
      const aExact = a.username.toLowerCase() === normalized ? 0 : 1;
      const bExact = b.username.toLowerCase() === normalized ? 0 : 1;
      return aExact - bExact;
    });
  }, [query]);

  return (
    <SidePanel title="Search">
      <div className="search-box">
        <label className="search-field">
          <Icon name="search" size={16} />
          <input
            aria-label="Search"
            maxLength={30}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              className="search-clear"
              onClick={() => setQuery("")}
              type="button"
            >
              <Icon name="close" size={10} />
            </button>
          )}
        </label>
      </div>
      <div className="panel-list">
        {!query.trim() && <h2 className="panel-label">Suggested</h2>}
        {users.map((user) => (
          <Link className="panel-row" href={`/users/${user.username}`} key={user.username}>
            <Avatar name={user.fullName} src={user.avatarUrl} />
            <span className="panel-row-copy">
              <strong>{user.username}</strong>
              <span>
                {user.fullName} • {user.followers.toLocaleString("en-US")} followers
              </span>
            </span>
          </Link>
        ))}
        {!users.length && <p className="panel-empty">No results found.</p>}
      </div>
    </SidePanel>
  );
}
