# Liam's Adventure

A touch-friendly, iPad-ready dinosaur-island letters and numbers game. It runs as a small static website and saves stars, voice preference, and progress locally in the browser. Answer tiles speak their letters or numbers in English with encouraging feedback through the device's built-in speech voice. Use the **VOICE** button to mute or turn speech back on.

## Run it

Open `index.html` in a browser for a quick local preview. For the iPad home-screen and offline experience, serve this folder over HTTPS (or localhost):

```sh
python3 -m http.server 8000
```

On the iPad, open the hosted address in Safari and use **Share → Add to Home Screen**. The app has no build step, account, or external asset dependency.

## Play

- Dino Letter Hunt starts with A–E and grows in five-letter sets to Z after completed quests.
- Feed the T-Rex starts with 1–5 and grows in five-number sets to 20.
- Liam's Name Game practices L–I–A–M in order.
- Fossil Code asks the player to remember and find a short sequence.
- The parent area shows stars, completed quests, level, and the next set. Reset is available there.

Progress and the voice preference are stored in this browser's local storage. Speech uses the browser's built-in English voice; voice availability depends on the device and browser settings. There is no account or network tracking.
