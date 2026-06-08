import Cocoa
import WebKit

private let appURL = URL(string: "https://almond-week-planner.vercel.app/app")!

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
  private var window: NSWindow!
  private var webView: WKWebView!

  func applicationDidFinishLaunching(_ notification: Notification) {
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

    webView = WKWebView(frame: .zero, configuration: configuration)
    webView.navigationDelegate = self
    webView.allowsBackForwardNavigationGestures = true
    webView.customUserAgent = "AlmondWeekPlannerMac/0.1.0"

    let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1280, height: 820)
    let windowSize = NSSize(width: min(1320, screenFrame.width * 0.86), height: min(880, screenFrame.height * 0.86))
    let origin = NSPoint(
      x: screenFrame.midX - windowSize.width / 2,
      y: screenFrame.midY - windowSize.height / 2
    )

    window = NSWindow(
      contentRect: NSRect(origin: origin, size: windowSize),
      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    window.title = "杏花周计划"
    window.titlebarAppearsTransparent = true
    window.isMovableByWindowBackground = true
    window.minSize = NSSize(width: 390, height: 680)
    window.contentView = webView
    window.makeKeyAndOrderFront(nil)

    webView.load(URLRequest(url: appURL, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30))
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }

  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.allow)
      return
    }

    if url.scheme == "http" || url.scheme == "https" {
      decisionHandler(.allow)
      return
    }

    NSWorkspace.shared.open(url)
    decisionHandler(.cancel)
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
app.run()
