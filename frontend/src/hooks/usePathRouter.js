import { useCallback, useEffect, useState } from "react";

function normalizePath(pathname) {
  if (!pathname) {
    return "/";
  }

  const clean = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return clean || "/";
}

function parseNextLocation(nextPath) {
  if (!nextPath) {
    return { pathname: "/", search: "" };
  }

  const [rawPathname, rawSearch = ""] = String(nextPath).split("?");
  const pathname = normalizePath(rawPathname);
  const search = rawSearch ? `?${rawSearch}` : "";
  return { pathname, search };
}

export function usePathRouter() {
  const [path, setPath] = useState(() => {
    if (typeof window === "undefined") {
      return "/";
    }
    return normalizePath(window.location.pathname);
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handlePopState() {
      setPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((nextPath, options = {}) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextLocation = parseNextLocation(nextPath);
    const currentPath = normalizePath(window.location.pathname);
    const currentSearch = window.location.search || "";
    const nextUrl = `${nextLocation.pathname}${nextLocation.search}`;

    if (nextLocation.pathname === currentPath && nextLocation.search === currentSearch) {
      return;
    }

    if (options.replace) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }

    setPath(nextLocation.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    path,
    navigate,
  };
}
