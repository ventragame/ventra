import UIKit
import Capacitor

/** The Capacitor 6 app is pinned to iOS 13+; register the on-device
 * speech plugin explicitly rather than relying on auto-discovery. */
class VentraBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(VentraSpeechPlugin())
    }
}
