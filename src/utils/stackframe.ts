import * as stackTraceParser from 'stacktrace-parser';

// @internal
export type StackFrame = stackTraceParser.StackFrame;

// @internal
export function getFrames(): StackFrame[] {
    const stack = new Error().stack;

    if (stack == null) {
        return [];
    }

    const frames = stackTraceParser.parse(stack);
    return frames.reverse();
}

// @internal
export function getStackFrame(depth: number): StackFrame {
  const frames = getFrames();
  return frames[depth];
}
