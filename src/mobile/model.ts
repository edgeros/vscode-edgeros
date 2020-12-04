import { Uri } from 'vscode';

export enum MobileType {
  IPhoneX = 'iphonex',
  IPhone8 = 'iphone8',
  Pixel = 'pixel1',
  Pad1 = 'ipad',
}
export interface MobileOptions {
  url: string;
  refresh: Uri;
  stop: Uri;
  close: Uri;
  dark: Uri;
  style: Uri;
  appjs: Uri;
  indexcss: Uri;
  mobileType: MobileType;
}

export function getMobileTemplate(opt: MobileOptions) {
  // return showIphonex(opt);
  switch (opt.mobileType) {
    default:
      return showIphonex(opt);
    case MobileType.IPhone8:
      return showIphone8(opt);
    case MobileType.Pixel:
      return showPixel(opt);
  }
}

function getHeadHtml(opt: MobileOptions) {
  const { style } = opt;
  var html = [];
  html.push('<!DOCTYPE html>');
  html.push('<html lang="en">');
  html.push('<head>');
  html.push('<meta charset="UTF-8" />');
  html.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
  );
  html.push('<title>MobileView</title>');
  html.push(`<link rel="stylesheet" href="${style}" />`);
  html.push('<script>');
  html.push(`window.edgeros = JSON.parse('${JSON.stringify(opt)}');`);
  html.push('</script>');
  html.push('</head>');

  return html.join('');
}

function getControlHtml(opt: MobileOptions) {
  const { url, refresh, stop, close, dark, mobileType } = opt;
  var html = [];
  html.push('<div class="control">');
  html.push('<div >');
  html.push('<select onchange="checkField(this.value)"  >');
  switch (mobileType) {
    case MobileType.IPhoneX:
			html.push('<option value ="iphonex">IPhoneX</option>');
      html.push('<option value ="iphone8">IPhone8</option>');
      html.push('<option value="pixel1">Pixel</option>');
      break;
    case MobileType.IPhone8:
			html.push('<option value ="iphone8">IPhone8</option>');
      html.push('<option value ="iphonex">IPhoneX</option>');
      html.push('<option value="pixel1">Pixel</option>');
      break;
    case MobileType.Pixel:
			html.push('<option value="pixel1">Pixel</option>');
      html.push('<option value ="iphonex">IPhoneX</option>');
      html.push('<option value ="iphone8">IPhone8</option>');
      break;
  }

  html.push('</select>');
  html.push('</div>');
  html.push('<div style="cursor: pointer" id="refresh">');
  html.push(`<img src="${refresh}" style="width: 20px; height: 20px" />`);
  html.push('</div>');
  html.push(
    '<div style="cursor: pointer" onclick="window.parent.location = document.referrer" >'
  );
  html.push(`<img src="${stop}" style="width: 20px; height: 20px" />`);
  html.push('</div>');
  html.push(
    `<div style="cursor: pointer" onclick="window.open('','_self').close()">`
  );
  html.push(`<img src="${close}" style="width: 20px; height: 20px" />`);
  html.push('</div>');
  html.push('<div style="cursor: pointer" id="dark">');
  html.push(`<img src="${dark}" style="width: 20px; height: 20px" />`);
  html.push('</div>');
  html.push('</div>');

  return html.join('');
}

// FUNCTIONS
function showIphonex(opt: MobileOptions) {
  const { url, appjs, style } = opt;
  return `
     ${getHeadHtml(opt)}
	  <body>
       ${getControlHtml(opt)}
		<section id="section">
		  <div class="iphone-x">
			<div id="side" class="side">
			  <iframe id="myiframe" src="${url}" class="screen" >
			  </iframe>
			</div>
			<div class="line"></div>
			<div id="head" class="header">
			  <div class="sensor-1"></div>
			  <div class="sensor-2"></div>
			  <div class="sensor-3"></div>
			</div>
			<div class="volume-button"></div>
			<div class="power-button"></div>
		  </div>
		</section>
		<div style="margin-top: 10; color: gray; font-size: 14px">
		  ${url}
		</div>
		<script src="${appjs}" ></script>
		 
	  </body>
	</html>
	`;
}

function showIphone8(opt: MobileOptions) {
  const { url, appjs, style } = opt;
  return `
	${getHeadHtml(opt)}
    <body>
		${getControlHtml(opt)}
      <div class="center">
        <div class="mobile">
          <div id="side" class="side">
            <iframe src="${url}" class="screen" ></iframe>
          </div>
  
          <div class="home"></div>
          <div class="inner"></div>
          <ul class="volumn">
            <li></li>
            <li></li>
          </ul>
          <ul class="silent">
            <li></li>
          </ul>
          <ul class="sleep">
            <li></li>
          </ul>
        </div>
        <div class="url" style="margin-top: 10; color: gray; font-size: 14px">
          ${url}
        </div>
      </div>
      <script src="${appjs}" ></script>
    </body>
  </html>
  
	  `;
}

function showPixel(opt: MobileOptions) {
  const { url, appjs, style } = opt;
  return `
	  ${getHeadHtml(opt)}
	  <body>
	  <div class="phone">
		${getControlHtml(opt)}
		  <div class="phone-top">
		  <span class="camera"></span>
		  <span class="sensor"></span>
		  <span class="speaker"></span>
		  </div>
		  <div class="top-bar"></div>
		  <div id="side" class="side">
		  <iframe src="${url}" class="phone-screen" > </iframe>
		  </div>
		  <div class="buttons">
		  <span class="sleep"></span>
		  <span class="down"></span>
		  </div>
		  <div class="bottom-bar"></div>
		  <div class="phone-bottom">
		  <span></span>
		  </div>
		  <div class="url" style="margin-top: 10; color: gray; font-size: 14px">
		  ${url}
		  </div>
	  </div>
	  </div>
	  <script src="${appjs}" ></script>
	  </body>
	  </html>
	  `;
}
