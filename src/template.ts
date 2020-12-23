import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import * as http from 'http';

const updateUrl = `http://localhost:5000/tpls.json`;
const tplsPath = path.join(__dirname, '..', 'templates', 'tpls.json');

function updateTemplate(url: string):Promise<boolean> {
  return new Promise((resolve) => {
    var writeStream = fs.createWriteStream(tplsPath);
    http.get(url, (data) => {
      data.on('data', (chunk) => {
        writeStream.write(chunk);
      });
      //
      data.on('end', () => {
        writeStream.close();
        console.log(`更新模板完毕！`);
        console.log('\n');
        resolve(true);
      });
      //
    });
  });
}

