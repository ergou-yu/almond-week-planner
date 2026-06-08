# Windows Release Notes

The Windows desktop package is an Electron shell that opens the production app:

```text
https://almond-week-planner.vercel.app/app
```

Build the portable Windows package:

```bash
./scripts/build-windows.sh
```

Output:

```text
public/downloads/almond-week-planner-windows-x64-v0.1.0.zip
```

The ZIP contains a portable Windows app with `杏花周计划.exe`. It is unsigned, so Windows SmartScreen may warn first-time users. A public installer or Microsoft Store release should use a code-signing certificate.
