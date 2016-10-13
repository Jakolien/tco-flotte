require("nightmare")({ show: true })
  .goto('http://localhost:3000/#/print')
  .wait(5000)
  .pdf('screenshot.pdf', { landscape: true, pageSize: 'A4', printBackground: true }, function() {
    console.log('Done!');
    process.exit();
  })
  .run();
