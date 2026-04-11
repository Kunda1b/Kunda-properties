"use client";

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue) {
        setValue(JSON.parse(storedValue) as T);
      }
    } catch {
      setValue(initialValue);
    } finally {
      setIsHydrated(true);
    }
  }, [initialValue, key]);

  const updateValue = (nextValue: T | ((currentValue: T) => T)) => {
    setValue((currentValue) => {
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (currentValue: T) => T)(currentValue)
          : nextValue;

      window.localStorage.setItem(key, JSON.stringify(resolvedValue));
      return resolvedValue;
    });
  };

  return { isHydrated, setValue: updateValue, value };
}
