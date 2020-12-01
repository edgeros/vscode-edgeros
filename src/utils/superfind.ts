'use strict';

const findit = require('findit2');
import { EventEmitter } from 'events';
// const { promisify } = require('util');
import  { inherits, promisify } from 'util';

const add = (emitter:EventEmitter, event:string, result:object) => {
    emitter.on(event, (...args) => {
        // @ts-ignore
        result[event].push(args);
    });
};

const inhale: Function = promisify((emitter:EventEmitter, events:string[], fn:(...args:any[])=>void) => {
    const result = {};

    emitter.once('error', fn);

    for (const event of events) {
        // @ts-ignore
        result[event] = [];
        add(emitter, event, result);
    }

    emitter.once('end', () => {
        fn(null, result);
    });
});





const getFirst = ([a]:string[]) => a;

module.exports = async (filename:string) => {
    const finder = findit(filename);

    const {
        file,
        directory,
        link,
    } = await inhale(finder, [
        'file',
        'directory',
        'link',
    ]);

    const names = [
        ...file.map(getFirst),
        ...directory.map(getFirst),
        ...link.map(getFirst),
    ];

    return {
        file,
        directory,
        link,
        names,
    };
};

