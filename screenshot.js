require("nightmare")()
  .goto('http://localhost:3000/#/visualization')
  .wait(5000)
  .pdf('screenshot.pdf', { landscape: true, pageSize: 'A4', printBackground: true }, function() {
    console.log('Done!')
  })
  .run();
