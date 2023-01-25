export const TraceType = {
  /** Impassable volume in the world. */
  SOLID: "solid",
  /**
   * Functionally similar to {@link SOLID} but wedge shaped,
   * with height increasing from zero to specified height in some direction.
   */
  STAIRS: "stairs",
  /**
   * Functionally similar to {@link SOLID} but zero height.
   */
  GROUND: "ground",
  /**
   * Space which triggers some logic when a body enters it.
   */
  EVENT: "event",
  /**
   * Ordered series of points linking one location to another.
   */
  PATH: "path",
  /**
   * Space shared with another level *in the same region*.
   * All traces within both levels in this space apply.
   * Also transports bodies to other level when fully encompassed.
   */
  POINTER: "pointer",
  /**
   * Logically similar to {@link POINTER} but functionally implemented as {@link EVENT}.
   * Does not affect physics or link other traces, but does transport bodies.
   */
  TRANSPORT: "transport",
  /**
   * Special case of {@link EVENT} that transports body to another location
   * (probably in another level).
   */
  SEND: "send",
} as const

export type TraceTypeType = (typeof TraceType)[keyof typeof TraceType]
