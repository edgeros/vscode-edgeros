'use strict';
import * as fs from 'fs';
import * as path from 'path';
const { stat, unlink } = fs.promises;
import { EventEmitter } from 'events';
import { inherits, promisify } from 'util';
import * as assert from 'assert';
const pipe = require('pipe-io');
const tryToCatch = require('try-to-catch');

const mkdirp = require('mkdirp');
const yazl = require('yazl');
const yauzl = require('yauzl');

const superfind = require('./superfind');

inherits(OneZip, EventEmitter);

// module.exports = onezip;
export const pack = onezip('pack');
export const extract = onezip('extract');

function check(from: string, to: string, files?: string[]) {
    assert(typeof from === 'string', 'from should be a string!');
    assert(/string|object/.test(typeof to), 'to should be string or object!');

    if (arguments.length > 2)
        {assert(Array.isArray(files), 'files should be an array!');}
}

function checkOperation(operation: string) {
    if (!/^(pack|extract)$/.test(operation))
        {throw Error('operations could be "pack" or "extract" only!');}
}

function onezip(operation: string) {
    checkOperation(operation);

    return (from: string, to: string, files?: string[]) => {
        // @ts-ignore
        return new OneZip(operation, from, to, files);
    };
}

export function OneZip(operation: string, from: string, to: string, files: string[]) {
    if (operation === 'extract')
        {check(from, to);}
    else
        {check(from, to, files);}

    process.nextTick(async () => {
        // @ts-ignore
        EventEmitter.call(this);
        this._i = 0;
        this._n = 0;

        this._percent = 0;
        this._percentPrev = 0;

        this._names = [];

        if (operation === 'pack') {
            this._from = endSlash(from);
            this._to = to;

            if (!files.length)
                {return this.emit('error', Error('Nothing to pack!'));}

            await this._parallel(from, files);

            if (this._abort)
                {return this.emit('end');}

            this._pack();

            return;
        }

        this._from = from;
        this._to = endSlash(to);

        const [error] = await tryToCatch(this._parse.bind(this), from);

        if (error)
            {return this.emit('error', error);}

        this._extract(from);
    });
}

OneZip.prototype.abort = function () {
    this._abort = true;
};

OneZip.prototype._parallel = async function (from: string, files: string[]) {
    const promises = [];

    for (const name of files) {
        const full = path.join(from, name);
        promises.push(this._findFiles(full));
    }

    const all = Promise.all.bind(Promise, promises);
    const [error] = await tryToCatch(all);

    if (error) {
        this.emit('error', error);
        this.abort();
    }
};

OneZip.prototype._findFiles = async function (filename: string) {
    const { names } = await superfind(filename);

    this._n = names.length;
    this._names = names;
};

OneZip.prototype._pack = async function () {
    this.emit('start');
    const {
        _to,
        _from,
        _names,
    } = this;

    const zipfile = new yazl.ZipFile();

    const end = (name: string) => {
        this.emit('file', name);
        this._progress();
    };
    for (const _name of _names) {
        let filename = _name.replace(_from, '');
        let tmp = filename.split(/\\/i);
        tmp.shift();
        if (!tmp.length) {
            end(_name);
            continue;
        }
        filename = tmp.join('/');
        const [error, data] = await tryToCatch(stat, _name);
        if (error)
            {return this.emit('error', error);}

        if (data.isDirectory()) {
            zipfile.addEmptyDirectory(filename);
            end(_name);
            continue;
        }

        const stream = this._createReadStream(_name, () => {
            end(_name);
        });

        zipfile.addReadStream(stream, filename);
    }

    zipfile.end();

    const streamFile = typeof _to === 'object' ?
        _to : fs.createWriteStream(_to);

    const [errorPipe] = await tryToCatch(pipe, [
        zipfile.outputStream,
        streamFile,
    ]);

    if (errorPipe)
        {return this.emit('error', errorPipe);}

    if (!this._abort)
        {return this.emit('end');}

    await this._unlink(_to);
};

OneZip.prototype._createReadStream = function (filename: string, end: any) {
    return fs.createReadStream(filename)
        .on('error', (error: Error) => {
            this.emit('error', error);
        })
        .on('end', end);
};

OneZip.prototype._onOpenReadStream = function (success: (rs: any) => void) {
    return (error: Error, readStream = {}) => {
        if (error)
            {return this.emit('error', error);}

        success(readStream);
    };
};

OneZip.prototype._unlink = async function (to: string) {
    const [error] = await tryToCatch(unlink, to);

    if (error)
        {return this.emit('error', error);}

    this.emit('end');
};

OneZip.prototype._parse = promisify(function (from: string, fn: Function) {
    yauzl.open(from, (error: Error, zipfile:any) => {
        if (error)
            {return fn(error);}

        zipfile.on('entry', () => {
            ++this._n;
        });

        zipfile.once('end', fn);
    });
});

OneZip.prototype._extract = function (from: string) {
    this.emit('start');

    const lazyEntries = true;
    const autoClose = true;
    const options = {
        lazyEntries,
        autoClose,
    };

    yauzl.open(from, options, (error: Error, zipfile:any) => {
        const handleError = (error: Error) => {
            this.emit('error', error);
        };

        if (error)
            {return handleError(error);}

        zipfile.readEntry();
        zipfile.on('entry', async (entry:any) => {
            const { fileName } = entry;
            const fn = (error: Error) => {
                if (error)
                    {return handleError(error);}

                this._progress();
                this.emit('file', fileName);
                zipfile.readEntry();
            };

            const name = path.join(this._to, fileName);

            if (/\/$/.test(fileName)) {

                const [e] = await tryToCatch(mkdirp, name);
                return fn(e);
            }

            zipfile.openReadStream(entry, this._onOpenReadStream(async (readStream: fs.ReadStream) => {
                const [e] = await tryToCatch(this._writeFile, name, readStream);
                fn(e);
            }));
        });

        zipfile.once('end', () => {
            this.emit('end');
        });
    });
};

OneZip.prototype._writeFile = async (fileName: string, readStream: fs.ReadStream) => {
    const writeStream = fs.createWriteStream(fileName);
    await pipe([
        readStream,
        writeStream,
    ]);
};

OneZip.prototype._progress = function () {
    ++this._i;

    const value = Math.round(this._i * 100 / this._n);

    this._percent = value;

    if (value !== this._percentPrev) {
        this._percentPrev = value;
        this.emit('progress', value);
    }
};

function endSlash(str: string) {
    const last = str.length - 1;

    if (str[last] === path.sep)
        {return str;}

    return str + path.sep;
}

