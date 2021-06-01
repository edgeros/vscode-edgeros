/*
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: main.js.
 *
 * Author: hanhui@acoinfo.com
 *
 */

/* Import system modules */
const WebApp = require('webapp');

/* Import routers */
const myrouter = require('./routers/rest');

/* Create App */
const app = WebApp.createApp();

/* Set static path */
app.use(WebApp.static('./public'));

/* Set test rest */
app.use('/api', myrouter);

/* Rend test */
app.get('/temp.html', function(req, res) {
	res.render('temp', { time: Date.now() });
});

/* Start App */
app.start();

/* Event loop */
require('iosched').forever();
