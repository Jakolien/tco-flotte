var marked = require('marked');
var path = require('path');
var fs = require('fs');

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      return null;
    }
    return entity;
  };
}

export function show(req, res) {
  // Build filename path
  const filename = path.format({
    root: path.join(__dirname, '../../components/pages', req.params.id, '/'),
    name: req.params.language,
    ext: '.md'
  });
  // Open the file
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).send({ error: 'Not found' }).end();
    }
    res.json({
      id: req.params.id,
      language: req.params.language,
      content: marked(data)
    });
  });
}
