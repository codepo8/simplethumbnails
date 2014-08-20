/*
  simplethumbnails by Christian Heilmann
  Version: 1.0
  Homepage: http://makethumbnails.com
  Copyright (c) 2012, Christian Heilmann
  Code licensed under the BSD License:
  http://wait-till-i.com/license.txt
*/
(function(){
  var s  = document.querySelector('#dropzone');
  var o  = document.querySelector('output');
  var t  = document.querySelector('#thumbslist');
  var tt  = document.querySelector('#thumbstrigger');
  var log  = document.querySelector('#log ul');
  var f = document.querySelector('#options form');
  var c = document.querySelector('#options canvas');
  var di = document.querySelector('#options img.demo');
  var pi = document.querySelector('#options .preview');
  var ps = document.querySelector('#previewsize');
  var pin = document.querySelector('#pin');
  var cx = c.getContext('2d');
  var thumbwidth = 100;
  var thumbheight = 100;
  var crop = false;
  var background = '#ffffff';
  var jpeg = false;
  var quality = 0.8;
  var zip;
  var file;
  var thumbsshown = false;
  var fileslength;
  var current = 0;

  function init() {
    if (typeof FileReader !== 'undefined') {
      document.body.classList.add('dragdrop');
      s.querySelector('p').innerHTML = 'Drag and drop some images here!';
      s.addEventListener('dragover', function ( ev ) {
        ev.preventDefault();
      }, false );
      s.addEventListener('drop', getfiles, false );
      f.addEventListener('change', previewoptions,false);
      di.addEventListener('load',previewoptions, false);
      tt.addEventListener('click',togglethumbs, false);
      pin.addEventListener('click', function(ev){
        window.open('index.html#dropzone', 'pinned', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=300,height=300');
        ev.preventDefault();
      }, false);
      iwanttoretrieve();
      previewoptions();
    }
  }
  function togglethumbs(ev) {
    this.classList.toggle('active');
    t.classList.toggle('show');
    thumbsshown = !thumbsshown;
    ev.preventDefault();
  }

  function previewoptions() {
    grabformvalues();
    pi.innerHTML = '';
    imagetocanvas(di, thumbwidth, thumbheight, crop, background, name, true);
    var thumb = new Image();
    thumb.className = 'preview';
    var url = jpeg ? c.toDataURL('image/jpeg', quality) : c.toDataURL();
    thumb.src = url;
    pi.appendChild(thumb);
    ps.innerHTML = '('+Math.round(url.length / 1000 * 100) / 100+'KB)';
  }

  function grabformvalues() {
    thumbwidth  = document.querySelector('#width').value;
    thumbheight = document.querySelector('#height').value;
    crop = !document.querySelector('#crop').checked;
    background = document.querySelector('#bg').value;
    jpeg  = document.querySelector('#jpeg').value;
    quality = document.querySelector('#quality').value / 100;
    localStorage.setItem('simplethumbnails',JSON.stringify({
      thumbwidth: thumbwidth,
      thumbheight: thumbheight,
      crop: crop,
      jpeg: jpeg,
      background: background,
      quality: quality
    }));
  }

  function iwanttoretrieve() {
    var settings = localStorage.getItem('simplethumbnails');
    if (settings) {
      settings = JSON.parse(settings);
      thumbwidth  = settings.thumbwidth;
      document.querySelector('#width').value = settings.thumbwidth;
      thumbheight = settings.thumbheight;
      document.querySelector('#height').value = settings.thumbheight;
      crop = !settings.crop;
      document.querySelector('#crop').checked = !settings.crop;
      background = settings.background;
      document.querySelector('#bg').value = settings.background;
      jpeg  = settings.jpeg;
      document.querySelector('#jpeg').value = jpeg;
      quality = settings.quality;
      document.querySelector('#quality').value = quality * 100;
    }
  }

  function getfiles(ev) {
    s.querySelector('p').innerHTML = 'Getting images, creating thumbnails…';
    t.innerHTML = '<li>Click any of the thumbnails to download them or <button class="mega-octicon octicon-file-zip"><span>get them all as a ZIP</span></button></li>';
    var files = ev.dataTransfer.files,
        url = window.URL || window.webkitURL,
        objURL = url.createObjectURL || false;
    if ( files.length > 0 ) {
      var i = files.length;
      fileslength = i;
      while ( i-- ) {
        var file = files[ i ];
        if ( file.type.indexOf('image') === -1 ) { continue; }
        if(objURL) {
          loadImage(url.createObjectURL(file),file.name);
        } else {
          var reader = new FileReader();
          reader.readAsDataURL( file );
          reader.onload = function ( ev ) {
            loadImage(ev.target.result,file.name);
          }
        }
      }
    }
    t.querySelector('button').addEventListener('click', zipit, false);
    ev.preventDefault();
  }

  function loadImage(file, name) {
    var img = new Image();
    img.src = file;
    img.onload = function() {
      grabformvalues();
      imagetocanvas(this, thumbwidth, thumbheight, crop, background, name);
    };
  }
  function imagetocanvas(img, w, h, crop, b, name, preview) {
    c.width = w;
    c.height = h;
    var dimensions = resize( img.width, img.height, w, h );
    if (crop) {
      c.width = dimensions.w;
      c.height = dimensions.h;
      dimensions.x = 0;
      dimensions.y = 0;
    }
    if (b !== 'transparent') {
      cx.fillStyle = b;
      cx.fillRect (0, 0, thumbwidth, thumbheight);
    }
    cx.drawImage(
      img, dimensions.x, dimensions.y, dimensions.w, dimensions.h
    );
    if (!preview) {
      addtothumbslist(jpeg, quality, name);
    }
  }

  function addtothumbslist(jpeg, quality, name) {
    var thumb = new Image(),
        url = jpeg ? c.toDataURL('image/jpeg', quality) : c.toDataURL();
    thumb.src = url;
    var thumbname = name.split('.');
    thumbname = thumbname[0] + '_tn.' + (jpeg ? 'jpg' : thumbname[1]);
    thumb.title = thumbname +' ' + Math.round(url.length / 1000 * 100) / 100 + ' KB';
    thumb.setAttribute('data-filename', thumbname);
    // log.innerHTML += '<li>Thumbnail: '+thumbname+' '+'('+Math.round(url.length / 1000 * 100) / 100+'KB)</li>';
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = url;
    link.download = thumbname;
    var textlabel = document.createElement('span');
    textlabel.innerHTML = thumb.title;
    link.appendChild(thumb);
    item.appendChild(link);
    item.appendChild(textlabel);
    t.appendChild(item);
    current++;
    if (current === fileslength) {
      if (!thumbsshown) {
        zipit();
      } else {
        s.querySelector('p').innerHTML = 'Check out your thumbnails below!';
      }
    }
  }
  function zipit() {
    current = 0;
    var zip = new JSZip();
    var imgs = o.querySelectorAll('img');
    var allimgs = imgs.length;
    while (allimgs--) {
      zip.file(
        imgs[allimgs].getAttribute('data-filename'),
        imgs[allimgs].src.substr(imgs[allimgs].src.indexOf(',') + 1),
        { base64: true }
      );
    }
    saveAs(
      zip.generate({type: 'blob'}),
      'thumbnails.zip'
    );
    s.querySelector('p').innerHTML = 'Drag and drop some images here!';
  }

  function resize(imagewidth, imageheight, thumbwidth, thumbheight) {
    var w = 0, h = 0, x = 0, y = 0,
        widthratio  = imagewidth / thumbwidth,
        heightratio = imageheight / thumbheight,
        maxratio    = Math.max( widthratio, heightratio );
    if ( maxratio > 1 ) {
        w = imagewidth / maxratio;
        h = imageheight / maxratio;
    } else {
        w = imagewidth;
        h = imageheight;
    }
    x = ( thumbwidth - w ) / 2;
    y = ( thumbheight - h ) / 2;
    return { w:w, h:h, x:x, y:y };
  }
  init();
})();

if (window.location.hash === '') {
  window.location.hash = 'dropzone';
}

