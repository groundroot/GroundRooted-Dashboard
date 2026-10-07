# React Bits adaptations

## Active background update — 2026-09-22

Lightfall replaces MoltenMetal in the hero. Upstream: `src/ts-tailwind/Backgrounds/Lightfall/Lightfall.tsx` at revision `9481af758aae6cfb34c3652ec40a1c099360331f`. Unmodified source: `website/vendor/react-bits/Lightfall.tsx.txt`. Original shaders are retained; project adaptation adds a light blue palette, disabled pointer interaction, lazy loading, DPR 1 / 30fps caps, frozen-time pause, reduced-motion/visibility/intersection handling, WebGL failure fallback and cleanup. The previous component remains unused for provenance.

`components/marketing/FooterStarField.tsx` is original project code using Canvas 2D, NOT React Bits Pro Star Burst. No paid source or preview assets are included.

2026-09-20 latest design override: CleanShot-inspired light theme. MoltenMetal now uses light blue/white, lightMode=true, opacity 0.2. User forbids shadows, hover effects and decorative strokes. SpotlightCard is now a static server-rendered shell: pointer listeners, RAF and glow element removed. Earlier table descriptions of pointer glow are historical, not current behavior. Other non-hover animation and accessibility requirements remain.

Upstream: https://github.com/DavidHDev/react-bits

Pinned revision: `2ec034e04f9f8e2ca30335415d8834f468558f5b` (reviewed 2026-09-20).
License: **MIT + Commons Clause**, preserved verbatim in [LICENSE.md](LICENSE.md).
These are adapted components, not an unmodified package or a component resale product.
Unmodified reference copies are kept in `website/vendor/react-bits/*.tsx.txt`.

All upstream paths below are relative to `src/ts-tailwind/` at the pinned revision.

| Local component | Upstream path | Local changes |
| --- | --- | --- |
| MoltenMetal | Backgrounds/MoltenMetal/MoltenMetal.tsx | Original shader; dark neutral palette for DESIGN.md; reduced motion, lazy load, 30 FPS ceiling, capped DPR, pause/visibility/intersection lifecycle, WebGL fallback and resource disposal. |
| AnimatedContent | Animations/AnimatedContent/AnimatedContent.tsx | Lazy GSAP, small translate/scale entrance, readable SSR without opacity hiding, reduced-motion matchMedia and cleanup. |
| StatusMark | Micro/StatusMark/StatusMark.tsx | Korean clipboard states, no strike-through, readable labels, semantic dark-theme colors, removed idle breathing. |
| SpotlightCard | Components/SpotlightCard/SpotlightCard.tsx | CSS-variable/rAF pointer position instead of state, no touch/reduced-motion tracking, monochrome glow and focus-within. |
| SplitText | TextAnimations/SplitText/SplitText.tsx | Lazy GSAP/plugin after fonts, word-level Korean animation, visible SSR, aria:none to preserve native text semantics, reduced motion and revert. |
| Stepper | Components/Stepper/Stepper.tsx | Native step navigation, keyboard/focus, aria-current/status, persistent last step and replay, no zero-height stage, no-script explanation, reduced-motion transitions. |

Additional story/comparison compositions in `components/marketing/` are project code, not upstream React Bits components. Comparison uses Base UI Tabs; story uses GSAP ScrollTrigger.

Dependencies and exact resolutions are in `package.json` / `pnpm-lock.yaml` (OGL, GSAP, Motion, React). Only viewport-near animation chunks load; styling is scoped to the marketing page. Changes to upstream revisions require renewed visual, accessibility and runtime checks.
# 2026-09-22 추가 수정

Emil 디자인 지침에 따라 AnimatedContent/SplitText 진입을 240ms로 단축했다. Stepper는 키보드 입력을 즉시 반영하고 포인터 입력만 180ms transform으로 전환한다. exit 대기로 이전 장면을 유지하지 않는다. 그림자/hover/장식선 금지와 원본 라이선스는 그대로 유지한다.
