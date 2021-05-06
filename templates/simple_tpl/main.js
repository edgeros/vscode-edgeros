#! /bin/javascript

/*
 * Copyright (c) 2020 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: main.js.
 *
 * Author: liping@acoinfo.com
 *
 */
const Web = require('webapp');
const bodyParser = require('middleware').bodyParser;
const iosched = require('iosched');

/* Whether the app was awakened by a shared message */
if (ARGUMENT != undefined) {
	console.log('Awakened by share message:', ARGUMENT);
}

// Create app.
const app = Web.createApp();

app.use(bodyParser.json());
app.use(Web.static('./public', { index: ['index.html', 'index.htm'] }));

app.use('/', require('./routers'));

// Start app.
app.start();

/*
 * Event loop
 */
iosched.forever();
