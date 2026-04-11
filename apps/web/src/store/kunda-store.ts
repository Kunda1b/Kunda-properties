"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { EnquiryRecord } from "@kunda/types";

type StoreShape = {
  enquiries: EnquiryRecord[];
  savedListingIds: string[];
};

const STORAGE_KEY = "kunda.user-activity";
const defaultState: StoreShape = {
  enquiries: [],
  savedListingIds: [],
};

let currentState = defaultState;
const listeners = new Set<() => void>();

function readState(): StoreShape {
  if (typeof window === "undefined") {
    return currentState;
  }

  try {
    const storedState = window.localStorage.getItem(STORAGE_KEY);
    if (!storedState) {
      currentState = defaultState;
      return currentState;
    }

    const parsedState = JSON.parse(storedState) as Partial<StoreShape>;
    currentState = {
      enquiries: Array.isArray(parsedState.enquiries) ? parsedState.enquiries : [],
      savedListingIds: Array.isArray(parsedState.savedListingIds)
        ? parsedState.savedListingIds
        : [],
    };
    return currentState;
  } catch {
    currentState = defaultState;
    return currentState;
  }
}

function writeState(nextState: StoreShape) {
  currentState = nextState;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      readState();
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function useKundaStore() {
  const state = useSyncExternalStore(
    subscribe,
    () => readState(),
    () => defaultState,
  );

  useEffect(() => {
    readState();
    listeners.forEach((listener) => listener());
  }, []);

  return {
    addEnquiry(enquiry: EnquiryRecord) {
      writeState({
        ...state,
        enquiries: [enquiry, ...state.enquiries].slice(0, 12),
      });
    },
    clearEnquiries() {
      writeState({
        ...state,
        enquiries: [],
      });
    },
    isSaved(propertyId: string) {
      return state.savedListingIds.includes(propertyId);
    },
    state,
    toggleSavedListing(propertyId: string) {
      const savedListingIds = state.savedListingIds.includes(propertyId)
        ? state.savedListingIds.filter((currentId) => currentId !== propertyId)
        : [propertyId, ...state.savedListingIds];

      writeState({
        ...state,
        savedListingIds,
      });
    },
  };
}
