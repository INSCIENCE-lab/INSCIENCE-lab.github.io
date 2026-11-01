# Mobile interaction review — 2026-11-01

## Changes
- Removed automatic sunrise/sunset playback in all four Light languages. Day-arc position remains a manual physical parameter beside the scene.
- Replaced fixed-pixel canvas loading text with wrapping, responsive DOM text and an accessible status region.
- Preserve the previous sky raster during a replacement solve and explicitly label it as the previous result. Live values are unavailable and recording is disabled until the current solve completes.
- Cancel superseded workers and workers left behind on navigation, including when returning to a cached result.
- Added expandable scenes and diagram scaling next to Light illustrations; the prism retains its own physical viewport and drag controls. Solar close-up retains its own field-of-view selector.
- Larger touch targets, wrapping field labels, scrollable enlarged diagrams, explicit touch-action for prism dragging.
- Updated descriptions to match manual, stationary sky calculations.

## Verification
- Actual browser loaded all 10 Light simulations at 390px and 320px outer-frame widths (375/305 CSS content pixels with a visible desktop scrollbar), without document-level horizontal overflow.
- All non-sky scenes checked at tablet width 768px; sky also checked at 1200px.
- Animated Light experiments: start/pause and record operations completed. Diagram scaling to 3x keeps overflow inside the scene viewport.
- Ukrainian, English, Italian and Spanish sky loading notices wrap at narrow width. The day-position control is beside the scene; the removed autoplay button is absent.
- Initial sky solve completes; subsequent parameter change retains the ready-image marker while showing the pending-result notice and disabling recording.
- Existing physical suite passed (222 checks, 600 parameter sets, atmospheric/transport/camera benchmarks). Additional lifecycle regression covers stale responses, navigation cancellation and cached-result cancellation.
- Related Energy and Gravity browser checks covered all 13 experiments, start/pause/step for animated experiments, and a 320px frame without document-level overflow. Their touch-target/diagram changes are tracked in the respective repositories.

## Limits
Browser checks use narrow same-origin frames in Chrome, not physical iPhone/Android devices. Hardware touch gestures and Safari-specific behavior still warrant device testing. No physical equations, transport sampling counts or optical data were changed. No claim of photometric validation is added by these interface checks.
