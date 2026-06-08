import SwiftUI
import WebKit

private let appURL = URL(string: "https://almond-week-planner.vercel.app/app")!

struct ContentView: View {
  var body: some View {
    PlannerWebView(url: appURL)
      .ignoresSafeArea(.container, edges: .bottom)
  }
}

struct PlannerWebView: UIViewRepresentable {
  let url: URL

  func makeUIView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.allowsInlineMediaPlayback = true

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.navigationDelegate = context.coordinator
    webView.allowsBackForwardNavigationGestures = true
    webView.customUserAgent = "AlmondWeekPlanneriOS/0.1.0"
    webView.load(URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30))
    return webView
  }

  func updateUIView(_ uiView: WKWebView, context: Context) {}

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  final class Coordinator: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
      guard let url = navigationAction.request.url else {
        decisionHandler(.allow)
        return
      }

      if url.scheme == "http" || url.scheme == "https" {
        decisionHandler(.allow)
        return
      }

      UIApplication.shared.open(url)
      decisionHandler(.cancel)
    }
  }
}
