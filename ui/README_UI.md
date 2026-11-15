# Brief Studio UI

[Open live web research](https://genai-startup-brief-agent.vercel.app/) · [Project setup](../README.md)

The idea and brief sit side by side on desktop and stack on mobile. Start with an example or enter your own idea and context. The model selector appears when the local Ollama bridge is available. The hosted app uses live Tavily search and provides clickable sources. If search fails, the previous brief stays available.

| Token | Color | Role |
| --- | --- | --- |
| Canvas | #F7F5FC | Canvas background |
| Paper | #FFFFFF | Panels |
| Ink | #211C36 | Primary text |
| Violet | #352373 | Hero and primary actions |
| Peach | #FFD5AB | Hero accent |
| Lavender | #EEE7FC | Status badge and hover |
| Muted | #625A73 | Secondary text |
| Border | #E5DFF0 | Controls and panels |
| Error | #912D39 | Error feedback |

[Styles](public/styles.css) pair Georgia headings with system UI body text and monospace labels. Controls have visible keyboard focus, and generation status and errors are announced.

After following the [local prerequisites](../README.md#run-with-local-ollama), run:

```powershell
npm --prefix ui ci
npm --prefix ui start
```

Visit [127.0.0.1:3000](http://127.0.0.1:3000). The root [Vercel configuration](../vercel.json) serves the interface and research endpoint.

## Real examples

Expand a case to see an experiment you can adapt. Load an example to fill the form. If you have edited the draft, the app asks before replacing it.

- [Desktop gallery](../docs/screenshots/07-real-examples.png)
- [Loaded example brief](../docs/screenshots/08-loaded-example.png)
- [Mobile gallery](../docs/screenshots/09-mobile-examples.png)
