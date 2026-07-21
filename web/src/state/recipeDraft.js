// A recipe half-written in RecipeForm needs to survive a real navigation
// away to /paint-new and back (the "+ New" quick-add-a-paint-mid-recipe
// flow) -- RecipeForm itself fully unmounts during that round trip, so its
// own React state can't carry it. This is a plain module-level value (not
// reactive) for exactly that one hop, mirroring the old app's own use of a
// bare `let recipeForm` global for the same reason.
let draft = null;

export function getRecipeDraft() {
  return draft;
}

export function setRecipeDraft(value) {
  draft = value;
}

export function clearRecipeDraft() {
  draft = null;
}
