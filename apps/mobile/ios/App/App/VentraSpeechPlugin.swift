import Foundation
import Capacitor
import AVFoundation
import Speech

/** Capacitor 6 local plugin. On-device recognition is mandatory.
 * No server fallback, audio persistence or transcription logging.
 */
@objc(VentraSpeechPlugin)
public class VentraSpeechPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VentraSpeechPlugin"
    public let jsName = "VentraSpeech"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listen", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private let audioEngine = AVAudioEngine()
    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var pending: CAPPluginCall?
    private var timeout: Timer?
    private var session = UUID()
    private var tapInstalled = false

    @objc func getStatus(_ call: CAPPluginCall) {
        let recognition = SFSpeechRecognizer(locale: Locale(identifier: "en_US"))
        let available = recognition?.supportsOnDeviceRecognition == true && recognition?.isAvailable == true
        call.resolve([
            "available": available,
            "reason": available ? "" : "on-device English recognition unavailable"
        ])
    }

    @objc func listen(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.pending == nil else { call.reject("recognition busy"); return }
            let recognition = SFSpeechRecognizer(locale: Locale(identifier: "en_US"))
            guard let recognizer = recognition, recognizer.supportsOnDeviceRecognition, recognizer.isAvailable else {
                call.reject("on-device recognition unavailable")
                return
            }
            self.pending = call
            self.recognizer = recognizer
            self.session = UUID()
            let session = self.session
            SFSpeechRecognizer.requestAuthorization { status in
                DispatchQueue.main.async {
                    guard self.session == session, self.pending != nil else { return }
                    guard status == .authorized else { self.finish(error: "permission denied"); return }
                    AVAudioSession.sharedInstance().requestRecordPermission { allowed in
                        DispatchQueue.main.async {
                            guard self.session == session, self.pending != nil else { return }
                            guard allowed else { self.finish(error: "permission denied"); return }
                            self.beginCapture(call: call)
                        }
                    }
                }
            }
        }
    }

    private func beginCapture(call: CAPPluginCall) {
        guard pending != nil, let recognizer = recognizer else { return }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .duckOthers])
            try session.setActive(true)

            let newRequest = SFSpeechAudioBufferRecognitionRequest()
            newRequest.requiresOnDeviceRecognition = true
            newRequest.shouldReportPartialResults = false
            newRequest.taskHint = .confirmation
            request = newRequest

            let input = audioEngine.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.sampleRate > 0 else {
                finish(error: "microphone unavailable")
                return
            }
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
                newRequest.append(buffer)
            }
            tapInstalled = true
            audioEngine.prepare()
            try audioEngine.start()

            task = recognizer.recognitionTask(with: newRequest) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self = self, self.pending != nil else { return }
                    if let result = result, result.isFinal {
                        let alternatives = Array(result.transcriptions.prefix(4)).map { $0.formattedString }
                        self.finish(alternatives: alternatives)
                    } else if error != nil {
                        self.finish(error: "no-speech")
                    }
                }
            }

            let ms = min(12000, max(3000, call.getInt("timeoutMs") ?? 8000))
            timeout = Timer.scheduledTimer(withTimeInterval: Double(ms)/1000, repeats: false) { [weak self] _ in
                self?.finish(error: "speech.timeout")
            }
        } catch {
            finish(error: "microphone unavailable")
        }
    }

    private func cleanup() {
        timeout?.invalidate()
        timeout = nil
        if audioEngine.isRunning { audioEngine.stop() }
        if tapInstalled {
            audioEngine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        recognizer = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func finish(alternatives: [String]? = nil, error: String? = nil) {
        guard let call = pending else { cleanup(); return }
        pending = nil
        cleanup()
        if let error = error {
            call.reject(error)
        } else {
            call.resolve(["alternatives": alternatives ?? []])
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.session = UUID()
            self.finish(error: "cancelled")
            call.resolve()
        }
    }

    // Capacitor 6 CAPPlugin does not expose an overridable handleReset().
    // JavaScript stop() and the standard engine timeout own capture cleanup.
}
