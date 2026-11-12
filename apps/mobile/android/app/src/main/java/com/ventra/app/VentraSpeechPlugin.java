package com.ventra.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Ventra speech - Android 12+ on-device ONLY.
 * No remote recognizer fallback, no recording saved, no speech transcript logs.
 * The child must tap the microphone button. Stop/timeout releases the engine.
 */
@CapacitorPlugin(name = "VentraSpeech",
    permissions = {@Permission(alias = "microphone", strings = {Manifest.permission.RECORD_AUDIO})})
public class VentraSpeechPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private PluginCall pending;
    private Runnable timeoutAction;
    private boolean listening;

    private boolean supported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject status = new JSObject();
        boolean available = supported();
        status.put("available", available);
        if (!available) status.put("reason", "on-device English recognition is unavailable");
        call.resolve(status);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        if (!supported()) {
            call.reject("on-device recognition unavailable");
            return;
        }
        if (pending != null || listening) {
            call.reject("recognition busy");
            return;
        }
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphonePermission");
            return;
        }
        startRecognition(call);
    }

    @PermissionCallback
    private void microphonePermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) startRecognition(call);
        else call.reject("permission denied");
    }

    private void startRecognition(PluginCall call) {
        if (!supported()) { call.reject("on-device recognition unavailable"); return; }
        if (pending != null || listening) { call.reject("recognition busy"); return; }
        pending = call;
        final int timeout = Math.max(3000, Math.min(12000, call.getInt("timeoutMs", 8000)));
        final String language = call.getString("lang", "en-US");
        try {
            recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}
                @Override public void onError(int error) {
                    finish(null, error == SpeechRecognizer.ERROR_NO_MATCH ||
                        error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT ? "no-speech" : "recognizer error " + error);
                }
                @Override public void onResults(Bundle results) {
                    ArrayList<String> alternatives = results == null ? null :
                        results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    JSObject response = new JSObject();
                    JSArray list = new JSArray();
                    if (alternatives != null) {
                        for (int i = 0; i < Math.min(4, alternatives.size()); i++) {
                            String value = alternatives.get(i);
                            if (value != null && !value.trim().isEmpty()) list.put(value.trim());
                        }
                    }
                    response.put("alternatives", list);
                    finish(response, null);
                }
            });
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 4);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            listening = true;
            timeoutAction = () -> finish(null, "speech.timeout");
            handler.postDelayed(timeoutAction, timeout);
            recognizer.startListening(intent);
        } catch (Exception error) {
            Log.w("VentraSpeech", "On-device recognizer unavailable");
            finish(null, "on-device recognition unavailable");
        }
    }

    private void finish(JSObject result, String error) {
        if (timeoutAction != null) handler.removeCallbacks(timeoutAction);
        timeoutAction = null;
        SpeechRecognizer previous = recognizer;
        recognizer = null;
        if (previous != null) {
            try { previous.cancel(); previous.destroy(); } catch (Exception ignored) {}
        }
        listening = false;
        PluginCall finished = pending;
        pending = null;
        if (finished != null) {
            if (error != null) finished.reject(error);
            else if (result != null) finished.resolve(result);
            else finished.reject("cancelled");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        finish(null, "cancelled");
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        finish(null, "cancelled");
        super.handleOnDestroy();
    }
}
