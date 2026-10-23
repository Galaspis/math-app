# Multiplication Table Practice App

A simple, interactive web app for children to practice multiplication tables. The interface is in Hebrew (right-to-left).

Try it: https://galaspis.github.io/math-app/

## Features

- Adjustable difficulty levels (up to 5×5, 10×10, 12×12, or 20×20)
- Progress saved locally on the device (no account needed), with a "reset all data" button
- Detailed stats per number, so you can see which tables need more practice
- Current and best streak
- Child-friendly interface with encouraging feedback

## Usage

Open `index.html` in any browser, or use the hosted link above. No server, build step or installation needed.

It is a plain web app with a web manifest, so it can be added to the home screen like an app (there is no service worker, so it still needs a connection on first load):

- **Android**: Chrome menu → "Add to Home screen"
- **iPhone**: Safari share button → "Add to Home Screen"

## Tech Stack

- HTML5, CSS3
- Vanilla JavaScript
- LocalStorage API for progress
- Hosted on GitHub Pages
