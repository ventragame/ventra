# Animal Meadow — English speech verification

The catalog has 40 animal names but only four legacy recorded WAV files.
The other 36 now use the device OS (Capacitor Android/iOS) or Web Speech
(browser). Do not describe this as 40 studio-recorded pronunciations.

**Native:** Capacitor 6 uses `@capacitor-community/text-to-speech@4.1.1`,
with English US language, a ranked installed voice, interruption and volume
controls. **Browser:** Web Speech uses the same voice preference. The four
legacy WAV files remain a fallback when TTS fails. For any other word with
no functioning English TTS engine, the listening exercise exposes assisted
text rather than silently grading a failed sound.

On the real Android APK test cow, giraffe, octopus, parrot, plus cat.
Check repeated taps, mission switches, volume zero, mute, background/return,
offline mode, and all five missions. Rebuild a NEW APK (the previous binary
does not have the native plugin). On Android a local English TTS voice may
need installing in system Text-to-speech output settings.

Build web: `npm ci && npm run type-check && npm --workspace=apps/web run test:ci && npm run build:web`.
Build mobile: `npm run export:mobile`, then Android assembleDebug or Xcode
simulator build. Real-device audio and voice naturalness still require testing.

A uniform, professionally voiced offline catalog requires licensed voice
recordings for all 40 words and prompts. This change improves runtime
coverage and error recovery; quality depends on the device voice engine.
