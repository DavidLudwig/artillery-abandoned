
var ctx = createAudioContext();

if (!ctx) {
  document.write(
    '<p>The <a href="https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html">' +
    'Web Audio APIs</a> don\'t appear to be supported in your browser.</p>');
} else {
  document.write('<button onclick="playTone()">Play Tone</button>');
}

function playTone() {
  var offset = 0;
  var node = ctx.createJavaScriptNode(1024, 0, 1);
  node.onaudioprocess = function(e) {
    var buffer = e.outputBuffer;
    var left = buffer.getChannelData(0);
    var right = buffer.getChannelData(1);
    for (var i = 0; i < left.length; i++) {
	  var v = Math.PI * offset; 
	  offset++;
      left[i] = right[i] = Math.sin(2000 * v / 44100);
    }
  };
  node.connect(ctx.destination);

  setTimeout(function() { node.disconnect(); }, 1000);
}

function createAudioContext() {
  if ('AudioContext' in window) {
    return new AudioContext();
  } else if ('webkitAudioContext' in window) {
    return new webkitAudioContext();
  } else {
    return null;
  }
}
