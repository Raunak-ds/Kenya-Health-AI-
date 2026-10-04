# Run in VS Code

Open the `frontend` folder in VS Code (File > Open Folder).

## Option A: Live Server (easiest, UI preview)
1. Install the **Live Server** extension (Ritwick Dey).
2. Right-click `static/index.html` > **Open with Live Server**.
3. Hard-refresh once (Ctrl+Shift+R / Cmd+Shift+R).

## Option B: Terminal (VS Code: Terminal > New Terminal)
```bash
python3 -m http.server 8000
```
Open http://localhost:8000/static/index.html

## Option C: Full app with your FastAPI backend
Copy this `frontend` folder over your backend's existing one, then run `python run.py`
and open http://127.0.0.1:8000

Without the backend the landing, sign-in and register screens show; data screens need the API.
If you see old colours: DevTools > Application > Service Workers > Unregister, then hard-refresh.

Accent colour: change `--pulse-accent` (ice blue #5CB8FF) at the top of `static/pulse-theme.css`; gradients live in `static/pulse-blue.css`.
