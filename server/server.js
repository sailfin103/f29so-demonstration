// CONSTANTS
const port = 2000;

// IMPORTS
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const debug = require('debug')('server');
// const csurf = require('csurf');
const db = require('./src/db');
const { genPreview } = require('./src/preview-gen');

// EXPRESS STUFF
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
// init the walls sockets
require('./src/walls')(io);

app.set('socketio', io);

debug(`Started server on port ${port}`);

db.init();

httpServer.listen(port, () => {
  debug(`Listening on port ${port}`);
});

// CSRF (add later when implemented into front-end)
// const csrfMiddleware = csurf({
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//   },
// });

// app.use(csrfMiddleware);

app.use(helmet());

app.use('/static', express.static(path.join(__dirname, './static/')));

app.use('/api', require('./src/routes/api'));

// app.use(require('./walls'));

app.get('/', (req, res) => {
  debug('GET /');
  // res.cookie('CSRF-Token', req.csrfToken());
  res.sendFile(path.join(__dirname, './static/index.html'));
});

// OTHER FUNCTIONS

/**
 * Generate preview PNGs for all walles
 */
function genPreviews() {
  const wallIDs = db.getAllWallIDs();
  debug('Generating previews for %d walles', wallIDs.length);
  debug(wallIDs);

  debug('Started generating previews...');
  wallIDs.forEach((wallID) => {
    debug(`Preview for ID ${wallID}`);

    const meta = db.getWallMetadata(wallID);
    const pixels = db.getWallPixels(wallID);

    const preview = genPreview(pixels, meta.width, meta.height);

    // fs.writeFileSync(`previews/${wallID}.png`, preview); // test

    db.setWallPreview(wallID, preview);
  });
  debug('Done generating previews');
}

// TEST STUFF
// genPreview(db.getWallPixels(1), 4, 2);

genPreviews();
