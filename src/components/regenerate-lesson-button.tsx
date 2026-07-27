"use client";

import { regenerateLesson } from "@/lib/learning/actions";
import { SubmitButton } from "@/components/submit-button";

export function RegenerateLessonButton({ conceptId }: { conceptId: string }) {
  return (
    <form
      action={regenerateLesson.bind(null, conceptId)}
      onSubmit={(e) => {
        if (
          !confirm(
            "Regenerate this lesson? The current lesson, its flashcards, notes, and questions will be deleted."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton variant="outline" size="sm" pendingLabel="Regenerating…">
        Regenerate lesson
      </SubmitButton>
    </form>
  );
}
