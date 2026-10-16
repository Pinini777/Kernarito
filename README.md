# Kernarito — interactive Kernaro prototype

An offline, front-end-only concept based on the supplied Kernaro screenshots. No backend, build, package installation, account, API key or Internet connection is required.

## Open

Double-click `index.html` in this folder. Keep `app.js`, `mock-core.js`, `styles.css` and `assets/` alongside it. Any current desktop browser can run the demo. Clipboard access may be restricted when opened as a local file; all other interactions work without a server.

## Try the experience

1. The page opens with an empty chat, the supplied Kernaro welcome text and zero usage. No previous conversation is preloaded.
2. Select **Nuevo chat** or type any message. Enter sends; Shift+Enter adds a line.
3. The initial role is **Default**, a general assistant. Select it or one of the four specialist roles using the chip below the input. Each role keeps its own four animated operation steps. Any submitted message returns the same complete, formatted **Repositorio Telco - ML2 (Claro Perú)** example supplied by the user, regardless of role or prompt. The demo does not verify these statements against a real repository.
4. Use the model picker at the bottom of the chat composer to select **Claude opus 5.5**, **Fable 5.1**, **GPT 6 LUNA** or **GPT 6 SOL**. All model names are illustrative, as requested; inclusion does not claim availability or Kernaro compatibility. Open **Esfuerzo** to reveal the four-position slider, then drag it (or use its arrow keys) to change the simulated duration and usage. The picker supports arrow keys, Home/End, Enter and Escape.
5. Expand the activity steps, browse the example repository and select context. The right panel stacks the repository and one unified **Consumo y créditos** card, combining the available credit balance, query usage and accumulated conversation totals; scroll to see the full card.
6. Watch the token, fictional USD and credit counters. The clock measures the local animation, not model latency. The stop button interrupts the animation. New conversations and history are kept only in memory until the page closes or reloads.

## Important limits

- This is not a Sparx Systems product, a connected AI client or a performance benchmark.
- Answers, repository contents, operation details, token counts, rates and credits are fictional. The demo does not interpret arbitrary questions, inspect files or make changes to EA.
- The **Razonamiento** panel is a scripted activity visualization. It is not a model's private chain of thought.
- The credits use an invented conversion, with a starting allowance of 500 per conversation. USD coefficients are fictional and must not be quoted as prices.
- User text is rendered as text, never as HTML. No prompts are persisted or sent to any server.
- The supplied Kernaro logo is used only to illustrate this requested mockup. Kernaro and Enterprise Architect belong to their respective owners. The prototype uses original inline SVG interface icons, system fonts and browser APIs, without third-party dependencies.
- Existing documentation HTML files in this folder are left unchanged and are not required to run the prototype.

## Checks

Requires Node.js only for development checks, not for opening the demo:

```text
node --test core.test.cjs
node --check app.js
node --check mock-core.js
```

## GitHub Pages

Publication target: https://pinini777.github.io/Kernarito/

Publish the `main` branch from the repository root (`/`) in GitHub Pages settings. The `.nojekyll` marker serves the existing HTML/CSS/JavaScript without a build or dependencies. Only the prototype files are included; private notes and supplied documentation are excluded.
