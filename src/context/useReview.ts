import { useContext } from "react";
import { ReviewContext } from "./review-context";

export function useReview() {
  const ctx = useContext(ReviewContext);
  if (!ctx) {
    throw new Error("useReview must be used within ReviewProvider");
  }
  return ctx;
}
