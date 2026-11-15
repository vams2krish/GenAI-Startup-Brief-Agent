# Brief Studio UI

[Open the Vercel demo](https://genai-startup-brief-agent.vercel.app/) · [Project setup](../README.md)

The idea and brief sit side by side on desktop and stack on mobile. Start with an example or enter your own idea and context. The model selector appears when the local Ollama bridge is available. The public demo uses illustrative content.

| Token | Color | Role |
| --- | --- | --- |
| Canvas | #F6F7F2 | Warm background |
| Paper | #FFFFFF | Panels |
| Ink | #16251F | Primary text |
| Forest | #163F32 | Hero and primary actions |
| Lime | #DAFA84 | Hero accent |
| Mint | #E9F2E6 | Status badge and hover |
| Muted | #52635A | Secondary text |
| Border | #D9E2D9 | Controls and panels |
| Error | #912D39 | Error feedback |

[Styles](public/styles.css) pair Georgia headings with system UI body text and monospace labels. Controls have visible keyboard focus, and generation status and errors are announced.

After following the [local prerequisites](../README.md#run-with-local-ollama), run:

```powershell
npm --prefix ui ci
npm --prefix ui start
```

Visit [127.0.0.1:3000](http://127.0.0.1:3000). The root [Vercel configuration](../vercel.json) serves the static demo.

## Screenshots

- [Empty desktop workspace](../docs/screenshots/01-workspace.png)
- [Example brief](../docs/screenshots/02-example-brief.png)
- [Markdown export](../docs/screenshots/03-export.png)
- [Mobile view](../docs/screenshots/04-mobile.png)
- [Live Ollama brief](../docs/screenshots/05-local-ollama.png)
- [Error recovery](../docs/screenshots/06-recovery.png)
