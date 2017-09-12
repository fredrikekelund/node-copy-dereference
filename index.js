var fs = require('fs')
var path = require('path')

module.exports = copyDereference
function copyDereference () {
  throw new Error("This function does not exist. Use require('copy-dereference').sync")
}

module.exports.sync = copyDereferenceSync
function copyDereferenceSync (src, dest) {
  // We could try readdir'ing and catching ENOTDIR exceptions, but that is 3x
  // slower than stat'ing in the common case that we have a file.
  var srcStats = fs.statSync(src)

  try {
    var destStats = fs.statSync(path.resolve(process.cwd(), dest))

    if (srcStats.mtime <= destStats.mtime) {
      return;
    }
  } catch (error) {
    // Assume that file didn't exist, do nothing
  }

  if (srcStats.isDirectory()) {
    // We do not copy the directory mode by passing a second argument to
    // mkdirSync, because we wouldn't be able to populate read-only
    // directories. If we really wanted to preserve directory modes, we could
    // call chmodSync at the end.
    fs.mkdirSync(dest)
    var entries = fs.readdirSync(src).sort()
    for (var i = 0; i < entries.length; i++) {
      copyDereferenceSync(path.join(src, entries[i]), path.join(dest, entries[i]))
    }
  } else if (srcStats.isFile()) {
    var contents = fs.readFileSync(src)
    fs.unlinkSync(dest)
    fs.writeFileSync(dest, contents, { flag: 'wx', mode: srcStats.mode })
  } else {
    throw new Error('Unexpected file type for ' + src)
  }
  fs.utimesSync(dest, srcStats.atime, srcStats.mtime)
}
