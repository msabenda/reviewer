import { useEffect, useMemo, useState } from "react";

import { compareSdlcChallenges } from "../constants/sdlc";
import { INITIAL_FILTERS } from "../constants/ui";
import { createDemoClient, createTrainingClient } from "../services/reviewerApi";
import { useDebouncedValue } from "./useDebouncedValue";

function getChallengeFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("challenge") || "";
}

function setChallengeInUrl(challengeId) {
  if (typeof window === "undefined") {
    return;
  }
  const currentUrl = new URL(window.location.href);
  if (challengeId) {
    currentUrl.searchParams.set("challenge", challengeId);
  } else {
    currentUrl.searchParams.delete("challenge");
  }
  window.history.replaceState({}, "", `${currentUrl.pathname}?${currentUrl.searchParams.toString()}`.replace(/\?$/, ""));
}

export function useReviewerApp({ mode = "demo", csrfToken = "", enabled = true } = {}) {
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filtersOptions, setFiltersOptions] = useState({
    languages: [],
    difficulties: [],
    tracks: [],
  });

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedFilters = useDebouncedValue(filters, 220);

  const [challenges, setChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(() => getChallengeFromUrl());
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [attemptStats, setAttemptStats] = useState({
    total_attempts: 0,
    successful_attempts: 0,
    success_rate: 0,
  });
  const [selectedLines, setSelectedLines] = useState([]);
  const [submission, setSubmission] = useState(null);

  const [loadingBoot, setLoadingBoot] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [loadingChallengeDetail, setLoadingChallengeDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const apiClient = useMemo(() => {
    if (mode === "training") {
      return createTrainingClient(csrfToken);
    }
    return createDemoClient();
  }, [mode, csrfToken]);

  const categoryById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const codeLines = useMemo(() => {
    if (!activeChallenge?.code) {
      return [];
    }
    return activeChallenge.code.split("\n");
  }, [activeChallenge]);

  const selectedSet = useMemo(() => new Set(selectedLines), [selectedLines]);
  const matchedSet = useMemo(() => new Set(submission?.matched_lines || []), [submission]);
  const missedSet = useMemo(() => new Set(submission?.missed_lines || []), [submission]);
  const falseSet = useMemo(() => new Set(submission?.false_positive_lines || []), [submission]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignore = false;

    async function bootstrap() {
      setLoadingBoot(true);
      setError("");

      try {
        const [metaPayload, categoryPayload, filterPayload] = await Promise.all([
          apiClient.getMeta(),
          apiClient.getCategories(),
          apiClient.getFilters(),
        ]);

        if (ignore) {
          return;
        }

        setMeta(metaPayload);
        setCategories(categoryPayload);
        setFiltersOptions(filterPayload);
      } catch (bootstrapError) {
        if (!ignore) {
          setError(bootstrapError.message || "Failed to load platform data.");
        }
      } finally {
        if (!ignore) {
          setLoadingBoot(false);
        }
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [apiClient, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignore = false;

    async function loadChallenges() {
      setLoadingChallenges(true);
      setError("");

      try {
        const challengeList = await apiClient.getChallenges(debouncedFilters);

        if (ignore) {
          return;
        }

        const ordered =
          mode === "training" ? [...challengeList].sort(compareSdlcChallenges) : challengeList;
        setChallenges(ordered);

        if (!challengeList.length) {
          setActiveChallengeId("");
          setActiveChallenge(null);
          setSubmission(null);
          setSelectedLines([]);
          return;
        }

        setActiveChallengeId((currentId) => {
          const exists = ordered.some((challenge) => challenge.id === currentId);
          return exists ? currentId : ordered[0].id;
        });
      } catch (challengeError) {
        if (!ignore) {
          setError(challengeError.message || "Unable to load challenges.");
        }
      } finally {
        if (!ignore) {
          setLoadingChallenges(false);
        }
      }
    }

    loadChallenges();

    return () => {
      ignore = true;
    };
  }, [apiClient, debouncedFilters, enabled, mode]);

  useEffect(() => {
    if (!enabled || !activeChallengeId) {
      return;
    }

    let ignore = false;

    async function loadChallengeDetail() {
      setLoadingChallengeDetail(true);
      setError("");

      try {
        const [challengePayload, statsPayload] = await Promise.all([
          apiClient.getChallenge(activeChallengeId),
          apiClient.getChallengeStats(activeChallengeId),
        ]);

        if (ignore) {
          return;
        }

        setActiveChallenge(challengePayload);
        setAttemptStats(statsPayload);
        setSelectedLines([]);
        setSubmission(null);
      } catch (detailError) {
        if (!ignore) {
          setError(detailError.message || "Unable to load challenge details.");
        }
      } finally {
        if (!ignore) {
          setLoadingChallengeDetail(false);
        }
      }
    }

    loadChallengeDetail();

    return () => {
      ignore = true;
    };
  }, [activeChallengeId, apiClient, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setChallengeInUrl(activeChallengeId);
  }, [activeChallengeId, enabled]);

  function setFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
  }

  function toggleLine(lineNumber) {
    setSelectedLines((current) => {
      if (current.includes(lineNumber)) {
        return current.filter((line) => line !== lineNumber);
      }

      return [...current, lineNumber].sort((first, second) => first - second);
    });
  }

  function clearSelection() {
    setSelectedLines([]);
    setSubmission(null);
  }

  function lineStateClass(lineNumber) {
    if (!submission) {
      return "";
    }

    if (matchedSet.has(lineNumber)) {
      return "is-matched";
    }

    if (missedSet.has(lineNumber)) {
      return "is-missed";
    }

    if (falseSet.has(lineNumber)) {
      return "is-false";
    }

    return "";
  }

  async function submitReview() {
    if (!activeChallengeId || isSubmitting) {
      return;
    }

    if (mode === "training" && !csrfToken) {
      setError("Your secure session is still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await apiClient.submitChallenge(activeChallengeId, selectedLines);
      // Enrich submission with the challenge code so the pass celebration can render the diff
      if (activeChallenge?.code) {
        result._challenge_code = activeChallenge.code;
        result._vulnerable_lines = activeChallenge.vulnerable_lines;
      }
      setSubmission(result);
      setAttemptStats(result.attempts);
    } catch (submitError) {
      setError(submitError.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    meta,
    categories,
    categoryById,
    filtersOptions,
    filters,
    setFilter,
    resetFilters,
    challenges,
    activeChallengeId,
    setActiveChallengeId,
    activeChallenge,
    codeLines,
    attemptStats,
    selectedSet,
    selectedLines,
    toggleLine,
    lineStateClass,
    submission,
    submitReview,
    clearSelection,
    loadingBoot,
    loadingChallenges,
    loadingChallengeDetail,
    isSubmitting,
    error,
  };
}
