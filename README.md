# Flowlog — split version

Drop these files into your `ToDoList` project like this:

```
src/
  utils/time.js
  components/Timeline.jsx
  components/TaskList.jsx
  components/TimerPanel.jsx
  components/SessionLog.jsx
  Flowlog.jsx
  Flowlog.css
```

Then in your `src/App.jsx`, render it:

```jsx
import Flowlog from "./Flowlog";

function App() {
  return <Flowlog />;
}

export default App;
```

## Dependency

Make sure `lucide-react` is installed:

```
npm install lucide-react
```

## Note on storage

The original artifact used a Claude-only `window.storage` API. Since this now runs
in a real browser, I swapped it for plain `localStorage` in `Flowlog.jsx` — no setup
needed, it just works.
