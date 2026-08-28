# Game that we will abandon in 6 or 7 days.

<img src="docs/sheep.png" alt="sheep" height="300">

High level idea: we make a box and we hit people in the box

## Devloper

You need Node 26+. You can switch to Node 26 with `nvm use 26`.

```sh
npm install
npm run dev
```

Open this in your browser: http://localhost:6767/

> [!TIP]
> **Why is there a http://localhost:6767/ and http://localhost:6769/?**
>
> In `npm run dev`, port 6767 is an esbuild server serving the client assets. This ensures that when you save a client-side change and reload, the changes will always reflect the latest build because esbuild will withhold finishing the request until it builds. Otherwise, you could reload too soon before a rebuild and get a stale build.
>
> Instead, the server is hosted on 6769. The client will autoreconnect when the server restarts on build.

Check types:

```sh
npx tsc
```

Final build:

```sh
npm run build
npm start
```

GitHub Pages preview:

```sh
GITHUB_PAGES=true npm run build
npm i -g http-server
http-server public -c-1 -s
```

# High Level Overview

```javascript
/groot
|- index.js
|- assets
|- src
    |- render.ts
    |- objects.ts
    |- rooms
        |- room.ts
        |- arena.ts
    |- player.ts
```

# Higher Level Overview

```
/root
|- game! :)
```
