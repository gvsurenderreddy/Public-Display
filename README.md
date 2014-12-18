Corkboard
=========

Installation
---
```bash
npm install
```

Dependencies are specified in `package.json`

Corkboard Frontend
---
The corkboard front end is based on [CSS3 cork board with sticky notes](https://geeksretreat.wordpress.com/2013/09/04/css3-cork-board-with-sticky-notes/).

fonts: `/static/fonts`

uploads by users: `/static/uploads`

style: `/static/css/corkboard.css`

image: `/static/img/`

js: `/static/js/`

### Post messages
URL + `/message/choosepos`


Corkboard Backend
---
### Deploy
```bash
node signaler.js
```

### signaler.js
 * Contains server logic

### baseurl.js
 * Fetches base url and store into `base_url`

### create.js
 * Defines how messages are sent and handled
 * Creates message based on html form and local storage

### convert.exe & identify.exe 
 * Used by node-imagemagick
 
Reference
---
 * [Simple Chat - Node.js + WebSockets](http://tech.pro/tutorial/1097/simple-chat-nodejs-plus-websockets)
 * [node-mysql](https://github.com/felixge/node-mysql)
 * [QRCode.js](http://davidshimjs.github.io/qrcodejs/)
 * [node-imagemagick](https://github.com/rsms/node-imagemagick)
 * [mmmagic](https://www.npmjs.org/package/mmmagic)