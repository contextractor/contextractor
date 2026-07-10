/**
 * Severity of a pipeline diagnostic. Mirrors the engine's `MessageType`
 * without depending on the engine package.
 */
export type MessageType = 'info' | 'warning' | 'error';

/** A non-fatal diagnostic accumulated while cleaning a page. */
export interface Message {
  type: MessageType;
  text: string;
}

/**
 * The shape serialized by {@link toJson} — i.e. the `json` output format.
 *
 * This interface **is** the schema: nothing parses the blob, so the TypeScript
 * type is its only contract. `M` is the caller's metadata shape (the extraction
 * package supplies its own `Metadata`), which keeps this package free of any
 * engine or metadata dependency.
 */
export interface ExtractionDocument<M> {
  /** Plain text rendered from the cleaned HTML. */
  text: string;
  /** The cleaned HTML itself. */
  html: string;
  /** Markdown rendered from the cleaned HTML. */
  markdown: string;
  metadata: M;
  /** The page type the engine's classifier routed extraction through. */
  pageType: string | null;
  /** Classifier confidence in `pageType` (0–1). */
  confidence: number | null;
  /** Typed diagnostics from the cleaning pipeline. */
  messages: Message[];
}
